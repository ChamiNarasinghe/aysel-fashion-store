-- scripts/consolidate-carts.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- CART CONSOLIDATION — one-time operator procedure
-- Run in the Supabase SQL editor as the postgres role.
-- DO NOT run as the authenticated role (it lacks DELETE on carts by design).
--
-- PURPOSE
--   Merge all duplicate active carts into the oldest active cart per user,
--   then mark the source carts abandoned.  Required before applying
--   migration 014 (idx_carts_one_active_per_user).
--
-- PREREQUISITES
--   1. Confirm all 318 expected variants are present (run audit-variants.mjs
--      Step 1 queries and insert any missing rows).
--   2. Do NOT apply migration 014 before this script succeeds — the unique
--      index will reject the script if duplicate active carts still exist.
--
-- AFTER THIS SCRIPT SUCCEEDS
--   Apply migration 014 (idx_carts_one_active_per_user).
--
-- ── CONCURRENCY STRATEGY ─────────────────────────────────────────────────────
--
-- This is a one-time maintenance operation requiring a brief maintenance
-- window (typically < 1 second for a small dataset).
--
-- We use explicit table-level locks.  Here is why each alternative is
-- insufficient on its own:
--
--   FOR UPDATE NOWAIT (row-level)
--     Locks rows that exist at the moment the SELECT runs.  A concurrent
--     INSERT of a new cart_items row into a locked cart succeeds because the
--     new row did not exist when the lock was taken.  Row locks do not prevent
--     phantom inserts.
--
--   SERIALIZABLE isolation
--     Detects conflicts only between transactions that are themselves running
--     at SERIALIZABLE.  PostgREST and Supabase client connections run at
--     READ COMMITTED by default and are not serializable peers — they will
--     not be aborted by a serialization conflict.
--
--   LOCK TABLE IN SHARE ROW EXCLUSIVE MODE  ← chosen strategy
--     Conflicts with ROW EXCLUSIVE, the lock mode acquired by any INSERT,
--     UPDATE, or DELETE on the locked table.  Any concurrent transaction that
--     attempts to write to carts or cart_items will block until this
--     transaction commits or rolls back, regardless of the concurrent
--     transaction's isolation level.  The lock is released automatically
--     when this transaction ends.
--
-- Impact on application requests during the operation:
--   Writes to carts or cart_items (add to cart, remove item, update quantity)
--   pause at lock acquisition and resume immediately after this transaction
--   ends.  Read-only requests (viewing the cart) are unaffected — SHARE ROW
--   EXCLUSIVE does not conflict with ACCESS SHARE (SELECT).
--
-- ── STOCK PLACEHOLDER POLICY ─────────────────────────────────────────────────
--
-- The database has no reliable inventory-verification indicator.  All
-- stock_quantity values in the seed are placeholders:
--   0 = unavailable (size not offered in this colour)
--   1 = available, actual quantity unknown
--
-- This procedure preserves all customer quantities unconditionally.
-- No quantity is reduced or capped during consolidation.
-- Checkout is responsible for validating actual stock before accepting an order.
-- Items with stock_quantity = 0 remain in the cart and must be flagged as
-- unavailable at checkout — they are never silently deleted here.
--
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- Acquire table-level locks before any reads or writes.
-- SHARE ROW EXCLUSIVE conflicts with INSERT/UPDATE/DELETE (ROW EXCLUSIVE mode)
-- on both tables, blocking all concurrent cart writes for the duration of
-- this transaction.  It does not block concurrent SELECTs.
LOCK TABLE carts       IN SHARE ROW EXCLUSIVE MODE;
LOCK TABLE cart_items  IN SHARE ROW EXCLUSIVE MODE;

DO $$
DECLARE
  v_user               RECORD;
  v_target_cart_id     UUID;
  v_source_cart        RECORD;
  v_source_item        RECORD;
  v_target_item        RECORD;
  v_merged_qty         INTEGER;
  v_source_item_count  INTEGER;
  v_transferred_count  INTEGER;
  v_remaining_dupes    INTEGER;
  v_abandoned_ids      UUID[] := '{}';   -- tracks every cart abandoned here
