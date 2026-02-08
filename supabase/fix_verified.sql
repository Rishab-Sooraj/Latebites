-- Run this in Supabase SQL Editor to set your restaurant as verified
-- This will make your bags visible on the customer browse page

UPDATE restaurants 
SET verified = true 
WHERE name ILIKE '%rishab%' OR email ILIKE '%rishab%';

-- Or update ALL restaurants to verified for testing:
-- UPDATE restaurants SET verified = true;

-- Check if it worked:
SELECT id, name, is_active, verified, latitude, longitude 
FROM restaurants 
LIMIT 10;
