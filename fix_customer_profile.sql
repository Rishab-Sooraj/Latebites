-- Fix missing customer profiles
-- This script creates customer profiles for any auth users that don't have them

-- First, let's see what we have
SELECT 
    au.id,
    au.email,
    au.raw_user_meta_data->>'name' as name,
    au.raw_user_meta_data->>'phone' as phone,
    c.id as customer_profile_exists
FROM auth.users au
LEFT JOIN customers c ON au.id = c.id
WHERE au.email = '717823y143@kce.ac.in';

-- If the customer profile doesn't exist, create it
INSERT INTO customers (id, name, email, phone)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'name', au.email),
    au.email,
    COALESCE(au.raw_user_meta_data->>'phone', au.phone, '+910000000000')
FROM auth.users au
WHERE au.email = '717823y143@kce.ac.in'
AND NOT EXISTS (
    SELECT 1 FROM customers c WHERE c.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- Verify it was created
SELECT * FROM customers WHERE email = '717823y143@kce.ac.in';
