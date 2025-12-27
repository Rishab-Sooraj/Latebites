-- Sample data for testing the customer app
-- Run this in Supabase SQL Editor after running the main schema

-- Insert sample restaurants (Coimbatore area)
INSERT INTO restaurants (name, email, phone, address, city, state, postal_code, latitude, longitude, status) VALUES
('The French Loaf', 'contact@frenchloaf.com', '+91 98765 43210', 'RS Puram', 'Coimbatore', 'Tamil Nadu', '641002', '11.0168', '76.9558', 'approved'),
('Annapoorna Restaurant', 'info@annapoorna.com', '+91 98765 43211', 'Gandhipuram', 'Coimbatore', 'Tamil Nadu', '641012', '11.0183', '76.9725', 'approved'),
('Shree Anandhaas', 'hello@shreeanandhaas.com', '+91 98765 43212', 'Saibaba Colony', 'Coimbatore', 'Tamil Nadu', '641011', '11.0234', '76.9599', 'approved'),
('Haribhavanam', 'contact@haribhavanam.com', '+91 98765 43213', 'Race Course', 'Coimbatore', 'Tamil Nadu', '641018', '11.0051', '76.9642', 'approved'),
('That Baking Company', 'hello@thatbakingco.com', '+91 98765 43214', 'Avinashi Road', 'Coimbatore', 'Tamil Nadu', '641037', '11.0301', '76.9876', 'approved');

-- Get restaurant IDs for inserting rescue bags
DO $$
DECLARE
  french_loaf_id UUID;
  annapoorna_id UUID;
  anandhaas_id UUID;
  haribhavanam_id UUID;
  baking_co_id UUID;
BEGIN
  -- Get restaurant IDs
  SELECT id INTO french_loaf_id FROM restaurants WHERE name = 'The French Loaf';
  SELECT id INTO annapoorna_id FROM restaurants WHERE name = 'Annapoorna Restaurant';
  SELECT id INTO anandhaas_id FROM restaurants WHERE name = 'Shree Anandhaas';
  SELECT id INTO haribhavanam_id FROM restaurants WHERE name = 'Haribhavanam';
  SELECT id INTO baking_co_id FROM restaurants WHERE name = 'That Baking Company';

  -- Insert rescue bags for today/tomorrow
  INSERT INTO rescue_bags (restaurant_id, size, price, guaranteed_value, description, pickup_start, pickup_end, total_slots, available_slots, status) VALUES
  -- The French Loaf - Bakery items
  (french_loaf_id, 'small', 99, 250, 'Fresh pastries, croissants, and bread from today''s batch', 
   CURRENT_DATE + INTERVAL '18 hours', CURRENT_DATE + INTERVAL '20 hours', 10, 7, 'active'),
  (french_loaf_id, 'medium', 149, 400, 'Assorted bakery items including cakes, pastries, and sandwiches', 
   CURRENT_DATE + INTERVAL '19 hours', CURRENT_DATE + INTERVAL '21 hours', 8, 5, 'active'),
  
  -- Annapoorna - South Indian
  (annapoorna_id, 'medium', 129, 350, 'Variety of South Indian dishes - dosas, idlis, vadas, and chutneys', 
   CURRENT_DATE + INTERVAL '20 hours', CURRENT_DATE + INTERVAL '22 hours', 15, 12, 'active'),
  (annapoorna_id, 'large', 199, 550, 'Full South Indian meal with rice, sambar, curries, and sweets', 
   CURRENT_DATE + INTERVAL '20 hours 30 minutes', CURRENT_DATE + INTERVAL '22 hours 30 minutes', 10, 8, 'active'),
  
  -- Shree Anandhaas - Sweets & Snacks
  (anandhaas_id, 'small', 89, 220, 'Assorted sweets and savory snacks', 
   CURRENT_DATE + INTERVAL '19 hours 30 minutes', CURRENT_DATE + INTERVAL '21 hours 30 minutes', 12, 3, 'active'),
  (anandhaas_id, 'medium', 139, 380, 'Mix of traditional sweets, snacks, and mini meals', 
   CURRENT_DATE + INTERVAL '20 hours', CURRENT_DATE + INTERVAL '22 hours', 8, 6, 'active'),
  
  -- Haribhavanam - North & South Indian
  (haribhavanam_id, 'medium', 159, 420, 'Mixed Indian cuisine - rotis, curries, rice, and desserts', 
   CURRENT_DATE + INTERVAL '21 hours', CURRENT_DATE + INTERVAL '23 hours', 12, 10, 'active'),
  (haribhavanam_id, 'large', 229, 650, 'Complete meal with starters, mains, rice, breads, and sweets', 
   CURRENT_DATE + INTERVAL '21 hours 30 minutes', CURRENT_DATE + INTERVAL '23 hours 30 minutes', 6, 4, 'active'),
  
  -- That Baking Company - Artisan Bakery
  (baking_co_id, 'small', 119, 300, 'Artisan breads, cookies, and pastries', 
   CURRENT_DATE + INTERVAL '18 hours 30 minutes', CURRENT_DATE + INTERVAL '20 hours 30 minutes', 8, 6, 'active'),
  (baking_co_id, 'medium', 179, 480, 'Premium bakery box with cakes, breads, and gourmet items', 
   CURRENT_DATE + INTERVAL '19 hours', CURRENT_DATE + INTERVAL '21 hours', 5, 2, 'active');
  
  -- Add some bags for tomorrow as well
  INSERT INTO rescue_bags (restaurant_id, size, price, guaranteed_value, description, pickup_start, pickup_end, total_slots, available_slots, status) VALUES
  (french_loaf_id, 'medium', 149, 400, 'Tomorrow''s fresh bakery surplus', 
   CURRENT_DATE + INTERVAL '1 day 18 hours', CURRENT_DATE + INTERVAL '1 day 20 hours', 10, 10, 'active'),
  (annapoorna_id, 'large', 199, 550, 'Tomorrow''s South Indian feast', 
   CURRENT_DATE + INTERVAL '1 day 20 hours', CURRENT_DATE + INTERVAL '1 day 22 hours', 12, 12, 'active');
END $$;

-- Verify the data
SELECT 
  rb.size,
  rb.price,
  rb.guaranteed_value,
  rb.available_slots,
  rb.total_slots,
  rb.pickup_start,
  rb.pickup_end,
  r.name as restaurant_name,
  r.address,
  r.city
FROM rescue_bags rb
JOIN restaurants r ON rb.restaurant_id = r.id
WHERE rb.status = 'active'
ORDER BY rb.pickup_start;
