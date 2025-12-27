-- Customer Portal Database Schema
-- This migration creates all necessary tables for the customer-facing application

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For location-based queries

-- =====================================================
-- CUSTOMERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT,
    profile_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CUSTOMER LOCATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS customer_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    label TEXT NOT NULL, -- e.g., "Home", "Work"
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- RESTAURANTS TABLE (for reference)
-- =====================================================
CREATE TABLE IF NOT EXISTS restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    cuisine_types TEXT[], -- Array of cuisine types
    profile_image_url TEXT,
    cover_image_url TEXT,
    description TEXT,
    verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- RESCUE BAGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS rescue_bags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    size TEXT NOT NULL CHECK (size IN ('small', 'medium', 'large')),
    original_price DECIMAL(10, 2) NOT NULL,
    discounted_price DECIMAL(10, 2) NOT NULL,
    quantity_available INTEGER NOT NULL DEFAULT 0,
    pickup_start_time TIME NOT NULL,
    pickup_end_time TIME NOT NULL,
    available_date DATE NOT NULL DEFAULT CURRENT_DATE,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure discounted price is at least 50% off
    CONSTRAINT valid_discount CHECK (discounted_price <= original_price * 0.5)
);

-- =====================================================
-- ORDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    rescue_bag_id UUID NOT NULL REFERENCES rescue_bags(id) ON DELETE RESTRICT,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_price DECIMAL(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'ready', 'completed', 'cancelled')),
    pickup_time TIMESTAMPTZ NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'pay_at_pickup' CHECK (payment_method IN ('pay_at_pickup', 'online')),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    qr_code TEXT, -- For pickup verification
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- FAVORITES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one favorite per customer-restaurant pair
    UNIQUE(customer_id, restaurant_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Customer indexes
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- Location indexes for geospatial queries
CREATE INDEX IF NOT EXISTS idx_customer_locations_customer_id ON customer_locations(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_locations_default ON customer_locations(customer_id, is_default) WHERE is_default = TRUE;

-- Restaurant indexes
CREATE INDEX IF NOT EXISTS idx_restaurants_city ON restaurants(city);
CREATE INDEX IF NOT EXISTS idx_restaurants_verified ON restaurants(verified) WHERE verified = TRUE;
CREATE INDEX IF NOT EXISTS idx_restaurants_active ON restaurants(is_active) WHERE is_active = TRUE;

-- Rescue bag indexes
CREATE INDEX IF NOT EXISTS idx_rescue_bags_restaurant_id ON rescue_bags(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_rescue_bags_active ON rescue_bags(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_rescue_bags_date ON rescue_bags(available_date);
CREATE INDEX IF NOT EXISTS idx_rescue_bags_available ON rescue_bags(available_date, is_active) WHERE is_active = TRUE AND quantity_available > 0;

-- Order indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Favorites indexes
CREATE INDEX IF NOT EXISTS idx_favorites_customer_id ON favorites(customer_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE rescue_bags ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- CUSTOMERS POLICIES
CREATE POLICY "Customers can view their own profile"
    ON customers FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Customers can update their own profile"
    ON customers FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Anyone can insert customer profile on signup"
    ON customers FOR INSERT
    WITH CHECK (auth.uid() = id);

-- CUSTOMER LOCATIONS POLICIES
CREATE POLICY "Customers can view their own locations"
    ON customer_locations FOR SELECT
    USING (auth.uid() = customer_id);

CREATE POLICY "Customers can insert their own locations"
    ON customer_locations FOR INSERT
    WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can update their own locations"
    ON customer_locations FOR UPDATE
    USING (auth.uid() = customer_id);

CREATE POLICY "Customers can delete their own locations"
    ON customer_locations FOR DELETE
    USING (auth.uid() = customer_id);

-- RESTAURANTS POLICIES
CREATE POLICY "Anyone can view active verified restaurants"
    ON restaurants FOR SELECT
    USING (is_active = TRUE AND verified = TRUE);

-- RESCUE BAGS POLICIES
CREATE POLICY "Anyone can view active rescue bags"
    ON rescue_bags FOR SELECT
    USING (is_active = TRUE AND quantity_available > 0);

-- ORDERS POLICIES
CREATE POLICY "Customers can view their own orders"
    ON orders FOR SELECT
    USING (auth.uid() = customer_id);

CREATE POLICY "Customers can create their own orders"
    ON orders FOR INSERT
    WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can update their own pending orders"
    ON orders FOR UPDATE
    USING (auth.uid() = customer_id AND status = 'pending');

-- FAVORITES POLICIES
CREATE POLICY "Customers can view their own favorites"
    ON favorites FOR SELECT
    USING (auth.uid() = customer_id);

CREATE POLICY "Customers can add favorites"
    ON favorites FOR INSERT
    WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can remove favorites"
    ON favorites FOR DELETE
    USING (auth.uid() = customer_id);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_locations_updated_at BEFORE UPDATE ON customer_locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rescue_bags_updated_at BEFORE UPDATE ON rescue_bags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to calculate distance between two points (in kilometers)
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DECIMAL,
    lon1 DECIMAL,
    lat2 DECIMAL,
    lon2 DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
    R DECIMAL := 6371; -- Earth's radius in kilometers
    dLat DECIMAL;
    dLon DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    dLat := RADIANS(lat2 - lat1);
    dLon := RADIANS(lon2 - lon1);
    
    a := SIN(dLat/2) * SIN(dLat/2) +
         COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
         SIN(dLon/2) * SIN(dLon/2);
    
    c := 2 * ATAN2(SQRT(a), SQRT(1-a));
    
    RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- SEED DATA (for testing)
-- =====================================================

-- Insert sample restaurant (you can remove this in production)
INSERT INTO restaurants (
    name, owner_name, email, phone, 
    address_line1, city, state, pincode,
    latitude, longitude,
    cuisine_types, description, verified, is_active
) VALUES (
    'The Kitchen Collective',
    'Rajesh Kumar',
    'contact@kitchencollective.com',
    '+919876543210',
    '123 RS Puram',
    'Coimbatore',
    'Tamil Nadu',
    '641002',
    11.0168,
    76.9558,
    ARRAY['Indian', 'Continental'],
    'A premium restaurant serving authentic Indian and Continental cuisine',
    TRUE,
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- Insert sample rescue bag
INSERT INTO rescue_bags (
    restaurant_id,
    title,
    description,
    size,
    original_price,
    discounted_price,
    quantity_available,
    pickup_start_time,
    pickup_end_time,
    available_date
) 
SELECT 
    id,
    'Evening Surprise Bag',
    'A delightful mix of our chef''s special dishes from today''s menu',
    'medium',
    500.00,
    199.00,
    5,
    '20:00:00',
    '22:00:00',
    CURRENT_DATE
FROM restaurants 
WHERE email = 'contact@kitchencollective.com'
LIMIT 1;
