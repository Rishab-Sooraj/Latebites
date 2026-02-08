-- Migration to create missing customer profiles for existing auth users
-- Run this to fix any auth users that don't have customer profiles

INSERT INTO customers (id, name, email, phone)
SELECT 
    au.id,
    COALESCE(
        au.raw_user_meta_data->>'name',
        au.raw_user_meta_data->>'full_name', 
        split_part(au.email, '@', 1)
    ) as name,
    au.email,
    COALESCE(
        au.raw_user_meta_data->>'phone',
        au.phone,
        '+910000000000'
    ) as phone
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM customers c WHERE c.id = au.id
)
ON CONFLICT (id) DO NOTHING;
