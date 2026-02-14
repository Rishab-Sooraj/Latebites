-- COMPLETE ADMIN SETUP - Run this entire script at once
-- This will set up everything needed for admin login

-- ============================================
-- STEP 1: Create admins table
-- ============================================
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'super_admin')),
    is_active BOOLEAN DEFAULT true,
    must_change_password BOOLEAN DEFAULT true,
    frozen_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 2: Create indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_admins_email ON public.admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON public.admins(user_id);
CREATE INDEX IF NOT EXISTS idx_admins_is_active ON public.admins(is_active);

-- ============================================
-- STEP 3: Enable RLS
-- ============================================
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: Drop all existing policies
-- ============================================
DROP POLICY IF EXISTS "anyone_can_check_admin_status" ON public.admins;
DROP POLICY IF EXISTS "super_admins_full_access" ON public.admins;
DROP POLICY IF EXISTS "admins_can_view_all" ON public.admins;
DROP POLICY IF EXISTS "admins_can_update_own" ON public.admins;
DROP POLICY IF EXISTS "Service role full access to admins" ON public.admins;

-- ============================================
-- STEP 5: Create RLS policies
-- ============================================

-- Allow anyone to SELECT (needed for login check)
CREATE POLICY "anyone_can_check_admin_status"
    ON public.admins
    FOR SELECT
    USING (true);

-- Super admins can do everything
CREATE POLICY "super_admins_full_access"
    ON public.admins
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE user_id = auth.uid()
            AND role = 'super_admin'
            AND is_active = true
        )
    );

-- Admins can update their own record
CREATE POLICY "admins_can_update_own"
    ON public.admins
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ============================================
-- STEP 6: Create trigger for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_admins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_admins_updated_at_trigger ON public.admins;
CREATE TRIGGER update_admins_updated_at_trigger
    BEFORE UPDATE ON public.admins
    FOR EACH ROW
    EXECUTE FUNCTION update_admins_updated_at();

-- ============================================
-- STEP 7: Grant permissions
-- ============================================
GRANT ALL ON public.admins TO service_role;
GRANT SELECT, UPDATE ON public.admins TO authenticated;
GRANT SELECT ON public.admins TO anon;

-- ============================================
-- STEP 8: Insert admin record for existing auth user
-- ============================================
-- This will link the auth user with email admin@latebites.in to the admins table
INSERT INTO public.admins (user_id, name, email, role, is_active, must_change_password)
SELECT 
    id,
    'Super Admin',
    'admin@latebites.in',
    'super_admin',
    true,
    false
FROM auth.users
WHERE email = 'admin@latebites.in'
ON CONFLICT (email) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    is_active = true,
    role = 'super_admin',
    frozen_at = NULL,
    revoked_at = NULL;

-- ============================================
-- STEP 9: Verify setup
-- ============================================
SELECT 
    'Setup Complete!' as status,
    COUNT(*) as admin_count
FROM public.admins;

-- Show the admin that was created
SELECT 
    a.id,
    a.name,
    a.email,
    a.role,
    a.is_active,
    u.email as auth_email,
    CASE 
        WHEN u.id IS NOT NULL THEN 'Linked to auth user'
        ELSE 'NOT linked - auth user missing!'
    END as auth_status
FROM public.admins a
LEFT JOIN auth.users u ON a.user_id = u.id
WHERE a.email = 'admin@latebites.in';
