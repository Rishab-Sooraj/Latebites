-- Server-side restaurant filtering by distance
-- This function runs in PostgreSQL and filters restaurants within a given radius
-- Usage: SELECT * FROM get_nearby_restaurants(11.0168, 76.9558, 7);

-- Create the main RPC function for fetching nearby restaurants
CREATE OR REPLACE FUNCTION get_nearby_restaurants(
    user_lat DECIMAL,
    user_lon DECIMAL,
    radius_km DECIMAL DEFAULT 7
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    owner_name TEXT,
    email TEXT,
    phone TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    latitude DECIMAL,
    longitude DECIMAL,
    cuisine_types TEXT[],
    profile_image_url TEXT,
    cover_image_url TEXT,
    description TEXT,
    verified BOOLEAN,
    is_active BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    distance_km DECIMAL
) AS $$
BEGIN
    -- Validate input coordinates
    IF user_lat IS NULL OR user_lon IS NULL THEN
        RAISE EXCEPTION 'User coordinates are required';
    END IF;
    
    IF user_lat < -90 OR user_lat > 90 THEN
        RAISE EXCEPTION 'Invalid latitude: must be between -90 and 90';
    END IF;
    
    IF user_lon < -180 OR user_lon > 180 THEN
        RAISE EXCEPTION 'Invalid longitude: must be between -180 and 180';
    END IF;

    RETURN QUERY
    SELECT 
        r.id,
        r.name,
        r.owner_name,
        r.email,
        r.phone,
        r.address_line1,
        r.address_line2,
        r.city,
        r.state,
        r.pincode,
        r.latitude,
        r.longitude,
        r.cuisine_types,
        r.profile_image_url,
        r.cover_image_url,
        r.description,
        r.verified,
        r.is_active,
        r.created_at,
        r.updated_at,
        ROUND(calculate_distance(user_lat, user_lon, r.latitude, r.longitude)::DECIMAL, 2) as distance_km
    FROM restaurants r
    WHERE r.is_active = TRUE
      AND r.verified = TRUE
      AND r.latitude IS NOT NULL
      AND r.longitude IS NOT NULL
      AND calculate_distance(user_lat, user_lon, r.latitude, r.longitude) <= radius_km
    ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_nearby_restaurants(DECIMAL, DECIMAL, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION get_nearby_restaurants(DECIMAL, DECIMAL, DECIMAL) TO anon;

-- Add helpful comment
COMMENT ON FUNCTION get_nearby_restaurants IS 'Fetches restaurants within a specified radius (default 7km) from user coordinates. Distance calculated using Haversine formula.';
