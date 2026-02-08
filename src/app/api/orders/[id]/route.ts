import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Use service role to bypass RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Fetch order with related data using service role (bypasses RLS)
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select('*')
            .eq('id', id)
            .single();

        if (orderError) {
            return NextResponse.json({ error: orderError.message }, { status: 404 });
        }

        // Fetch rescue bag
        let rescueBag = null;
        if (order.rescue_bag_id) {
            const { data } = await supabaseAdmin
                .from('rescue_bags')
                .select('*')
                .eq('id', order.rescue_bag_id)
                .single();
            rescueBag = data;
        }

        // Fetch restaurant
        let restaurant = null;
        if (order.restaurant_id) {
            const { data } = await supabaseAdmin
                .from('restaurants')
                .select('*')
                .eq('id', order.restaurant_id)
                .single();
            restaurant = data;
        }

        return NextResponse.json({
            ...order,
            rescue_bags: rescueBag,
            restaurants: restaurant
        });
    } catch (error) {
        console.error('Error fetching order:', error);
        return NextResponse.json(
            { error: 'Failed to fetch order' },
            { status: 500 }
        );
    }
}
