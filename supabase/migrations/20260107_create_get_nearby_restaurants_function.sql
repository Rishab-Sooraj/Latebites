-- Create function to get nearby restaurants using PostGIS
-- This function calculates distance between user location and restaurants
-- and returns restaurants within the specified radius

CREATE OR REPLACE FUNCTION public.get_nearby_restaurants(
    user_lat DOUBLE PRECISION,
    user_lon DOUBLE PRECISION,
    radius_km DOUBLE PRECISION DEFAULT 7
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
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    cuisine_types TEXT[],
    profile_image_url TEXT,
    cover_image_url TEXT,
    description TEXT,
    verified BOOLEAN,
    is_active BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    distance_km DOUBLE PRECISION
)
LANGUAGE plpgsql
AS $$
BEGIN
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
        -- Calculate distance using Haversine formula
        (
            6371 * acos(
                cos(radians(user_lat)) *
                cos(radians(r.latitude)) *
                cos(radians(r.longitude) - radians(user_lon)) +
                sin(radians(user_lat)) *
                sin(radians(r.latitude))
            )
        )::DOUBLE PRECISION AS distance_km
    FROM
        public.restaurants r
    WHERE
        r.is_active = true
        AND r.verified = true
        -- Pre-filter using a bounding box for better performance
        AND r.latitude BETWEEN (user_lat - (radius_km / 111.0)) AND (user_lat + (radius_km / 111.0))
        AND r.longitude BETWEEN (user_lon - (radius_km / (111.0 * cos(radians(user_lat))))) AND (user_lon + (radius_km / (111.0 * cos(radians(user_lat)))))
    HAVING
        -- Final distance filter using Haversine formula
        (
            6371 * acos(
                cos(radians(user_lat)) *
                cos(radians(r.latitude)) *
                cos(radians(r.longitude) - radians(user_lon)) +
                sin(radians(user_lat)) *
                sin(radians(r.latitude))
            )
        ) <= radius_km
    ORDER BY
        distance_km ASC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_nearby_restaurants(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_nearby_restaurants(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) TO anon;
