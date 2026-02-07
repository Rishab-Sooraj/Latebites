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

        // Fetch bag details
        const { data: bag, error: bagError } = await supabase
            .from('rescue_bags')
            .select('*')
            .eq('id', id)
            .single();

        if (bagError || !bag) {
            return NextResponse.json(
                { error: 'Bag not found' },
                { status: 404 }
            );
        }

        // Fetch restaurant details  
        const { data: restaurant, error: restaurantError } = await supabase
            .from('restaurants')
            .select('id, name, address_line1, city, cover_image_url')
            .eq('id', bag.restaurant_id)
            .single();

        if (restaurantError || !restaurant) {
            return NextResponse.json(
                { error: 'Restaurant not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            bag,
            restaurant
        });
    } catch (error: any) {
        console.error('Error fetching bag:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
