-- Migration 014: enforce one active cart per authenticated user
-- ─────────────────────────────────────────────────────────────────────────────
-- Without this index, concurrent requests or repeated login events can create
-- multiple active carts for the same user, causing the merge logic in Phase
-- 10.7.3 to operate on the wrong cart or produce duplicate cart_items rows.
--
-- A partial unique index on (user_id) WHERE status = 'active' enforces the
-- constraint at the database level without affecting abandoned or completed
-- carts, which may legitimately have multiple rows per user over time.
--
-- Safe to run more than once: IF NOT EXISTS prevents an error on re-execution.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE UNIQUE INDEX IF NOT EXISTS idx_carts_one_active_per_user
  ON public.carts (user_id)
  WHERE status = 'active';
