import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { orderId, reason, adminEmail } = body;

        // Validate required fields
        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }
        if (!reason || !reason.trim()) {
            return NextResponse.json({ error: 'Cancellation reason is required' }, { status: 400 });
        }
        if (!adminEmail) {
            return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
        }

        const adminClient = createAdminClient();

        // Verify caller is a valid, active admin (both admin and super_admin allowed)
        const { data: adminData, error: adminError } = await adminClient
            .from('admins')
            .select('id, role, name')
            .ilike('email', adminEmail)
            .eq('is_active', true)
            .single();

        if (adminError || !adminData) {
            return NextResponse.json({ error: 'Unauthorized: invalid or inactive admin' }, { status: 401 });
        }

        // Fetch order with rescue bag details
        const { data: order, error: orderError } = await adminClient
            .from('orders')
            .select('*, rescue_bags(*)')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Edge case: already cancelled or completed
        if (order.status === 'cancelled') {
            return NextResponse.json({ error: 'Order is already cancelled' }, { status: 400 });
        }
        if (order.status === 'completed' || order.status === 'picked_up') {
            return NextResponse.json({ error: 'Cannot cancel a completed order' }, { status: 400 });
        }

        // Cancel the order
        const { error: updateError } = await adminClient
            .from('orders')
            .update({
                status: 'cancelled',
                cancellation_reason: reason.trim(),
                cancelled_by: `admin:${adminData.name || adminEmail}`,
                updated_at: new Date().toISOString(),
            })
            .eq('id', orderId);

        if (updateError) {
            console.error('Order update error:', updateError);
            return NextResponse.json({ error: `Failed to cancel order: ${updateError.message}` }, { status: 500 });
        }

        // Restore bag quantity (regardless of lock-in — admin override)
        const rescueBag = order.rescue_bags;
        if (order.rescue_bag_id && rescueBag && typeof rescueBag.quantity_available === 'number') {
            const orderQty = order.quantity ?? 1;
            await adminClient
                .from('rescue_bags')
                .update({ quantity_available: rescueBag.quantity_available + orderQty })
                .eq('id', order.rescue_bag_id);
        }

        // Determine refund eligibility
        const isPaidOnline = order.payment_method === 'online' && order.payment_status === 'paid';
        const alreadyRefunded = order.refund_status === 'full';

        return NextResponse.json({
            success: true,
            orderId,
            message: 'Order cancelled successfully.',
            eligibleForRefund: isPaidOnline && !alreadyRefunded,
            paymentMethod: order.payment_method,
            totalAmount: order.total_price,
        });

    } catch (error: any) {
        console.error('Admin cancel order error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
