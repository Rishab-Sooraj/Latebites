import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// Haversine formula for calculating distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100; // Round to 2 decimal places
}

interface NearbyRestaurantsRequest {
    latitude: number;
    longitude: number;
    radius?: number;
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
                            // Ignore
                        }
                    },
                    remove(name: string, options: CookieOptions) {
                        try {
                            cookieStore.set({ name, value: '', ...options });
                        } catch {
                            // Ignore
                        }
                    },
                },
            }
        );

        console.log('🔍 DEBUG: Query params:', { latitude, longitude, radius });

        // Get all active restaurants (simplified - no distance filter for now)
        const { data: restaurants, error: restError } = await supabase
            .from('restaurants')
            .select('*')
            .eq('is_active', true);

        console.log('🔍 DEBUG: Restaurants found:', restaurants?.length || 0);
        if (restError) {
            console.error('🔍 DEBUG: Restaurant error:', restError);
            return NextResponse.json({ error: 'Failed to fetch restaurants' }, { status: 500 });
        }

        if (!restaurants || restaurants.length === 0) {
            console.log('🔍 DEBUG: No active restaurants found');
            return NextResponse.json({ restaurants: [], total: 0, query: { latitude, longitude, radius_km: radius } });
        }

        // Get restaurant IDs
        const restaurantIds = restaurants.map(r => r.id);
        console.log('🔍 DEBUG: Restaurant IDs:', restaurantIds);

        // Get today's date in IST timezone (UTC+5:30)
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
        const istTime = new Date(now.getTime() + istOffset);
        const todayDate = istTime.toISOString().split('T')[0];
        console.log('🔍 DEBUG: Today date (IST):', todayDate);

        // Get ALL bags for debugging
        const { data: allBags } = await supabase
            .from('rescue_bags')
            .select('*')
            .in('restaurant_id', restaurantIds);
        console.log('🔍 DEBUG: ALL bags for these restaurants:', allBags?.length || 0, allBags);

        // Get filtered bags
        const { data: bags, error: bagsError } = await supabase
            .from('rescue_bags')
            .select('*')
            .in('restaurant_id', restaurantIds)
            .eq('is_active', true)
            .gte('quantity_available', 1)
            .eq('available_date', todayDate);

        console.log('🔍 DEBUG: Filtered bags:', bags?.length || 0, bags);
        if (bagsError) {
            console.error('🔍 DEBUG: Bags error:', bagsError);
        }

        // Group bags by restaurant_id
        const rescueBags: Record<string, any[]> = {};
        if (bags) {
            for (const bag of bags) {
                if (!rescueBags[bag.restaurant_id]) {
                    rescueBags[bag.restaurant_id] = [];
                }
                rescueBags[bag.restaurant_id].push(bag);
            }
        }

        // Combine restaurants with bags and calculate distance
        const restaurantsWithBags = restaurants.map(restaurant => ({
            ...restaurant,
            rescue_bags: rescueBags[restaurant.id] || [],
            distance_km: calculateDistance(latitude, longitude, restaurant.latitude, restaurant.longitude),
        }));

        // Filter to only restaurants with bags
        const result = restaurantsWithBags.filter(r => r.rescue_bags.length > 0);

        console.log('🔍 DEBUG: Final result count:', result.length);

        return NextResponse.json({
            restaurants: result,
            total: result.length,
            query: { latitude, longitude, radius_km: radius },
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}
