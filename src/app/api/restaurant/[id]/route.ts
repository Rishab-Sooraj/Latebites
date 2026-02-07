import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Get today's date in IST timezone (UTC+5:30)
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istTime = new Date(now.getTime() + istOffset);
        const today = istTime.toISOString().split('T')[0];

        // Fetch restaurant
        const { data: restaurant, error: restaurantError } = await supabase
            .from('restaurants')
            .select('*')
            .eq('id', id)
            .single();

        if (restaurantError) {
            console.error('Restaurant error:', restaurantError);
            return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
        }

        // Fetch bags for this restaurant
        const { data: bags, error: bagsError } = await supabase
            .from('rescue_bags')
            .select('*')
            .eq('restaurant_id', id)
            .eq('available_date', today)
            .eq('is_active', true)
            .gt('quantity_available', 0);

        if (bagsError) {
            console.error('Bags error:', bagsError);
        }

        return NextResponse.json({
            restaurant,
            bags: bags || []
        });
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