BEGIN

  -- ── STEP 1: Identify users with more than one active cart ─────────────────

  FOR v_user IN
    SELECT user_id, COUNT(*) AS cart_count
    FROM   carts
    WHERE  status = 'active'
    GROUP  BY user_id
    HAVING COUNT(*) > 1
  LOOP

    RAISE NOTICE 'Processing user % — % active carts',
      v_user.user_id, v_user.cart_count;

    -- ── STEP 2: Choose the target cart (oldest active cart) ───────────────

    SELECT id INTO STRICT v_target_cart_id
    FROM   carts
    WHERE  user_id = v_user.user_id
      AND  status  = 'active'
    ORDER  BY created_at ASC
    LIMIT  1;

    -- ── STEP 3: Process each source cart ──────────────────────────────────

    FOR v_source_cart IN
      SELECT id
      FROM   carts
      WHERE  user_id = v_user.user_id
        AND  status  = 'active'
        AND  id     <> v_target_cart_id
      ORDER  BY created_at ASC
    LOOP

      RAISE NOTICE '  Merging source cart % into target cart %',
        v_source_cart.id, v_target_cart_id;

      SELECT COUNT(*) INTO v_source_item_count
      FROM   cart_items
      WHERE  cart_id = v_source_cart.id;

      v_transferred_count := 0;

      -- ── STEP 4: Transfer or merge each source item ────────────────────

      FOR v_source_item IN
        SELECT ci.id, ci.variant_id, ci.quantity
        FROM   cart_items ci
        WHERE  ci.cart_id = v_source_cart.id
        ORDER  BY ci.id ASC
      LOOP

        -- Guard: variant must exist (FK should guarantee this, but be explicit).
        IF NOT EXISTS (
          SELECT 1 FROM product_variants WHERE id = v_source_item.variant_id
        ) THEN
          RAISE EXCEPTION
            'Variant % referenced by cart_item % does not exist in '
            'product_variants. Aborting — no data has been changed.',
            v_source_item.variant_id, v_source_item.id;
        END IF;

        -- Does the target cart already contain this variant?
        SELECT id, quantity INTO v_target_item
        FROM   cart_items
        WHERE  cart_id    = v_target_cart_id
          AND  variant_id = v_source_item.variant_id;

        IF FOUND THEN
          -- ── Variant already in target: combine quantities ──────────────
          --
          -- Quantities are combined unconditionally.  There is no stock cap.
          -- All stock_quantity values are placeholders (0 = unavailable,
          -- 1 = available but quantity unknown).  Neither value is verified
          -- inventory.  Checkout must validate actual stock before accepting
          -- an order.  Items with stock_quantity = 0 remain in the cart and
          -- are flagged at checkout — they are not removed here.

          v_merged_qty := v_target_item.quantity + v_source_item.quantity;

          -- Both source and target satisfy CHECK (quantity > 0), so their
          -- sum must be >= 2.  Assert this explicitly.
          IF v_merged_qty < 2 THEN
            RAISE EXCEPTION
              'Unexpected merged quantity % for variant % '
              '(source qty=%, target qty=%). '
              'Aborting — no data has been changed.',
              v_merged_qty, v_source_item.variant_id,
              v_source_item.quantity, v_target_item.quantity;
          END IF;

          -- Update target first, then remove the now-redundant source row.
          UPDATE cart_items
          SET    quantity   = v_merged_qty,
                 updated_at = NOW()
          WHERE  id = v_target_item.id;

          -- Source row is removed only after the target has been updated.
          -- This is the only DELETE in this procedure.
          DELETE FROM cart_items WHERE id = v_source_item.id;

        ELSE
          -- ── Variant not in target: move the item ──────────────────────
          -- Reassign cart_id; all other fields (quantity, variant_id, etc.)
          -- are preserved exactly.
          UPDATE cart_items
          SET    cart_id    = v_target_cart_id,
                 updated_at = NOW()
          WHERE  id = v_source_item.id;

        END IF;

        v_transferred_count := v_transferred_count + 1;

      END LOOP; -- source items

      -- ── STEP 5: Verify item count before abandoning source cart ──────────

      IF v_transferred_count <> v_source_item_count THEN
        RAISE EXCEPTION
          'Item count mismatch for source cart %: expected %, processed %. '
          'Aborting — no data has been changed.',
          v_source_cart.id, v_source_item_count, v_transferred_count;
      END IF;

      -- Confirm the source cart is physically empty.
      IF EXISTS (SELECT 1 FROM cart_items WHERE cart_id = v_source_cart.id) THEN
        RAISE EXCEPTION
          'Source cart % still contains items after transfer. '
          'Aborting — no data has been changed.',
          v_source_cart.id;
      END IF;

      -- ── STEP 6: Abandon the now-empty source cart ─────────────────────────
      UPDATE carts
      SET    status     = 'abandoned',
             updated_at = NOW()
      WHERE  id = v_source_cart.id;

      -- Record this cart ID so the global post-check can verify it by ID,
      -- not by timestamp.
      v_abandoned_ids := v_abandoned_ids || v_source_cart.id;

      RAISE NOTICE '  Source cart % abandoned. % item(s) transferred.',
        v_source_cart.id, v_transferred_count;

    END LOOP; -- source carts

  END LOOP; -- users

  -- ── STEP 7: Post-consolidation assertions ─────────────────────────────────
  -- Both checks run inside the same transaction.  Any failure raises an
  -- exception, which causes a full automatic rollback of everything above.

  -- 7a. No user may have more than one active cart.
  SELECT COUNT(*) INTO v_remaining_dupes
  FROM (
    SELECT user_id
    FROM   carts
    WHERE  status = 'active'
    GROUP  BY user_id
    HAVING COUNT(*) > 1
  ) dupes;

  IF v_remaining_dupes > 0 THEN
    RAISE EXCEPTION
      'Post-consolidation check failed: % user(s) still have duplicate active '
      'carts. Aborting — no data has been changed.',
      v_remaining_dupes;
  END IF;

  -- 7b. Every cart abandoned by this procedure must be empty.
  --     We check by the exact IDs we collected — no timestamp heuristics.
  IF EXISTS (
    SELECT 1
    FROM   cart_items
    WHERE  cart_id = ANY(v_abandoned_ids)
  ) THEN
    RAISE EXCEPTION
      'Post-consolidation check failed: at least one abandoned cart still '
      'contains items. Aborting — no data has been changed.';
  END IF;

  RAISE NOTICE 'Consolidation complete. % source cart(s) abandoned. '
               'All assertions passed.',
    array_length(v_abandoned_ids, 1);
  RAISE NOTICE 'Next step: apply migration 014 (idx_carts_one_active_per_user).';

END $$;

-- Reached only if the DO block completed without raising an exception.
-- Any RAISE EXCEPTION above causes an automatic full rollback; COMMIT is
-- never reached in that case.
COMMIT;
