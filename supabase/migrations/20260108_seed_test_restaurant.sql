-- =====================================================
-- TEST RESTAURANT SETUP FOR LATEBITES
-- =====================================================
-- Run this in Supabase SQL Editor after creating the auth user
--
-- STEP 1: First create auth user in Supabase Dashboard:
--   Go to: Authentication → Users → Add User
--   Email: restaurant@latebites.in
--   Password: Test@123
--
-- STEP 2: Then run this SQL
-- =====================================================

-- Insert test restaurant in Coimbatore
INSERT INTO restaurants (
    id,
    name,
    owner_name,
    email,
    phone,
    address_line1,
    address_line2,
    city,
    state,
    pincode,
    latitude,
    longitude,
    cuisine_types,
    profile_image_url,
    cover_image_url,
    description,
    verified,
    is_active,
    created_at,
    updated_at
) VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
    'Spice Garden Restaurant',
    'Rajan Kumar',
    'restaurant@latebites.in',
    '+91 9876543210',
    '123 RS Puram Main Road',
    'Near Town Hall',
    'Coimbatore',
    'Tamil Nadu',
    '641002',
    11.0168,
    76.9558,
    ARRAY['South Indian', 'North Indian', 'Chinese'],
    NULL,
    NULL,
    'A family restaurant serving delicious multi-cuisine food since 1995.',
    true,
    true,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = NOW();

-- Create rescue bags for today
INSERT INTO rescue_bags (
    id,
    restaurant_id,
    title,
    description,
    size,
    original_price,
    discounted_price,
    quantity_available,
    pickup_start_time,
    pickup_end_time,
    available_date,
    image_url,
    is_active,
    created_at,
    updated_at
) VALUES 
(
    'b1c2d3e4-f5a6-7890-bcde-f12345678901'::uuid,
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
    'South Indian Surprise Bag',
    'A delightful mix of our famous dosas, idlis, vadas and sambhar. Perfect for breakfast lovers!',
    'medium',
    350,
    175,
    5,
    '19:00:00',
    '21:00:00',
    CURRENT_DATE,
    NULL,
    true,
    NOW(),
    NOW()
),
(
    'c1d2e3f4-a5b6-7890-cdef-123456789012'::uuid,
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
    'North Indian Dinner Delight',
    'Includes fresh rotis, dal makhani, paneer curry and rice. A complete dinner experience.',
    'large',
    500,
    250,
    3,
    '20:00:00',
    '22:00:00',
    CURRENT_DATE,
    NULL,
    true,
    NOW(),
    NOW()
),
(
    'd1e2f3a4-b5c6-7890-defa-234567890123'::uuid,
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
    'Quick Snack Pack',
    'Assorted snacks including samosas, pakoras and chutneys. Great for evening munchies!',
    'small',
    200,
    99,
    8,
    '18:00:00',
    '20:00:00',
    CURRENT_DATE,
    NULL,
    true,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    quantity_available = EXCLUDED.quantity_available,
    available_date = CURRENT_DATE,
    updated_at = NOW();

-- Verify the data was inserted
SELECT 'Restaurant created:' as status, name, city, verified, is_active 
FROM restaurants 
WHERE email = 'restaurant@latebites.in';

SELECT 'Rescue bags created:' as status, title, discounted_price, quantity_available, available_date
FROM rescue_bags 
WHERE restaurant_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid;
