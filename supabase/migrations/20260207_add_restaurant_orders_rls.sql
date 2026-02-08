-- Enable RLS on orders table (if not already enabled)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Restaurants can view their own orders" ON orders;
DROP POLICY IF EXISTS "Restaurants can update their own orders" ON orders;

-- Policy: Restaurants can view orders for their restaurant
CREATE POLICY "Restaurants can view their own orders"
ON orders
FOR SELECT
TO authenticated
USING (
  restaurant_id = auth.uid()
);

-- Policy: Restaurants can update their own orders (for OTP verification and status updates)
CREATE POLICY "Restaurants can update their own orders"
ON orders
FOR UPDATE
TO authenticated
USING (
  restaurant_id = auth.uid()
)
WITH CHECK (
  restaurant_id = auth.uid()
);

-- Grant necessary permissions
GRANT SELECT, UPDATE ON orders TO authenticated;
