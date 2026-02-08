-- Create refunds table to track all refund attempts
CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    razorpay_payment_id TEXT NOT NULL,
    razorpay_refund_id TEXT,
    amount INTEGER NOT NULL, -- Amount in paise
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'failed')),
    reason TEXT,
    initiated_by UUID REFERENCES admins(id),
    initiated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    failure_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add refund-related columns to orders table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'refund_status') THEN
        ALTER TABLE orders ADD COLUMN refund_status TEXT DEFAULT NULL CHECK (refund_status IN ('none', 'partial', 'full', 'pending', 'failed'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'refund_amount') THEN
        ALTER TABLE orders ADD COLUMN refund_amount INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'refunded_at') THEN
        ALTER TABLE orders ADD COLUMN refunded_at TIMESTAMPTZ DEFAULT NULL;
    END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);
CREATE INDEX IF NOT EXISTS idx_orders_refund_status ON orders(refund_status);

-- RLS policies for refunds table
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage refunds
CREATE POLICY "Admins can view all refunds" ON refunds
    FOR SELECT TO authenticated
    USING (
        EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid())
    );

CREATE POLICY "Admins can insert refunds" ON refunds
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid())
    );

CREATE POLICY "Admins can update refunds" ON refunds
    FOR UPDATE TO authenticated
    USING (
        EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid())
    );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_refunds_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_refunds_updated_at_trigger ON refunds;
CREATE TRIGGER update_refunds_updated_at_trigger
    BEFORE UPDATE ON refunds
    FOR EACH ROW
    EXECUTE FUNCTION update_refunds_updated_at();
