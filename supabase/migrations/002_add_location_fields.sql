-- Add location fields to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMPTZ;

-- Add location fields to restaurants table
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Coimbatore';

-- Create index for faster location queries
CREATE INDEX IF NOT EXISTS idx_restaurants_location ON restaurants(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_customers_location ON customers(latitude, longitude);

-- Add comment
COMMENT ON COLUMN customers.latitude IS 'Customer latitude for location-based filtering';
COMMENT ON COLUMN customers.longitude IS 'Customer longitude for location-based filtering';
COMMENT ON COLUMN restaurants.latitude IS 'Restaurant latitude for distance calculation';
COMMENT ON COLUMN restaurants.longitude IS 'Restaurant longitude for distance calculation';
