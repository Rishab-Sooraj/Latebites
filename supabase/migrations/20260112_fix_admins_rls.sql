-- =====================================================
-- FIX ADMINS TABLE RLS POLICIES
-- =====================================================
-- Run this in Supabase SQL Editor

-- First, enable RLS on admins table if not already enabled
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Service role can do anything on admins" ON admins;
DROP POLICY IF EXISTS "Admins can view their own record" ON admins;
DROP POLICY IF EXISTS "Admins can update their own record" ON admins;

-- Allow service role (admin portal) to do anything
CREATE POLICY "Service role can do anything on admins" ON admins
    FOR ALL USING (true) WITH CHECK (true);

-- Allow admins to view their own record
CREATE POLICY "Admins can view their own record" ON admins
    FOR SELECT USING (auth.email() = email);

-- Allow admins to update their own must_change_password flag
CREATE POLICY "Admins can update their own record" ON admins
    FOR UPDATE USING (auth.email() = email);

-- Add must_change_password column if not exists
ALTER TABLE admins ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT true;

-- Fix existing admins to not require password change (if they're already setup)
UPDATE admins SET must_change_password = false WHERE email = 'admin@latebites.in';
