-- Run this in Supabase SQL Editor to create a test order

INSERT INTO orders (
    customer_id,
    restaurant_id,
    rescue_bag_id,
    quantity,
    total_price,
    pickup_time,
    status,
    payment_status,
    created_at
)
SELECT 
    c.id as customer_id,
    r.id as restaurant_id,
    rb.id as rescue_bag_id,
    1 as quantity,
    199.00 as total_price,
    NOW() - INTERVAL '1 hour' as pickup_time,
    'completed' as status,
    'paid' as payment_status,
    NOW() - INTERVAL '3 hours' as created_at
FROM customers c
CROSS JOIN restaurants r
CROSS JOIN rescue_bags rb
WHERE c.email = 'rishabsooraj@gmail.com'
LIMIT 1;
