import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // 1. Authenticate user
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Initialize admin client inside handler
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceRoleKey) {
            console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        // 3. Fetch order with authorization check
        // Query must ensure the order belongs to the authenticated user
        // OR if the user is an admin (which we'd need to verify separately, but for now strict ownership is safest)
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select('*')
            .eq('id', id)
            .single();

        if (orderError || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Verify ownership
        // Note: admin users might need access, but current implementation doesn't seem to have a global admin check here.
        // Assuming strict customer ownership for this endpoint.
        if (order.customer_id !== user.id) {
            console.warn(`⚠️ Unauthorized access attempt: User ${user.id} tried to access order ${id} owned by ${order.customer_id}`);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
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
