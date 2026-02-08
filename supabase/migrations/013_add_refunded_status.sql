-- Add 'refunded' as a valid order status
-- First drop the existing constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Then recreate with the new value
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'confirmed', 'ready', 'completed', 'cancelled', 'refunded'));
