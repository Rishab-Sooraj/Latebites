-- Sample Data for Latebites
-- Run this in Supabase SQL Editor to populate your database with test data

-- Insert sample restaurants
INSERT INTO restaurants (id, name, owner_name, email, phone, address_line1, city, state, pincode, latitude, longitude, cuisine_types, description, is_active, verified) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Spice Garden', 'Rajesh Kumar', 'rajesh@spicegarden.com', '+919876543210', '123 MG Road', 'Bangalore', 'Karnataka', '560001', 12.9716, 77.5946, ARRAY['Indian', 'North Indian'], 'Authentic North Indian cuisine with a modern twist', true, true),
('550e8400-e29b-41d4-a716-446655440002', 'Coastal Bites', 'Priya Sharma', 'priya@coastalbites.com', '+919876543211', '456 Brigade Road', 'Bangalore', 'Karnataka', '560025', 12.9698, 77.6025, ARRAY['Coastal', 'Seafood'], 'Fresh coastal delicacies and seafood specialties', true, true),
('550e8400-e29b-41d4-a716-446655440003', 'Green Leaf Cafe', 'Amit Patel', 'amit@greenleaf.com', '+919876543212', '789 Indiranagar', 'Bangalore', 'Karnataka', '560038', 12.9784, 77.6408, ARRAY['Continental', 'Healthy'], 'Healthy continental food with organic ingredients', true, true),
('550e8400-e29b-41d4-a716-446655440004', 'Tandoor House', 'Suresh Reddy', 'suresh@tandoorhouse.com', '+919876543213', '321 Koramangala', 'Bangalore', 'Karnataka', '560034', 12.9352, 77.6245, ARRAY['Indian', 'Tandoor'], 'Traditional tandoor dishes and kebabs', true, true),
('550e8400-e29b-41d4-a716-446655440005', 'Pasta Paradise', 'Maria D''Souza', 'maria@pastaparadise.com', '+919876543214', '654 Whitefield', 'Bangalore', 'Karnataka', '560066', 12.9698, 77.7499, ARRAY['Italian', 'Continental'], 'Authentic Italian pasta and pizzas', true, true);

-- Insert sample rescue bags for today
INSERT INTO rescue_bags (id, restaurant_id, title, description, size, original_price, discounted_price, quantity_available, pickup_start_time, pickup_end_time, available_date, is_active) VALUES
-- Spice Garden bags
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'North Indian Feast', 'Assorted curries, naan, and rice - perfect for 2 people', 'medium', 600, 250, 5, '20:00:00', '21:30:00', CURRENT_DATE, true),
('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Tandoori Special', 'Mix of tandoori items including chicken, paneer, and breads', 'large', 800, 350, 3, '20:30:00', '22:00:00', CURRENT_DATE, true),

-- Coastal Bites bags
('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'Seafood Surprise', 'Fresh catch of the day with coastal spices', 'medium', 700, 300, 4, '21:00:00', '22:30:00', CURRENT_DATE, true),
('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'Fish Curry Combo', 'Fish curry with rice and sides', 'small', 400, 180, 6, '20:00:00', '21:30:00', CURRENT_DATE, true),

-- Green Leaf Cafe bags
('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003', 'Healthy Bowl Mix', 'Salads, wraps, and smoothies - perfect for health conscious', 'medium', 500, 220, 4, '19:30:00', '21:00:00', CURRENT_DATE, true),
('650e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440003', 'Continental Delight', 'Pasta, sandwiches, and desserts', 'large', 650, 280, 2, '20:00:00', '21:30:00', CURRENT_DATE, true),

-- Tandoor House bags
('650e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440004', 'Kebab Platter', 'Assorted kebabs with mint chutney and naan', 'medium', 550, 240, 5, '21:00:00', '22:30:00', CURRENT_DATE, true),
('650e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440004', 'Biryani Bonanza', 'Chicken or veg biryani with raita', 'large', 450, 200, 7, '20:30:00', '22:00:00', CURRENT_DATE, true),

-- Pasta Paradise bags
('650e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440005', 'Italian Combo', 'Pasta, garlic bread, and tiramisu', 'medium', 600, 260, 3, '20:00:00', '21:30:00', CURRENT_DATE, true),
('650e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440005', 'Pizza Party Pack', '2 medium pizzas with sides', 'large', 900, 400, 2, '21:00:00', '22:30:00', CURRENT_DATE, true);
