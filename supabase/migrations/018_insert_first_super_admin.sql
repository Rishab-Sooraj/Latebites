-- Quick setup for first super admin
-- This assumes you've already created the auth user with email admin@latebites.in

-- Insert admin record linked to the auth user
INSERT INTO public.admins (
    user_id,
    name,
    email,
    role,
    is_active,
    must_change_password
)
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
    role = 'super_admin';

-- Verify the admin was created
SELECT 
    a.id,
    a.name,
    a.email,
    a.role,
    a.is_active,
    u.email as auth_email
FROM public.admins a
LEFT JOIN auth.users u ON a.user_id = u.id
WHERE a.email = 'admin@latebites.in';
