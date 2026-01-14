-- =====================================================
-- ADD must_change_password TO ADMINS TABLE
-- =====================================================
-- Run this in Supabase SQL Editor

ALTER TABLE admins ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT true;

-- Update existing admins to not require password change (they already have passwords)
UPDATE admins SET must_change_password = false WHERE must_change_password IS NULL;
