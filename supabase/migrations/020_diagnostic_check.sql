-- Diagnostic: Check if admins table exists and has data
-- Run this first to see what's happening

-- 1. Check if table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'admins'
) as table_exists;

-- 2. Check if there are any admins
SELECT COUNT(*) as admin_count FROM public.admins;

-- 3. List all admins
SELECT 
    id,
    name,
    email,
    role,
    is_active,
    user_id,
    created_at
FROM public.admins;

-- 4. Check if the auth user exists
SELECT 
    id,
    email,
    created_at
FROM auth.users
WHERE email = 'admin@latebites.in';

-- 5. Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'admins';
