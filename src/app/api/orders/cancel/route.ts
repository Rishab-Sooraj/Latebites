import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const { orderId, reason } = await request.json();

        if (!orderId) {
            return NextResponse.json(
                { error: 'Order ID is required' },
                { status: 400 }
            );
        }

        // Get the order to restore bag quantity
        const { data: order, error: fetchError } = await supabase
            .from('orders')
            .select('rescue_bag_id, quantity, status')
            .eq('id', orderId)
            .single();

        if (fetchError || !order) {
            console.error('Order fetch error:', fetchError);
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        // Only cancel if order is still pending
        if (order.status !== 'pending') {
            return NextResponse.json(
                { error: 'Order cannot be cancelled - already processed' },
                { status: 400 }
            );
        }

        // Update order status to cancelled
        const { error: updateError } = await supabase
            .from('orders')
            .update({
                status: 'cancelled',
                payment_status: 'failed',
                cancellation_reason: reason || 'Payment cancelled or failed',
            })
            .eq('id', orderId);

        if (updateError) {
            console.error('Order update error:', updateError);
            return NextResponse.json(
                { error: 'Failed to cancel order' },
                { status: 500 }
            );
        }

        // Restore bag quantity
        const { data: bag } = await supabase
            .from('rescue_bags')
            .select('quantity_available')
            .eq('id', order.rescue_bag_id)
            .single();

        if (bag) {
            await supabase
                .from('rescue_bags')
                .update({ quantity_available: bag.quantity_available + order.quantity })
                .eq('id', order.rescue_bag_id);
        }

        console.log(`Order ${orderId} cancelled: ${reason}`);

        return NextResponse.json({
            success: true,
            message: 'Order cancelled successfully',
        });
    } catch (error: any) {
        console.error('Order cancellation error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
