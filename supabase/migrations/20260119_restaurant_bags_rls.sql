-- Migration: Add RLS policies for restaurants to manage their rescue bags
-- This allows restaurant owners to INSERT, UPDATE, DELETE their own rescue_bags

-- Drop existing restrictive SELECT policy if exists
DROP POLICY IF EXISTS "Anyone can view active rescue bags" ON rescue_bags;

-- Create new policies for rescue_bags

-- Restaurants can view all their own bags (not just active ones)
CREATE POLICY "Restaurants can view their own bags"
    ON rescue_bags FOR SELECT
    USING (
        auth.uid() = restaurant_id
        OR (is_active = TRUE AND quantity_available > 0)
    );

-- Restaurants can insert their own bags
CREATE POLICY "Restaurants can insert their own bags"
    ON rescue_bags FOR INSERT
    WITH CHECK (auth.uid() = restaurant_id);

-- Restaurants can update their own bags
CREATE POLICY "Restaurants can update their own bags"
    ON rescue_bags FOR UPDATE
    USING (auth.uid() = restaurant_id);

-- Restaurants can delete their own bags
CREATE POLICY "Restaurants can delete their own bags"
    ON rescue_bags FOR DELETE
    USING (auth.uid() = restaurant_id);

-- Also add RLS policies for restaurants to view/update their own profile
DROP POLICY IF EXISTS "Anyone can view active verified restaurants" ON restaurants;

CREATE POLICY "Restaurants can view their own profile"
    ON restaurants FOR SELECT
    USING (
        auth.uid() = id
        OR (is_active = TRUE AND verified = TRUE)
    );

CREATE POLICY "Restaurants can update their own profile"
    ON restaurants FOR UPDATE
    USING (auth.uid() = id);

-- Add policy for restaurants to view their orders
CREATE POLICY "Restaurants can view their orders"
    ON orders FOR SELECT
    USING (auth.uid() = restaurant_id);

-- Add policy for restaurants to update their orders (e.g., mark as completed)
CREATE POLICY "Restaurants can update their orders"
    ON orders FOR UPDATE
    USING (auth.uid() = restaurant_id);
