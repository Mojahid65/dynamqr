-- =====================================================================
-- DynamQR Developer API System - Supabase PostgreSQL Migration
-- Note: Supabase uses PostgreSQL (not MySQL). Run this SQL directly in your
-- Supabase Dashboard -> SQL Editor -> New Query -> Run.
-- =====================================================================

-- 1. Create API Keys table
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  permissions JSONB DEFAULT '{"create_qr": true, "read_qr": true, "update_qr": true, "delete_qr": true}'::jsonb,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security on api_keys
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view, insert, update, delete their own API keys
CREATE POLICY "Users can view their own api keys" 
  ON public.api_keys FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own api keys" 
  ON public.api_keys FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own api keys" 
  ON public.api_keys FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own api keys" 
  ON public.api_keys FOR DELETE 
  USING (auth.uid() = user_id);

-- Create index for fast API key authentication lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON public.api_keys(key_hash) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON public.api_keys(user_id);


-- =====================================================================
-- 2. Helper & Security Definer RPC Functions for API Operations
-- =====================================================================

-- Function 1: Verify API Key
CREATE OR REPLACE FUNCTION public.api_verify_key(p_key_hash TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key_record RECORD;
BEGIN
  SELECT id, user_id, name, permissions, status, created_at
  INTO v_key_record
  FROM public.api_keys
  WHERE key_hash = p_key_hash AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or revoked API key' USING ERRCODE = '40100';
  END IF;

  -- Update last_used_at timestamp
  UPDATE public.api_keys
  SET last_used_at = now()
  WHERE id = v_key_record.id;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_key_record.user_id,
    'key_name', v_key_record.name,
    'permissions', v_key_record.permissions,
    'created_at', v_key_record.created_at
  );
END;
$$;


-- Function 2: Create QR Code via API
CREATE OR REPLACE FUNCTION public.api_create_qr(
  p_key_hash TEXT,
  p_destination_url TEXT,
  p_short_code TEXT DEFAULT NULL,
  p_keyword TEXT DEFAULT NULL,
  p_design_config JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key_record RECORD;
  v_final_short_code TEXT;
  v_new_qr RECORD;
  v_base_url TEXT := 'https://dynamqr.mojahidx.in/';
BEGIN
  -- 1. Authenticate & check permissions
  SELECT id, user_id, permissions, status
  INTO v_key_record
  FROM public.api_keys
  WHERE key_hash = p_key_hash AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or revoked API key' USING ERRCODE = '40100';
  END IF;

  IF NOT coalesce((v_key_record.permissions->>'create_qr')::boolean, false) THEN
    RAISE EXCEPTION 'API key does not have create_qr permission' USING ERRCODE = '40300';
  END IF;

  -- Update last used timestamp
  UPDATE public.api_keys SET last_used_at = now() WHERE id = v_key_record.id;

  -- 2. Determine short_code
  IF p_keyword IS NOT NULL AND trim(p_keyword) != '' THEN
    v_final_short_code := trim(p_keyword);
  ELSIF p_short_code IS NOT NULL AND trim(p_short_code) != '' THEN
    v_final_short_code := trim(p_short_code);
  ELSE
    -- Generate random 7-character shortcode
    v_final_short_code := substr(md5(random()::text || clock_timestamp()::text), 1, 7);
  END IF;

  -- Check if short_code already exists
  IF EXISTS (SELECT 1 FROM public.qr_codes WHERE short_code = v_final_short_code) THEN
    RAISE EXCEPTION 'Short code % already exists', v_final_short_code USING ERRCODE = '40900';
  END IF;

  -- 3. Insert into qr_codes table
  INSERT INTO public.qr_codes (
    user_id,
    short_code,
    keyword,
    destination_url,
    design_config
  ) VALUES (
    v_key_record.user_id,
    v_final_short_code,
    NULLIF(trim(coalesce(p_keyword, '')), ''),
    p_destination_url,
    coalesce(p_design_config, '{}'::jsonb)
  )
  RETURNING * INTO v_new_qr;

  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'id', v_new_qr.id,
      'short_code', v_new_qr.short_code,
      'keyword', v_new_qr.keyword,
      'destination_url', v_new_qr.destination_url,
      'qr_url', v_base_url || v_new_qr.short_code,
      'created_at', v_new_qr.created_at
    )
  );
END;
$$;


