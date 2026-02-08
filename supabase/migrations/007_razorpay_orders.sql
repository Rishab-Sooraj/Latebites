-- Add Razorpay and pickup OTP columns to orders table

ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_otp TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Add index for faster lookup by razorpay_order_id
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON orders(razorpay_order_id);

-- Add comment for documentation
COMMENT ON COLUMN orders.razorpay_order_id IS 'Razorpay order ID for online payments';
COMMENT ON COLUMN orders.razorpay_payment_id IS 'Razorpay payment ID after successful payment';
COMMENT ON COLUMN orders.pickup_otp IS '6-digit OTP for pickup verification at restaurant';
COMMENT ON COLUMN orders.payment_status IS 'Payment status: pending, paid, failed, refunded';
