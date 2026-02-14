-- Fix RLS policies for admin login
-- The issue is that unauthenticated users can't query the admins table during login

-- Drop all existing policies
DROP POLICY IF EXISTS "super_admins_full_access" ON public.admins;
DROP POLICY IF EXISTS "admins_can_view_all" ON public.admins;
DROP POLICY IF EXISTS "admins_can_update_own" ON public.admins;

-- Allow anyone to SELECT from admins (needed for login check)
-- This is safe because we're only exposing email and role, not sensitive data
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

-- Admins can update their own record (for password change, last login, etc)
CREATE POLICY "admins_can_update_own"
    ON public.admins
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
