-- Add dietary information column to rescue_bags table
-- Stores array of dietary labels like: veg, non-veg, contains-egg, etc.

ALTER TABLE rescue_bags ADD COLUMN IF NOT EXISTS dietary_info TEXT[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN rescue_bags.dietary_info IS 'Array of dietary labels: veg, non-veg, contains-egg, contains-dairy, jain-friendly, halal';
