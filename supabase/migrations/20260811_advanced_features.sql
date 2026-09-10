-- =====================================================================
-- DynamQR Advanced Features Migration
-- This migration extends the existing schema for advanced routing,
-- analytics, and organization features.
-- Run this in your Supabase SQL Editor.
-- =====================================================================

-- 1. Extend qr_codes table with advanced feature columns
ALTER TABLE public.qr_codes 
ADD COLUMN IF NOT EXISTS qr_type TEXT DEFAULT 'url', -- url, wifi, vcard, email, sms, etc.
ADD COLUMN IF NOT EXISTS type_data JSONB DEFAULT '{}'::jsonb, -- dynamic fields for types
ADD COLUMN IF NOT EXISTS rules JSONB DEFAULT '[]'::jsonb, -- smart redirect rules
ADD COLUMN IF NOT EXISTS schedules JSONB DEFAULT '[]'::jsonb, -- scheduled redirects
ADD COLUMN IF NOT EXISTS password_hash TEXT, -- for password protection
ADD COLUMN IF NOT EXISTS is_password_protected BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ, -- expiration date/time
ADD COLUMN IF NOT EXISTS expiration_url TEXT, -- fallback url after expiry
ADD COLUMN IF NOT EXISTS expiration_message TEXT,
ADD COLUMN IF NOT EXISTS ab_variants JSONB DEFAULT '[]'::jsonb, -- A/B testing configurations
ADD COLUMN IF NOT EXISTS campaign_id UUID,
ADD COLUMN IF NOT EXISTS workspace_id UUID,
ADD COLUMN IF NOT EXISTS custom_domain TEXT,
ADD COLUMN IF NOT EXISTS scan_limit INT, -- maximum number of scans
ADD COLUMN IF NOT EXISTS url_health_status TEXT DEFAULT 'healthy',
ADD COLUMN IF NOT EXISTS last_health_check TIMESTAMPTZ;

-- 2. Create Campaigns Table
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID,
    name TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own campaigns" ON public.campaigns FOR ALL USING (auth.uid() = user_id);

-- 3. Create QR Templates Table
CREATE TABLE IF NOT EXISTS public.qr_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    design_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.qr_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own templates" ON public.qr_templates FOR ALL USING (auth.uid() = user_id);

-- 4. Create Workspaces & Workspace Members Tables
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can manage workspaces" ON public.workspaces FOR ALL USING (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS public.workspace_members (
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'viewer', -- owner, admin, editor, viewer
    PRIMARY KEY (workspace_id, user_id)
);
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their workspace memberships" ON public.workspace_members FOR SELECT USING (auth.uid() = user_id);

-- 5. Extend scan_events if needed (already has ip, country, city, browser, os)
-- Add scan_type column to distinguish between normal vs ab_test etc.
ALTER TABLE public.scan_events
ADD COLUMN IF NOT EXISTS scan_type TEXT DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS variant_id TEXT;
