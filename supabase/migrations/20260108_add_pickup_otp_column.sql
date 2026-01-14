-- Migration: Add pickup_otp column to orders table
-- This column stores a 4-digit OTP that customers use to verify pickup with restaurants

-- Add the pickup_otp column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_otp VARCHAR(4);

-- Create function to generate random 4-digit OTP
CREATE OR REPLACE FUNCTION generate_pickup_otp()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate a random 4-digit number (1000-9999)
  NEW.pickup_otp := LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate OTP on new order insert
DROP TRIGGER IF EXISTS trigger_generate_pickup_otp ON orders;
CREATE TRIGGER trigger_generate_pickup_otp
  BEFORE INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.pickup_otp IS NULL)
  EXECUTE FUNCTION generate_pickup_otp();

-- Update existing orders without OTP (if any)
UPDATE orders 
SET pickup_otp = LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0')
WHERE pickup_otp IS NULL;

-- Make pickup_otp NOT NULL after populating existing rows
ALTER TABLE orders ALTER COLUMN pickup_otp SET NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN orders.pickup_otp IS 'A 4-digit OTP that customers provide to restaurants to verify order pickup. Auto-generated on order creation.';
