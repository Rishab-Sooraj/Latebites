import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

interface NearbyRestaurantsRequest {
    latitude: number;
    longitude: number;
    radius?: number;
}

interface Restaurant {
    id: string;
    name: string;
    owner_name: string;
    email: string;
    phone: string;
    address_line1: string;
    address_line2: string | null;
    city: string;
    state: string;
    pincode: string;
    latitude: number;
    longitude: number;
    cuisine_types: string[] | null;
    profile_image_url: string | null;
    cover_image_url: string | null;
    description: string | null;
    verified: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    distance_km: number;
}

export async function POST(request: NextRequest) {
    try {
        const body: NearbyRestaurantsRequest = await request.json();
        const { latitude, longitude, radius = 7 } = body;

        // Validate required fields
        if (latitude === undefined || longitude === undefined) {
            return NextResponse.json(
                { error: 'Latitude and longitude are required' },
                { status: 400 }
            );
        }

        // Validate coordinate ranges
        if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
            return NextResponse.json(
                { error: 'Invalid latitude: must be a number between -90 and 90' },
                { status: 400 }
            );
        }

        if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
            return NextResponse.json(
                { error: 'Invalid longitude: must be a number between -180 and 180' },
                { status: 400 }
            );
        }

        // Validate radius
        if (typeof radius !== 'number' || radius <= 0 || radius > 50) {
            return NextResponse.json(
                { error: 'Invalid radius: must be a number between 0 and 50 km' },
                { status: 400 }
            );
        }

        // Create Supabase client
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        try {
                            cookieStore.set({ name, value, ...options });
                        } catch {
                            // Ignore - this happens in read-only contexts
                        }
                    },
                    remove(name: string, options: CookieOptions) {
                        try {
                            cookieStore.set({ name, value: '', ...options });
                        } catch {
                            // Ignore - this happens in read-only contexts
                        }
                    },
                },
            }
        );

        // Call the RPC function to get nearby restaurants
        const { data: restaurants, error } = await supabase.rpc('get_nearby_restaurants', {
            user_lat: latitude,
            user_lon: longitude,
            radius_km: radius,
        });

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch nearby restaurants' },
                { status: 500 }
            );
        }

        // Fetch rescue bags for the returned restaurants
        const restaurantIds = (restaurants as Restaurant[]).map(r => r.id);

        let rescueBags: Record<string, any[]> = {};

        if (restaurantIds.length > 0) {
            const { data: bags, error: bagsError } = await supabase
                .from('rescue_bags')
                .select('*')
                .in('restaurant_id', restaurantIds)
                .eq('is_active', true)
                .gte('quantity_available', 1)
                .eq('available_date', new Date().toISOString().split('T')[0]);

            if (!bagsError && bags) {
                // Group bags by restaurant_id
                rescueBags = bags.reduce((acc: Record<string, any[]>, bag) => {
                    const restaurantId = bag.restaurant_id;
                    if (!acc[restaurantId]) {
                        acc[restaurantId] = [];
                    }
                    acc[restaurantId].push(bag);
                    return acc;
                }, {});
            }
        }

        // Combine restaurants with their rescue bags
        const restaurantsWithBags = (restaurants as Restaurant[]).map(restaurant => ({
            ...restaurant,
            rescue_bags: rescueBags[restaurant.id] || [],
        }));

        // Only return restaurants that have available bags
        const restaurantsWithAvailableBags = restaurantsWithBags.filter(
            r => r.rescue_bags.length > 0
        );

        return NextResponse.json({
            restaurants: restaurantsWithAvailableBags,
            total: restaurantsWithAvailableBags.length,
            query: {
                latitude,
                longitude,
                radius_km: radius,
            },
        });
    } catch (error) {
        console.error('Unexpected error in nearby restaurants API:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
