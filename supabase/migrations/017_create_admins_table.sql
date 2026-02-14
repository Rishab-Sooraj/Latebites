-- Create admins table for admin portal users
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'super_admin')),
    is_active BOOLEAN DEFAULT true,
    must_change_password BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_admins_email ON public.admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON public.admins(user_id);
CREATE INDEX IF NOT EXISTS idx_admins_is_active ON public.admins(is_active);

-- Enable RLS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all admins" ON public.admins;
DROP POLICY IF EXISTS "Super admins can do everything on admins" ON public.admins;
DROP POLICY IF EXISTS "Admins can update their own record" ON public.admins;
DROP POLICY IF EXISTS "Service role full access to admins" ON public.admins;

-- RLS Policies for admins table
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

-- Admins can view all admins
CREATE POLICY "admins_can_view_all"
    ON public.admins
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- Admins can update their own record (for password change)
CREATE POLICY "admins_can_update_own"
    ON public.admins
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_admins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_admins_updated_at_trigger ON public.admins;
CREATE TRIGGER update_admins_updated_at_trigger
    BEFORE UPDATE ON public.admins
    FOR EACH ROW
    EXECUTE FUNCTION update_admins_updated_at();

-- Grant permissions
GRANT ALL ON public.admins TO service_role;
GRANT SELECT, UPDATE ON public.admins TO authenticated;

-- Insert a default super admin (update with your email)
-- Password should be changed on first login
-- You'll need to create the auth user separately or via the admin panel
INSERT INTO public.admins (name, email, role, is_active, must_change_password)
VALUES ('Super Admin', 'admin@latebites.in', 'super_admin', true, true)
ON CONFLICT (email) DO NOTHING;
