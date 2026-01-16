-- =====================================================
-- ADMIN MANAGEMENT ENHANCEMENTS
-- =====================================================
-- Adds freeze/revoke functionality and tracking fields

-- Add new columns to admins table
ALTER TABLE admins ADD COLUMN IF NOT EXISTS frozen_at TIMESTAMPTZ;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS frozen_by UUID REFERENCES admins(id);
ALTER TABLE admins ADD COLUMN IF NOT EXISTS revoked_by UUID REFERENCES admins(id);
ALTER TABLE admins ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS issues_resolved_count INTEGER DEFAULT 0;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT true;

-- Create RPC function for password flag update (fixes password change loop)
-- This function uses SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION update_admin_password_flag(
    admin_email TEXT,
    new_flag_value BOOLEAN
) RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
    UPDATE admins 
    SET must_change_password = new_flag_value, 
        updated_at = NOW()
    WHERE email = admin_email;
END;
$$;

-- Create RPC function for freezing/unfreezing admins
CREATE OR REPLACE FUNCTION freeze_admin(
    target_admin_id UUID,
    freeze BOOLEAN,
    freezer_admin_id UUID
) RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
    IF freeze THEN
        UPDATE admins 
        SET frozen_at = NOW(), 
            frozen_by = freezer_admin_id,
            is_active = false,
            updated_at = NOW()
        WHERE id = target_admin_id;
    ELSE
        UPDATE admins 
        SET frozen_at = NULL, 
            frozen_by = NULL,
            is_active = true,
            updated_at = NOW()
        WHERE id = target_admin_id;
    END IF;
END;
$$;

-- Create RPC function for revoking admins (permanent)
CREATE OR REPLACE FUNCTION revoke_admin(
    target_admin_id UUID,
    revoker_admin_id UUID
) RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
    UPDATE admins 
    SET revoked_at = NOW(), 
        revoked_by = revoker_admin_id,
        is_active = false,
        updated_at = NOW()
    WHERE id = target_admin_id;
END;
$$;

-- Create RPC function to update last login timestamp
CREATE OR REPLACE FUNCTION update_admin_last_login(
    admin_email TEXT
) RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
    UPDATE admins 
    SET last_login_at = NOW()
    WHERE email = admin_email;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_admin_password_flag TO authenticated;
GRANT EXECUTE ON FUNCTION freeze_admin TO authenticated;
GRANT EXECUTE ON FUNCTION revoke_admin TO authenticated;
GRANT EXECUTE ON FUNCTION update_admin_last_login TO authenticated;

-- Add comment
COMMENT ON COLUMN admins.frozen_at IS 'Timestamp when account was frozen (temporary suspension)';
COMMENT ON COLUMN admins.revoked_at IS 'Timestamp when account was revoked (permanent)';
COMMENT ON COLUMN admins.issues_resolved_count IS 'Number of customer issues resolved by this admin';
