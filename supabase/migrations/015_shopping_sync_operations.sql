-- Migration 015: Shopping synchronization idempotency infrastructure
-- This migration creates operation records and database-side hashing helpers.
-- It intentionally does not implement cart or wishlist mutations.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.shopping_sync_operations (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL,
  operation_id TEXT NOT NULL,
  payload_hash CHAR(64) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  result JSONB,
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  PRIMARY KEY (user_id, operation_type, operation_id),
  CONSTRAINT shopping_sync_operations_valid_type
    CHECK (operation_type IN ('cart', 'wishlist')),
  CONSTRAINT shopping_sync_operations_valid_status
    CHECK (status IN ('pending', 'completed', 'failed')),
  CONSTRAINT shopping_sync_operations_valid_payload_hash
    CHECK (payload_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT shopping_sync_operations_valid_operation_id
    CHECK (char_length(operation_id) BETWEEN 1 AND 128),
  CONSTRAINT shopping_sync_operations_valid_timestamp_status
    CHECK (
      (status = 'pending' AND completed_at IS NULL)
      OR
      (status IN ('completed', 'failed') AND completed_at IS NOT NULL)
    ),
  CONSTRAINT shopping_sync_operations_valid_result_status
    CHECK (
      (status = 'pending' AND result IS NULL)
      OR
      (status IN ('completed', 'failed') AND result IS NOT NULL)
    ),
  CONSTRAINT shopping_sync_operations_valid_attempt_count
    CHECK (attempt_count >= 0)
);

CREATE INDEX IF NOT EXISTS idx_shopping_sync_operations_owner_status
  ON public.shopping_sync_operations (user_id, status, updated_at DESC);

ALTER TABLE public.shopping_sync_operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers read own shopping sync operations"
  ON public.shopping_sync_operations
  FOR SELECT
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS shopping_sync_operations_updated_at
  ON public.shopping_sync_operations;

CREATE TRIGGER shopping_sync_operations_updated_at
  BEFORE UPDATE ON public.shopping_sync_operations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Browser clients receive SELECT only. No policy or grant permits direct writes.
REVOKE ALL ON TABLE public.shopping_sync_operations FROM PUBLIC;
REVOKE ALL ON TABLE public.shopping_sync_operations FROM anon;
REVOKE ALL ON TABLE public.shopping_sync_operations FROM authenticated;
GRANT SELECT ON TABLE public.shopping_sync_operations TO authenticated;

-- Canonical payload contract
--
-- Cart payload:
-- {
--   "items": [{
--     "numeric_product_id": integer,
--     "size": "XS"|"S"|"M"|"L"|"XL"|"XXL",
--     "normalized_color": lowercase/non-empty canonical match key,
--     "quantity": integer,
--     "guest_line_ids": [stable non-empty strings],
--   "guest_lines": [{"line_id": string, "line_version": positive integer}],
--     "guest_line_version": integer (optional),
--     "database_product_uuid": canonical UUID (optional)
--   }]
-- }
--
-- Wishlist payload:
-- {
--   "products": [{
--     "numeric_product_id": integer,
--     "guest_line_ids": [stable non-empty strings],
--     "guest_lines": [{"line_id": string, "line_version": positive integer}],
--     "guest_line_version": integer (optional),
--     "database_product_uuid": canonical UUID (optional)
--   }]
-- }
--
-- Display-only fields such as name, slug, image, price, stock and availability
-- are not accepted by this canonical contract. Object keys are canonicalized,
-- cart/wishlist arrays are sorted deterministically, and guest line IDs are sorted.
--
-- Payload limits are deliberate bounds for bounded canonicalization:
-- • Cart items: maximum 100.
-- • Wishlist products: maximum 100.
-- • Guest line IDs per item/product: maximum 20.
-- • Guest line ID text: maximum 128 characters after trimming.
-- • Normalized colour text: maximum 64 characters after trimming.
-- These limits avoid oversized canonical JSON while preserving the existing identity contract.

CREATE OR REPLACE FUNCTION public.canonicalize_shopping_payload(
  p_operation_type TEXT,
  p_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
DECLARE
  v_type TEXT;
  v_extra_key TEXT;
  v_item JSONB;
  v_items JSONB := '[]'::JSONB;
  v_product JSONB;
  v_products JSONB := '[]'::JSONB;
  v_line_ids TEXT[];
  v_line_id TEXT;
  v_numeric_id BIGINT;
  v_quantity BIGINT;
  v_version BIGINT;
  v_size TEXT;
  v_color TEXT;
  v_database_uuid TEXT;
  v_line_element JSONB;
  v_all_line_ids TEXT[] := '{}';
  v_guest_lines JSONB := '[]'::JSONB;
  v_guest_line JSONB;
  v_guest_line_id TEXT;
  v_guest_line_version BIGINT;
  v_canonical_item JSONB;
  v_canonical_product JSONB;
BEGIN
  IF p_operation_type IS NULL THEN
    RAISE EXCEPTION 'operation_type is required'
      USING ERRCODE = '22023';
  END IF;

  v_type := lower(btrim(p_operation_type));
  IF v_type NOT IN ('cart', 'wishlist') THEN
    RAISE EXCEPTION 'invalid operation_type'
      USING ERRCODE = '22023';
  END IF;

  IF p_payload IS NULL OR jsonb_typeof(p_payload) <> 'object' THEN
    RAISE EXCEPTION 'payload must be a JSON object'
      USING ERRCODE = '22023';
  END IF;

  IF v_type = 'cart' THEN
    IF NOT (p_payload ? 'items') OR jsonb_typeof(p_payload -> 'items') <> 'array' THEN
      RAISE EXCEPTION 'cart payload must contain an items array'
        USING ERRCODE = '22023';
    END IF;
    IF jsonb_array_length(p_payload -> 'items') > 100 THEN
      RAISE EXCEPTION 'cart payload cannot contain more than 100 items'
        USING ERRCODE = '22023';
    END IF;

    FOR v_extra_key IN
      SELECT key FROM jsonb_object_keys(p_payload) AS key
      WHERE key <> 'items'
    LOOP
      RAISE EXCEPTION 'cart payload contains unrecognized key: %', v_extra_key
        USING ERRCODE = '22023';
    END LOOP;

    FOR v_item IN SELECT item FROM jsonb_array_elements(p_payload -> 'items') AS t(item)
    LOOP
      IF jsonb_typeof(v_item) <> 'object' THEN
        RAISE EXCEPTION 'cart item must be a JSON object'
          USING ERRCODE = '22023';
      END IF;

      FOR v_extra_key IN
        SELECT key FROM jsonb_object_keys(v_item) AS key
        WHERE key NOT IN (
          'numeric_product_id',
          'size',
          'normalized_color',
          'quantity',
          'guest_line_ids',
          'guest_lines',
          'guest_line_version',
          'database_product_uuid'
        )
      LOOP
        RAISE EXCEPTION 'cart item contains unrecognized key: %', v_extra_key
          USING ERRCODE = '22023';
      END LOOP;

      IF NOT (
        v_item ? 'numeric_product_id'
        AND v_item ? 'size'
        AND v_item ? 'normalized_color'
        AND v_item ? 'quantity'
        AND (v_item ? 'guest_line_ids' OR v_item ? 'guest_lines')
      ) THEN
        RAISE EXCEPTION 'cart item is missing required identity or quantity fields'
          USING ERRCODE = '22023';
      END IF;

      IF jsonb_typeof(v_item -> 'numeric_product_id') <> 'number'
        OR (v_item ->> 'numeric_product_id') !~ '^[0-9]+$'
      THEN
        RAISE EXCEPTION 'numeric_product_id must be a positive integer'
          USING ERRCODE = '22023';
      END IF;
      v_numeric_id := (v_item ->> 'numeric_product_id')::BIGINT;
      IF v_numeric_id <= 0 OR v_numeric_id > 2147483647 THEN
        RAISE EXCEPTION 'numeric_product_id is out of range'
          USING ERRCODE = '22023';
      END IF;

      IF jsonb_typeof(v_item -> 'size') <> 'string' THEN
        RAISE EXCEPTION 'size must be a string'
          USING ERRCODE = '22023';
      END IF;
      v_size := upper(btrim(v_item ->> 'size'));
      IF v_size NOT IN ('XS', 'S', 'M', 'L', 'XL', 'XXL') THEN
        RAISE EXCEPTION 'invalid cart size'
          USING ERRCODE = '22023';
      END IF;

      IF jsonb_typeof(v_item -> 'normalized_color') <> 'string' THEN
        RAISE EXCEPTION 'normalized_color must be a string'
          USING ERRCODE = '22023';
      END IF;
      v_color := lower(btrim(v_item ->> 'normalized_color'));
      IF v_color = '' THEN
        RAISE EXCEPTION 'normalized_color must not be empty'
          USING ERRCODE = '22023';
      END IF;
      IF char_length(v_color) > 64 THEN
        RAISE EXCEPTION 'normalized_color cannot exceed 64 characters'
          USING ERRCODE = '22023';
      END IF;

      IF jsonb_typeof(v_item -> 'quantity') <> 'number'
        OR (v_item ->> 'quantity') !~ '^[0-9]+$'
      THEN
        RAISE EXCEPTION 'quantity must be a positive integer'
          USING ERRCODE = '22023';
      END IF;
      v_quantity := (v_item ->> 'quantity')::BIGINT;
      IF v_quantity <= 0 OR v_quantity > 2147483647 THEN
        RAISE EXCEPTION 'quantity is out of range'
          USING ERRCODE = '22023';
      END IF;

      IF v_item ? 'guest_lines' AND v_item ? 'guest_line_ids' THEN
        RAISE EXCEPTION 'use guest_lines or guest_line_ids, not both'
          USING ERRCODE = '22023';
      END IF;
      IF v_item ? 'guest_lines' AND v_item ? 'guest_line_version' THEN
        RAISE EXCEPTION 'guest_line_version is not shared when guest_lines is used'
          USING ERRCODE = '22023';
      END IF;

      v_guest_lines := '[]'::JSONB;
      v_line_ids := '{}';

      IF v_item ? 'guest_lines' THEN
        IF jsonb_typeof(v_item -> 'guest_lines') <> 'array'
          OR jsonb_array_length(v_item -> 'guest_lines') = 0
          OR jsonb_array_length(v_item -> 'guest_lines') > 20
        THEN
          RAISE EXCEPTION 'guest_lines must contain 1 to 20 guest line objects'
            USING ERRCODE = '22023';
        END IF;

        FOR v_guest_line IN
          SELECT line
          FROM jsonb_array_elements(v_item -> 'guest_lines') AS t(line)
        LOOP
          IF jsonb_typeof(v_guest_line) <> 'object'
            OR NOT (v_guest_line ? 'line_id')
            OR NOT (v_guest_line ? 'line_version')
          THEN
            RAISE EXCEPTION 'guest_lines entries require line_id and line_version'
              USING ERRCODE = '22023';
          END IF;
          IF jsonb_typeof(v_guest_line -> 'line_id') <> 'string' THEN
            RAISE EXCEPTION 'guest line line_id must be a JSON string'
              USING ERRCODE = '22023';
          END IF;
          v_guest_line_id := btrim(v_guest_line ->> 'line_id');
          IF v_guest_line_id = '' OR char_length(v_guest_line_id) > 128 THEN
            RAISE EXCEPTION 'guest line line_id must contain 1 to 128 characters'
              USING ERRCODE = '22023';
          END IF;
          IF jsonb_typeof(v_guest_line -> 'line_version') <> 'number'
            OR (v_guest_line ->> 'line_version') !~ '^[0-9]+$'
          THEN
            RAISE EXCEPTION 'guest line line_version must be a positive integer'
              USING ERRCODE = '22023';
          END IF;
          v_guest_line_version := (v_guest_line ->> 'line_version')::BIGINT;
          IF v_guest_line_version <= 0 OR v_guest_line_version > 2147483647 THEN
            RAISE EXCEPTION 'guest line line_version is out of range'
              USING ERRCODE = '22023';
          END IF;
          IF v_guest_line_id = ANY(v_line_ids)
            OR v_guest_line_id = ANY(v_all_line_ids)
          THEN
            RAISE EXCEPTION 'guest_line_ids must not contain duplicates across the payload'
              USING ERRCODE = '22023';
          END IF;
          v_line_ids := array_append(v_line_ids, v_guest_line_id);
          v_all_line_ids := array_append(v_all_line_ids, v_guest_line_id);
          v_guest_lines := v_guest_lines ||
            jsonb_build_array(jsonb_build_object(
              'line_id', v_guest_line_id,
              'line_version', v_guest_line_version
            ));
        END LOOP;
      ELSE
        IF jsonb_typeof(v_item -> 'guest_line_ids') <> 'array'
          OR jsonb_array_length(v_item -> 'guest_line_ids') = 0
          OR jsonb_array_length(v_item -> 'guest_line_ids') > 20
        THEN
          RAISE EXCEPTION 'guest_line_ids must contain 1 to 20 strings'
            USING ERRCODE = '22023';
        END IF;

        v_version := 0;
        IF v_item ? 'guest_line_version' THEN
          IF jsonb_typeof(v_item -> 'guest_line_version') <> 'number'
            OR (v_item ->> 'guest_line_version') !~ '^[0-9]+$'
          THEN
            RAISE EXCEPTION 'guest_line_version must be a positive integer'
              USING ERRCODE = '22023';
          END IF;
          v_version := (v_item ->> 'guest_line_version')::BIGINT;
          IF v_version <= 0 OR v_version > 2147483647 THEN
            RAISE EXCEPTION 'guest_line_version is out of range'
              USING ERRCODE = '22023';
          END IF;
        END IF;

        FOR v_line_element IN
          SELECT element
          FROM jsonb_array_elements(v_item -> 'guest_line_ids') AS t(element)
        LOOP
          IF jsonb_typeof(v_line_element) <> 'string' THEN
            RAISE EXCEPTION 'guest_line_ids must contain only JSON strings'
              USING ERRCODE = '22023';
          END IF;
          v_guest_line_id := btrim(v_line_element #>> '{}');
          IF v_guest_line_id = '' OR char_length(v_guest_line_id) > 128 THEN
            RAISE EXCEPTION 'guest line line_id must contain 1 to 128 characters'
              USING ERRCODE = '22023';
          END IF;
          IF v_guest_line_id = ANY(v_line_ids)
            OR v_guest_line_id = ANY(v_all_line_ids)
          THEN
            RAISE EXCEPTION 'guest_line_ids must not contain duplicates across the payload'
              USING ERRCODE = '22023';
          END IF;
          v_line_ids := array_append(v_line_ids, v_guest_line_id);
          v_all_line_ids := array_append(v_all_line_ids, v_guest_line_id);
          IF v_version > 0 THEN
            v_guest_lines := v_guest_lines ||
              jsonb_build_array(jsonb_build_object(
                'line_id', v_guest_line_id,
                'line_version', v_version
              ));
          ELSE
            v_guest_lines := v_guest_lines ||
              jsonb_build_array(jsonb_build_object(
                'line_id', v_guest_line_id
              ));
          END IF;
        END LOOP;
      END IF;

      SELECT COALESCE(
        jsonb_agg(line ORDER BY line::TEXT),
        '[]'::JSONB
      )
        INTO v_guest_lines
      FROM jsonb_array_elements(v_guest_lines) AS t(line);

      v_canonical_item := jsonb_build_object(
        'numeric_product_id', v_numeric_id,
        'size', v_size,
        'normalized_color', v_color,
        'quantity', v_quantity,
        'guest_lines', v_guest_lines
      );
    END LOOP;

      IF v_item ? 'database_product_uuid' THEN
        IF jsonb_typeof(v_item -> 'database_product_uuid') <> 'string' THEN
          RAISE EXCEPTION 'database_product_uuid must be a string'
            USING ERRCODE = '22023';
        END IF;
        v_database_uuid := lower(btrim(v_item ->> 'database_product_uuid'));
        IF v_database_uuid !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
          RAISE EXCEPTION 'database_product_uuid is not a canonical UUID'
            USING ERRCODE = '22023';
        END IF;
        v_canonical_item := v_canonical_item ||
          jsonb_build_object('database_product_uuid', v_database_uuid);
      END IF;

      v_items := v_items || jsonb_build_array(v_canonical_item);
    END LOOP;

    IF (
      SELECT count(*)
      FROM jsonb_array_elements(v_items) AS t(item)
    ) <> (
      SELECT count(DISTINCT (
        (item ->> 'numeric_product_id') || '|' ||
        (item ->> 'size') || '|' ||
        (item ->> 'normalized_color')
      ))
      FROM jsonb_array_elements(v_items) AS t(item)
    ) THEN
      RAISE EXCEPTION 'cart payload contains duplicate normalized variants'
        USING ERRCODE = '22023';
    END IF;

    SELECT COALESCE(
      jsonb_agg(item ORDER BY item::TEXT),
      '[]'::JSONB
    )
      INTO v_items
    FROM jsonb_array_elements(v_items) AS item;

    RETURN jsonb_build_object('items', v_items);
  END IF;

  IF NOT (p_payload ? 'products') OR jsonb_typeof(p_payload -> 'products') <> 'array' THEN
    RAISE EXCEPTION 'wishlist payload must contain a products array'
      USING ERRCODE = '22023';
  END IF;
  IF jsonb_array_length(p_payload -> 'products') > 100 THEN
    RAISE EXCEPTION 'wishlist payload cannot contain more than 100 products'
      USING ERRCODE = '22023';
  END IF;

  FOR v_extra_key IN
    SELECT key FROM jsonb_object_keys(p_payload) AS key
    WHERE key <> 'products'
  LOOP
    RAISE EXCEPTION 'wishlist payload contains unrecognized key: %', v_extra_key
      USING ERRCODE = '22023';
  END LOOP;

  FOR v_product IN SELECT product FROM jsonb_array_elements(p_payload -> 'products') AS t(product)
  LOOP
    IF jsonb_typeof(v_product) <> 'object' THEN
      RAISE EXCEPTION 'wishlist product must be a JSON object'
        USING ERRCODE = '22023';
    END IF;

    FOR v_extra_key IN
      SELECT key FROM jsonb_object_keys(v_product) AS key
      WHERE key NOT IN (
        'numeric_product_id',
        'guest_line_ids',
        'guest_line_version',
        'database_product_uuid'
      )
    LOOP
      RAISE EXCEPTION 'wishlist product contains unrecognized key: %', v_extra_key
        USING ERRCODE = '22023';
    END LOOP;

    IF NOT (
      v_product ? 'numeric_product_id'
      AND v_product ? 'guest_line_ids'
    ) THEN
      RAISE EXCEPTION 'wishlist product is missing identity or guest-line fields'
        USING ERRCODE = '22023';
    END IF;

    IF jsonb_typeof(v_product -> 'numeric_product_id') <> 'number'
      OR (v_product ->> 'numeric_product_id') !~ '^[0-9]+$'
    THEN
      RAISE EXCEPTION 'numeric_product_id must be a positive integer'
        USING ERRCODE = '22023';
    END IF;
    v_numeric_id := (v_product ->> 'numeric_product_id')::BIGINT;
    IF v_numeric_id <= 0 OR v_numeric_id > 2147483647 THEN
      RAISE EXCEPTION 'numeric_product_id is out of range'
        USING ERRCODE = '22023';
    END IF;

    IF jsonb_typeof(v_product -> 'guest_line_ids') <> 'array'
      OR jsonb_array_length(v_product -> 'guest_line_ids') = 0
    THEN
      RAISE EXCEPTION 'guest_line_ids must be a non-empty array'
        USING ERRCODE = '22023';
    END IF;
    IF jsonb_array_length(v_product -> 'guest_line_ids') > 20 THEN
      RAISE EXCEPTION 'guest_line_ids cannot contain more than 20 IDs'
        USING ERRCODE = '22023';
    END IF;

    v_line_ids := '{}';

    FOR v_line_element IN
      SELECT element
      FROM jsonb_array_elements(v_product -> 'guest_line_ids') AS t(element)
    LOOP
      IF jsonb_typeof(v_line_element) <> 'string' THEN
        RAISE EXCEPTION 'guest_line_ids must contain only JSON strings'
          USING ERRCODE = '22023';
      END IF;

      v_line_id := btrim(v_line_element #>> '{}');
      IF v_line_id = '' THEN
        RAISE EXCEPTION 'guest_line_ids must contain only non-empty strings'
          USING ERRCODE = '22023';
      END IF;
      IF char_length(v_line_id) > 128 THEN
        RAISE EXCEPTION 'guest_line_ids cannot exceed 128 characters'
          USING ERRCODE = '22023';
      END IF;

      IF v_line_id = ANY(v_line_ids)
        OR v_line_id = ANY(v_all_line_ids)
      THEN
        RAISE EXCEPTION 'guest_line_ids must not contain duplicates across the payload'
          USING ERRCODE = '22023';
      END IF;

      v_line_ids := array_append(v_line_ids, v_line_id);
      v_all_line_ids := array_append(v_all_line_ids, v_line_id);
    END LOOP;

    SELECT array_agg(line_id ORDER BY line_id)
      INTO v_line_ids
    FROM unnest(v_line_ids) AS t(line_id);

    v_canonical_product := jsonb_build_object(
      'numeric_product_id', v_numeric_id,
      'guest_line_ids', to_jsonb(v_line_ids)
    );

    IF v_product ? 'guest_line_version' THEN
      IF jsonb_typeof(v_product -> 'guest_line_version') <> 'number'
        OR (v_product ->> 'guest_line_version') !~ '^[0-9]+$'
      THEN
        RAISE EXCEPTION 'guest_line_version must be a positive integer'
          USING ERRCODE = '22023';
      END IF;
      v_version := (v_product ->> 'guest_line_version')::BIGINT;
      IF v_version <= 0 OR v_version > 2147483647 THEN
        RAISE EXCEPTION 'guest_line_version is out of range'
          USING ERRCODE = '22023';
      END IF;
      v_canonical_product := v_canonical_product ||
        jsonb_build_object('guest_line_version', v_version);
    END IF;

    IF v_product ? 'database_product_uuid' THEN
      IF jsonb_typeof(v_product -> 'database_product_uuid') <> 'string' THEN
        RAISE EXCEPTION 'database_product_uuid must be a string'
          USING ERRCODE = '22023';
      END IF;
      v_database_uuid := lower(btrim(v_product ->> 'database_product_uuid'));
      IF v_database_uuid !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        RAISE EXCEPTION 'database_product_uuid is not a canonical UUID'
          USING ERRCODE = '22023';
      END IF;
      v_canonical_product := v_canonical_product ||
        jsonb_build_object('database_product_uuid', v_database_uuid);
    END IF;

    v_products := v_products || jsonb_build_array(v_canonical_product);
  END LOOP;

  IF (
    SELECT count(*)
    FROM jsonb_array_elements(v_products) AS t(product)
  ) <> (
    SELECT count(DISTINCT (product ->> 'numeric_product_id'))
    FROM jsonb_array_elements(v_products) AS t(product)
  ) THEN
    RAISE EXCEPTION 'wishlist payload contains duplicate numeric product identities'
      USING ERRCODE = '22023';
  END IF;

  SELECT COALESCE(
    jsonb_agg(product ORDER BY product::TEXT),
    '[]'::JSONB
  )
    INTO v_products
  FROM jsonb_array_elements(v_products) AS product;

  RETURN jsonb_build_object('products', v_products);
END;
$$;

CREATE OR REPLACE FUNCTION public.shopping_payload_sha256(
  p_operation_type TEXT,
  p_payload JSONB
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $$
BEGIN
  IF p_operation_type IS NULL THEN
    RAISE EXCEPTION 'operation_type is required'
      USING ERRCODE = '22023';
  END IF;
  IF p_payload IS NULL THEN
    RAISE EXCEPTION 'payload is required'
      USING ERRCODE = '22023';
  END IF;

  RETURN encode(
    extensions.digest(
      convert_to(
        jsonb_build_object(
          'operation_type',
          lower(btrim(p_operation_type)),
          'payload',
          public.canonicalize_shopping_payload(p_operation_type, p_payload)
        )::TEXT,
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.canonicalize_shopping_payload(TEXT, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.canonicalize_shopping_payload(TEXT, JSONB) FROM anon;
GRANT EXECUTE ON FUNCTION public.canonicalize_shopping_payload(TEXT, JSONB) TO authenticated;

REVOKE ALL ON FUNCTION public.shopping_payload_sha256(TEXT, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.shopping_payload_sha256(TEXT, JSONB) FROM anon;
GRANT EXECUTE ON FUNCTION public.shopping_payload_sha256(TEXT, JSONB) TO authenticated;

-- Reservation helper
--
-- SECURITY DEFINER is used because direct authenticated INSERT/UPDATE privileges
-- on shopping_sync_operations are intentionally not granted. The function derives
-- user_id exclusively from auth.uid(), validates operation type and payload, and
-- centralizes operation-table writes.
-- These helpers are internal-only: PUBLIC, anon, and authenticated EXECUTE are
-- revoked below. A future C-2B/C-2C PostgreSQL RPC must be a SECURITY DEFINER
-- function owned by the migration owner, or invoke these helpers through an
-- appropriately restricted internal role, and perform reservation, mutation,
-- and completion in one outer transaction.
CREATE OR REPLACE FUNCTION public.shopping_reserve_operation(
  p_operation_type TEXT,
  p_operation_id TEXT,
  p_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_type TEXT;
  v_operation_id TEXT;
  v_payload_hash TEXT;
  v_existing RECORD;
  v_inserted INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED'
      USING ERRCODE = '42501';
  END IF;

  IF p_operation_type IS NULL THEN
    RAISE EXCEPTION 'operation_type is required'
      USING ERRCODE = '22023';
  END IF;
  v_type := lower(btrim(p_operation_type));

  IF v_type NOT IN ('cart', 'wishlist') THEN
    RAISE EXCEPTION 'invalid operation_type'
      USING ERRCODE = '22023';
  END IF;

  IF p_operation_id IS NULL THEN
    RAISE EXCEPTION 'operation_id is required'
      USING ERRCODE = '22023';
  END IF;
  v_operation_id := btrim(p_operation_id);
  IF char_length(v_operation_id) = 0 OR char_length(v_operation_id) > 128 THEN
    RAISE EXCEPTION 'operation_id must contain 1 to 128 characters'
      USING ERRCODE = '22023';
  END IF;

  v_payload_hash := public.shopping_payload_sha256(v_type, p_payload);

  INSERT INTO public.shopping_sync_operations (
    user_id,
    operation_type,
    operation_id,
    payload_hash,
    status,
    attempt_count,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    v_type,
    v_operation_id,
    v_payload_hash,
    'pending',
    1,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id, operation_type, operation_id) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  IF v_inserted = 1 THEN
    RETURN jsonb_build_object(
      'ok', TRUE,
      'status', 'reserved',
      'operation_type', v_type,
      'operation_id', v_operation_id,
      'payload_hash', v_payload_hash,
      'replayed', FALSE
    );
  END IF;

  SELECT *
    INTO v_existing
  FROM public.shopping_sync_operations
  WHERE user_id = v_user_id
    AND operation_type = v_type
    AND operation_id = v_operation_id
  FOR UPDATE;

  IF v_existing IS NULL THEN
    RAISE EXCEPTION 'operation reservation failed'
      USING ERRCODE = 'P0001';
  END IF;

  IF v_existing.payload_hash <> v_payload_hash THEN
    RETURN jsonb_build_object(
      'ok', FALSE,
      'error_code', 'PAYLOAD_CONFLICT',
      'operation_type', v_type,
      'operation_id', v_operation_id
    );
  END IF;

  IF v_existing.status = 'completed' THEN
    RETURN jsonb_build_object(
      'ok', TRUE,
      'status', 'completed',
      'operation_type', v_type,
      'operation_id', v_operation_id,
      'payload_hash', v_payload_hash,
      'replayed', TRUE,
      'result', v_existing.result
    );
  END IF;

  IF v_existing.status = 'failed' THEN
    RETURN jsonb_build_object(
      'ok', TRUE,
      'status', 'failed',
      'operation_type', v_type,
      'operation_id', v_operation_id,
      'payload_hash', v_payload_hash,
      'replayed', TRUE,
      'result', v_existing.result
    );
  END IF;

  IF v_existing.status = 'pending' THEN
    RETURN jsonb_build_object(
      'ok', TRUE,
      'status', 'operation_in_progress',
      'operation_type', v_type,
      'operation_id', v_operation_id,
      'payload_hash', v_payload_hash,
      'replayed', FALSE
    );
  END IF;

  RAISE EXCEPTION 'unsupported operation status'
    USING ERRCODE = 'P0001';
END;
$$;

REVOKE ALL ON FUNCTION public.shopping_reserve_operation(TEXT, TEXT, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.shopping_reserve_operation(TEXT, TEXT, JSONB) FROM anon;
REVOKE EXECUTE ON FUNCTION public.shopping_reserve_operation(TEXT, TEXT, JSONB) FROM authenticated;

-- Completion helper
--
-- The future cart or wishlist mutation must run in the same transaction before
-- this function commits. Repeated completion calls return the stored result.
CREATE OR REPLACE FUNCTION public.shopping_complete_operation(
  p_operation_type TEXT,
  p_operation_id TEXT,
  p_payload JSONB,
  p_result JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_type TEXT;
  v_operation_id TEXT;
  v_payload_hash TEXT;
  v_existing RECORD;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED'
      USING ERRCODE = '42501';
  END IF;

  IF p_operation_type IS NULL THEN
    RAISE EXCEPTION 'operation_type is required'
      USING ERRCODE = '22023';
  END IF;
  v_type := lower(btrim(p_operation_type));
  IF v_type NOT IN ('cart', 'wishlist') THEN
    RAISE EXCEPTION 'invalid operation_type'
      USING ERRCODE = '22023';
  END IF;

  IF p_operation_id IS NULL THEN
    RAISE EXCEPTION 'operation_id is required'
      USING ERRCODE = '22023';
  END IF;
  v_operation_id := btrim(p_operation_id);
  IF char_length(v_operation_id) = 0 OR char_length(v_operation_id) > 128 THEN
    RAISE EXCEPTION 'operation_id must contain 1 to 128 characters'
      USING ERRCODE = '22023';
  END IF;

  IF p_result IS NULL THEN
    RAISE EXCEPTION 'completed result is required'
      USING ERRCODE = '22023';
  END IF;

  v_payload_hash := public.shopping_payload_sha256(v_type, p_payload);

  SELECT *
    INTO v_existing
  FROM public.shopping_sync_operations
  WHERE user_id = v_user_id
    AND operation_type = v_type
    AND operation_id = v_operation_id
  FOR UPDATE;

  IF v_existing IS NULL THEN
    RETURN jsonb_build_object(
      'ok', FALSE,
      'error_code', 'OPERATION_NOT_FOUND',
      'operation_type', v_type,
      'operation_id', v_operation_id
    );
  END IF;

  IF v_existing.payload_hash <> v_payload_hash THEN
    RETURN jsonb_build_object(
      'ok', FALSE,
      'error_code', 'PAYLOAD_CONFLICT',
      'operation_type', v_type,
      'operation_id', v_operation_id
    );
  END IF;

  IF v_existing.status = 'completed' THEN
    RETURN jsonb_build_object(
      'ok', TRUE,
      'status', 'completed',
      'operation_type', v_type,
      'operation_id', v_operation_id,
      'payload_hash', v_payload_hash,
      'replayed', TRUE,
      'result', v_existing.result
    );
  END IF;

  IF v_existing.status = 'failed' THEN
    RETURN jsonb_build_object(
      'ok', TRUE,
      'status', 'failed',
      'operation_type', v_type,
      'operation_id', v_operation_id,
      'payload_hash', v_payload_hash,
      'replayed', TRUE,
      'result', v_existing.result
    );
  END IF;

  IF v_existing.status <> 'pending' THEN
    RAISE EXCEPTION 'operation is not pending'
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.shopping_sync_operations
  SET
    status = 'completed',
    result = p_result,
    completed_at = NOW(),
    updated_at = NOW()
  WHERE user_id = v_user_id
    AND operation_type = v_type
    AND operation_id = v_operation_id;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'status', 'completed',
    'operation_type', v_type,
    'operation_id', v_operation_id,
    'payload_hash', v_payload_hash,
    'replayed', FALSE,
    'result', p_result
  );
END;
$$;

REVOKE ALL ON FUNCTION public.shopping_complete_operation(TEXT, TEXT, JSONB, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.shopping_complete_operation(TEXT, TEXT, JSONB, JSONB) FROM anon;
REVOKE EXECUTE ON FUNCTION public.shopping_complete_operation(TEXT, TEXT, JSONB, JSONB) FROM authenticated;

-- Failed-operation helper
--
-- This helper is intentionally explicit. Future operations may store only
-- deterministic failures with replay semantics. Transient exceptions should
-- normally remain transaction rollbacks and therefore leave no operation record.
CREATE OR REPLACE FUNCTION public.shopping_fail_operation(
  p_operation_type TEXT,
  p_operation_id TEXT,
  p_payload JSONB,
  p_result JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_type TEXT;
  v_operation_id TEXT;
  v_payload_hash TEXT;
  v_existing RECORD;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED'
      USING ERRCODE = '42501';
  END IF;

  IF p_operation_type IS NULL THEN
    RAISE EXCEPTION 'operation_type is required'
      USING ERRCODE = '22023';
  END IF;
  v_type := lower(btrim(p_operation_type));
  IF v_type NOT IN ('cart', 'wishlist') THEN
    RAISE EXCEPTION 'invalid operation_type'
      USING ERRCODE = '22023';
  END IF;

  IF p_operation_id IS NULL THEN
    RAISE EXCEPTION 'operation_id is required'
      USING ERRCODE = '22023';
  END IF;
  v_operation_id := btrim(p_operation_id);
  IF char_length(v_operation_id) = 0 OR char_length(v_operation_id) > 128 THEN
    RAISE EXCEPTION 'operation_id must contain 1 to 128 characters'
      USING ERRCODE = '22023';
  END IF;

  IF p_result IS NULL THEN
    RAISE EXCEPTION 'failed result is required'
      USING ERRCODE = '22023';
  END IF;

  v_payload_hash := public.shopping_payload_sha256(v_type, p_payload);

  SELECT *
    INTO v_existing
  FROM public.shopping_sync_operations
  WHERE user_id = v_user_id
    AND operation_type = v_type
    AND operation_id = v_operation_id
  FOR UPDATE;

  IF v_existing IS NULL THEN
    RETURN jsonb_build_object(
      'ok', FALSE,
      'error_code', 'OPERATION_NOT_FOUND',
      'operation_type', v_type,
      'operation_id', v_operation_id
    );
  END IF;

  IF v_existing.payload_hash <> v_payload_hash THEN
    RETURN jsonb_build_object(
      'ok', FALSE,
      'error_code', 'PAYLOAD_CONFLICT',
      'operation_type', v_type,
      'operation_id', v_operation_id
    );
  END IF;

  IF v_existing.status = 'completed' THEN
    RETURN jsonb_build_object(
      'ok', TRUE,
      'status', 'completed',
      'operation_type', v_type,
      'operation_id', v_operation_id,
      'payload_hash', v_payload_hash,
      'replayed', TRUE,
      'result', v_existing.result
    );
  END IF;

  IF v_existing.status = 'failed' THEN
    RETURN jsonb_build_object(
      'ok', TRUE,
      'status', 'failed',
      'operation_type', v_type,
      'operation_id', v_operation_id,
      'payload_hash', v_payload_hash,
      'replayed', TRUE,
      'result', v_existing.result
    );
  END IF;

  IF v_existing.status <> 'pending' THEN
    RAISE EXCEPTION 'operation is not pending'
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.shopping_sync_operations
  SET
    status = 'failed',
    result = p_result,
    completed_at = NOW(),
    updated_at = NOW()
  WHERE user_id = v_user_id
    AND operation_type = v_type
    AND operation_id = v_operation_id;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'status', 'failed',
    'operation_type', v_type,
    'operation_id', v_operation_id,
    'payload_hash', v_payload_hash,
    'replayed', FALSE,
    'result', p_result
  );
END;
$$;

REVOKE ALL ON FUNCTION public.shopping_fail_operation(TEXT, TEXT, JSONB, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.shopping_fail_operation(TEXT, TEXT, JSONB, JSONB) FROM anon;
REVOKE EXECUTE ON FUNCTION public.shopping_fail_operation(TEXT, TEXT, JSONB, JSONB) FROM authenticated;