-- Function 3: List QR Codes via API
CREATE OR REPLACE FUNCTION public.api_list_qrs(
  p_key_hash TEXT,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key_record RECORD;
  v_qrs JSONB;
  v_total INT;
  v_base_url TEXT := 'https://dynamqr.mojahidx.in/';
BEGIN
  SELECT id, user_id, permissions, status
  INTO v_key_record
  FROM public.api_keys
  WHERE key_hash = p_key_hash AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or revoked API key' USING ERRCODE = '40100';
  END IF;

  IF NOT coalesce((v_key_record.permissions->>'read_qr')::boolean, false) THEN
    RAISE EXCEPTION 'API key does not have read_qr permission' USING ERRCODE = '40300';
  END IF;

  UPDATE public.api_keys SET last_used_at = now() WHERE id = v_key_record.id;

  SELECT count(*) INTO v_total
  FROM public.qr_codes
  WHERE user_id = v_key_record.user_id;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', q.id,
    'short_code', q.short_code,
    'keyword', q.keyword,
    'destination_url', q.destination_url,
    'qr_url', v_base_url || q.short_code,
    'created_at', q.created_at
  )), '[]'::jsonb)
  INTO v_qrs
  FROM (
    SELECT *
    FROM public.qr_codes
    WHERE user_id = v_key_record.user_id
    ORDER BY created_at DESC
    LIMIT p_limit OFFSET p_offset
  ) q;

  RETURN jsonb_build_object(
    'success', true,
    'data', v_qrs,
    'total', v_total,
    'limit', p_limit,
    'offset', p_offset
  );
END;
$$;


-- Function 4: Get single QR Code via API
CREATE OR REPLACE FUNCTION public.api_get_qr(
  p_key_hash TEXT,
  p_short_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key_record RECORD;
  v_qr RECORD;
  v_base_url TEXT := 'https://dynamqr.mojahidx.in/';
BEGIN
  SELECT id, user_id, permissions, status
  INTO v_key_record
  FROM public.api_keys
  WHERE key_hash = p_key_hash AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or revoked API key' USING ERRCODE = '40100';
  END IF;

  IF NOT coalesce((v_key_record.permissions->>'read_qr')::boolean, false) THEN
    RAISE EXCEPTION 'API key does not have read_qr permission' USING ERRCODE = '40300';
  END IF;

  UPDATE public.api_keys SET last_used_at = now() WHERE id = v_key_record.id;

  SELECT * INTO v_qr
  FROM public.qr_codes
  WHERE short_code = p_short_code AND user_id = v_key_record.user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'QR code not found' USING ERRCODE = '40400';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'id', v_qr.id,
      'short_code', v_qr.short_code,
      'keyword', v_qr.keyword,
      'destination_url', v_qr.destination_url,
      'qr_url', v_base_url || v_qr.short_code,
      'created_at', v_qr.created_at
    )
  );
END;
$$;


-- Function 5: Update QR Code destination via API
CREATE OR REPLACE FUNCTION public.api_update_qr(
  p_key_hash TEXT,
  p_short_code TEXT,
  p_destination_url TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key_record RECORD;
  v_qr RECORD;
  v_base_url TEXT := 'https://dynamqr.mojahidx.in/';
BEGIN
  SELECT id, user_id, permissions, status
  INTO v_key_record
  FROM public.api_keys
  WHERE key_hash = p_key_hash AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or revoked API key' USING ERRCODE = '40100';
  END IF;

  IF NOT coalesce((v_key_record.permissions->>'update_qr')::boolean, false) THEN
    RAISE EXCEPTION 'API key does not have update_qr permission' USING ERRCODE = '40300';
  END IF;

  UPDATE public.api_keys SET last_used_at = now() WHERE id = v_key_record.id;

  UPDATE public.qr_codes
  SET destination_url = p_destination_url
  WHERE short_code = p_short_code AND user_id = v_key_record.user_id
  RETURNING * INTO v_qr;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'QR code not found' USING ERRCODE = '40400';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'id', v_qr.id,
      'short_code', v_qr.short_code,
      'keyword', v_qr.keyword,
      'destination_url', v_qr.destination_url,
      'qr_url', v_base_url || v_qr.short_code,
      'updated_at', now()
    )
  );
END;
$$;


-- Function 6: Delete QR Code via API
CREATE OR REPLACE FUNCTION public.api_delete_qr(
  p_key_hash TEXT,
  p_short_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key_record RECORD;
  v_deleted BOOLEAN := false;
BEGIN
  SELECT id, user_id, permissions, status
  INTO v_key_record
  FROM public.api_keys
  WHERE key_hash = p_key_hash AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or revoked API key' USING ERRCODE = '40100';
  END IF;

  IF NOT coalesce((v_key_record.permissions->>'delete_qr')::boolean, false) THEN
    RAISE EXCEPTION 'API key does not have delete_qr permission' USING ERRCODE = '40300';
  END IF;

  UPDATE public.api_keys SET last_used_at = now() WHERE id = v_key_record.id;

  DELETE FROM public.qr_codes
  WHERE short_code = p_short_code AND user_id = v_key_record.user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'QR code not found or already deleted' USING ERRCODE = '40400';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'QR code deleted successfully',
    'short_code', p_short_code
  );
END;
$$;
