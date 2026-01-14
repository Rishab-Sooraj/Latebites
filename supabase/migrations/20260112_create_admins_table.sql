-- =====================================================
-- ADMIN PANEL DATABASE SETUP
-- =====================================================
-- Creates admins table and adds must_change_password to restaurants

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add must_change_password flag to restaurants
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT true;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS onboarded_by UUID REFERENCES admins(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_restaurants_email ON restaurants(email);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- Enable RLS on admins table
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admins
CREATE POLICY "Admins can view all admins" ON admins
    FOR SELECT USING (true);

CREATE POLICY "Only super_admins can insert admins" ON admins
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM admins a
            WHERE a.user_id = auth.uid() AND a.role = 'super_admin'
        )
    );

-- Create initial super admin (you need to create auth user first)
-- Email: admin@latebites.in, Password: Admin@123
-- Then run: INSERT INTO admins (name, email, role, user_id) 
--           VALUES ('Super Admin', 'admin@latebites.in', 'super_admin', '<auth_user_id>');

COMMENT ON TABLE admins IS 'Admin users who can manage restaurants and orders';
COMMENT ON COLUMN restaurants.must_change_password IS 'If true, restaurant must change password on first login';
