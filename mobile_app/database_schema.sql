-- LateBites Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('customer', 'restaurant', 'admin')),
  auth_provider TEXT NOT NULL CHECK (auth_provider IN ('google', 'email')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policies for users table
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- =====================================================
-- 2. RESTAURANTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  closing_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paused', 'delisted')),
  menu_source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- Policies for restaurants table
CREATE POLICY "Anyone can view approved restaurants"
  ON restaurants FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Restaurant owners can view their own restaurant"
  ON restaurants FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Restaurant owners can update their own restaurant"
  ON restaurants FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Restaurant owners can insert their own restaurant"
  ON restaurants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 3. RESCUE BAGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS rescue_bags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  size TEXT NOT NULL CHECK (size IN ('small', 'medium', 'large')),
  price DECIMAL(10, 2) NOT NULL,
  guaranteed_value DECIMAL(10, 2) NOT NULL,
  total_slots INTEGER NOT NULL CHECK (total_slots > 0),
  available_slots INTEGER NOT NULL CHECK (available_slots >= 0),
  pickup_start TIMESTAMP WITH TIME ZONE NOT NULL,
  pickup_end TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold_out', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_slots CHECK (available_slots <= total_slots),
  CONSTRAINT valid_pickup_window CHECK (pickup_end > pickup_start)
);

-- Enable RLS
ALTER TABLE rescue_bags ENABLE ROW LEVEL SECURITY;

-- Policies for rescue_bags table
CREATE POLICY "Anyone can view active rescue bags"
  ON rescue_bags FOR SELECT
  USING (status = 'active' AND available_slots > 0);

CREATE POLICY "Restaurant owners can manage their own bags"
  ON rescue_bags FOR ALL
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- 4. BOOKINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rescue_bag_id UUID NOT NULL REFERENCES rescue_bags(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  pickup_otp TEXT NOT NULL,
  otp_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'picked_up', 'cancelled', 'refunded')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  payment_amount DECIMAL(10, 2) NOT NULL,
  booking_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  pickup_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policies for bookings table
CREATE POLICY "Customers can view their own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Restaurants can view bookings for their bags"
  ON bookings FOR SELECT
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Customers can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Restaurants can update booking status"
  ON bookings FOR UPDATE
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- 5. FEEDBACK TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  value_met BOOLEAN NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Policies for feedback table
CREATE POLICY "Customers can create feedback for their bookings"
  ON feedback FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can view their own feedback"
  ON feedback FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Restaurants can view feedback for their restaurant"
  ON feedback FOR SELECT
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- 6. PENALTIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS penalties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  applied_by UUID NOT NULL REFERENCES users(id)
);

-- Enable RLS
ALTER TABLE penalties ENABLE ROW LEVEL SECURITY;

-- Policies for penalties table (admin only)
CREATE POLICY "Only admins can manage penalties"
  ON penalties FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rescue_bags_updated_at BEFORE UPDATE ON rescue_bags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate 6-digit OTP
CREATE OR REPLACE FUNCTION generate_otp()
RETURNS TEXT AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to decrease available slots when booking is created
CREATE OR REPLACE FUNCTION decrease_available_slots()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE rescue_bags
  SET available_slots = available_slots - 1
  WHERE id = NEW.rescue_bag_id;
  
  -- Update status to sold_out if no slots left
  UPDATE rescue_bags
  SET status = 'sold_out'
  WHERE id = NEW.rescue_bag_id AND available_slots = 0;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to decrease slots on booking
CREATE TRIGGER decrease_slots_on_booking
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION decrease_available_slots();

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_restaurants_status ON restaurants(status);
CREATE INDEX idx_restaurants_city ON restaurants(city);
CREATE INDEX idx_rescue_bags_restaurant_id ON rescue_bags(restaurant_id);
CREATE INDEX idx_rescue_bags_status ON rescue_bags(status);
CREATE INDEX idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX idx_bookings_restaurant_id ON bookings(restaurant_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_feedback_restaurant_id ON feedback(restaurant_id);

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Insert admin user (replace with your actual admin user ID)
-- INSERT INTO users (id, email, full_name, role, auth_provider)
-- VALUES ('your-admin-user-id', 'admin@latebites.com', 'Admin User', 'admin', 'email');

COMMENT ON TABLE users IS 'User accounts with role-based access';
COMMENT ON TABLE restaurants IS 'Restaurant profiles and details';
COMMENT ON TABLE rescue_bags IS 'Available rescue bags for booking';
COMMENT ON TABLE bookings IS 'Customer bookings with OTP verification';
COMMENT ON TABLE feedback IS 'Post-pickup customer feedback';
COMMENT ON TABLE penalties IS 'Penalties applied to restaurants';
