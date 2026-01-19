-- Restaurant Portal Schema Updates
-- Version: 2026-01-18
-- Description: Add bag configuration, daily listings, and lock-in system

-- ============================================
-- 1. Update restaurants table with bag config
-- ============================================

ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS bag_small_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bag_medium_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bag_large_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bag_small_category TEXT CHECK (bag_small_category IN ('veg', 'non-veg')),
ADD COLUMN IF NOT EXISTS bag_medium_category TEXT CHECK (bag_medium_category IN ('veg', 'non-veg')),
ADD COLUMN IF NOT EXISTS bag_large_category TEXT CHECK (bag_large_category IN ('veg', 'non-veg')),
ADD COLUMN IF NOT EXISTS bag_small_price INTEGER CHECK (bag_small_price IN (79, 99)),
ADD COLUMN IF NOT EXISTS bag_medium_price INTEGER DEFAULT 159 CHECK (bag_medium_price = 159),
ADD COLUMN IF NOT EXISTS bag_large_price INTEGER DEFAULT 199 CHECK (bag_large_price = 199),
ADD COLUMN IF NOT EXISTS default_pickup_start TIME,
ADD COLUMN IF NOT EXISTS default_pickup_end TIME,
ADD COLUMN IF NOT EXISTS reliability_strikes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- ============================================
-- 2. Create daily_listings table
-- ============================================

CREATE TABLE IF NOT EXISTS daily_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Confirmed pickup window for this day
    pickup_start TIME NOT NULL,
    pickup_end TIME NOT NULL,
    
    -- Lock-in timestamp (45 min before pickup_start)
    lock_in_time TIMESTAMPTZ NOT NULL,
    is_locked BOOLEAN DEFAULT false,
    
    -- Small bags (null price = not listed)
    small_price INTEGER CHECK (small_price IN (79, 99)),
    small_quantity INTEGER DEFAULT 0,
    small_sold INTEGER DEFAULT 0,
    
    -- Medium bags
    medium_price INTEGER CHECK (medium_price = 159),
    medium_quantity INTEGER DEFAULT 0,
    medium_sold INTEGER DEFAULT 0,
    
    -- Large bags
    large_price INTEGER CHECK (large_price = 199),
    large_quantity INTEGER DEFAULT 0,
    large_sold INTEGER DEFAULT 0,
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Unique constraint: one listing per restaurant per day
    UNIQUE(restaurant_id, date)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_daily_listings_restaurant_date 
ON daily_listings(restaurant_id, date);

CREATE INDEX IF NOT EXISTS idx_daily_listings_date 
ON daily_listings(date);

-- ============================================
-- 3. Function to auto-update lock-in status
-- ============================================

CREATE OR REPLACE FUNCTION check_and_update_lock_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Lock if current time >= lock_in_time
    IF NEW.lock_in_time <= NOW() AND NEW.is_locked = false THEN
        NEW.is_locked := true;
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on update
DROP TRIGGER IF EXISTS trigger_check_lock_status ON daily_listings;
CREATE TRIGGER trigger_check_lock_status
    BEFORE UPDATE ON daily_listings
    FOR EACH ROW
    EXECUTE FUNCTION check_and_update_lock_status();

-- ============================================
-- 4. Row Level Security
-- ============================================

ALTER TABLE daily_listings ENABLE ROW LEVEL SECURITY;

-- Restaurants can view their own listings
CREATE POLICY "Restaurants can view own listings"
ON daily_listings FOR SELECT
USING (restaurant_id = auth.uid());

-- Restaurants can insert their own listings
CREATE POLICY "Restaurants can create own listings"
ON daily_listings FOR INSERT
WITH CHECK (restaurant_id = auth.uid());

-- Restaurants can update own listings (before lock-in)
CREATE POLICY "Restaurants can update own unlocked listings"
ON daily_listings FOR UPDATE
USING (restaurant_id = auth.uid());

-- Service role can manage all (for admin/cron)
CREATE POLICY "Service role full access"
ON daily_listings FOR ALL
USING (auth.role() = 'service_role');

-- ============================================
-- 5. Price constants reference (for app)
-- ============================================

-- SMALL BAG:
--   ₹79 → Guaranteed min value ₹110 → Net payout: ~₹63 (20% commission)
--   ₹99 → Guaranteed min value ₹140 → Net payout: ~₹79 (20% commission)
-- 
-- MEDIUM BAG:
--   ₹159 → Guaranteed min value ₹250 → Net payout: ~₹127 (20% commission)
-- 
-- LARGE BAG:
--   ₹199 → Guaranteed min value ₹320 → Net payout: ~₹159 (20% commission)
