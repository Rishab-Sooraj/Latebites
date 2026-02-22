import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service role to bypass RLS for strike issuance and order updates
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * Restaurant-side order cancellation.
 *
 * Rules:
 *   - Order must be pending/confirmed (not already cancelled or completed)
 *   - Lock-in = 45 minutes before pickup_start_time
 *   - BEFORE lock-in: free cancellation, bag quantity restored
 *   - AFTER lock-in: cancellation still allowed but a STRIKE is issued to the
 *     restaurant (the customer contacts support for refund if applicable)
 *
 * Body: { orderId: string, restaurantId: string, reason?: string }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { orderId, restaurantId, reason } = body;

        if (!orderId || !restaurantId) {
            return NextResponse.json(
                { error: 'orderId and restaurantId are required' },
                { status: 400 }
            );
        }

        // Fetch order with its rescue bag
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*, rescue_bags(*)')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Verify this order belongs to the requesting restaurant
        if (order.restaurant_id !== restaurantId) {
            return NextResponse.json({ error: 'Forbidden: order does not belong to this restaurant' }, { status: 403 });
        }

        // Edge cases
        if (order.status === 'cancelled') {
            return NextResponse.json({ error: 'Order is already cancelled' }, { status: 400 });
        }
        if (order.status === 'completed' || order.status === 'picked_up') {
            return NextResponse.json({ error: 'Cannot cancel a completed/picked-up order' }, { status: 400 });
        }

        // --- Determine lock-in status ---
        const rescueBag = order.rescue_bags;
        let isAfterLockIn = false;

        if (rescueBag?.pickup_start_time) {
            const now = new Date();
            const [hours, minutes, secs] = rescueBag.pickup_start_time.split(':').map(Number);

            // Build today's pickup datetime in IST (Supabase times are in IST)
            let pickupStart = new Date();
            pickupStart.setHours(hours, minutes, secs || 0, 0);

            // If pickup time has already passed today, it means tomorrow's slot
            if (pickupStart.getTime() < now.getTime()) {
                pickupStart = new Date(pickupStart.getTime() + 24 * 60 * 60 * 1000);
            }

            // Lock-in = 45 minutes before pickup start
            const lockInTime = new Date(pickupStart.getTime() - 45 * 60 * 1000);
            isAfterLockIn = now.getTime() > lockInTime.getTime();
        }

        // --- Cancel the order ---
        const cancellationReason = reason?.trim() || (isAfterLockIn ? 'Cancelled by restaurant after lock-in' : 'Cancelled by restaurant');

        const { error: cancelError } = await supabase
            .from('orders')
            .update({
                status: 'cancelled',
                cancellation_reason: cancellationReason,
                cancelled_by: `restaurant:${restaurantId}`,
                updated_at: new Date().toISOString(),
            })
            .eq('id', orderId);

        if (cancelError) {
            return NextResponse.json({ error: `Failed to cancel order: ${cancelError.message}` }, { status: 500 });
        }

        // --- Restore bag quantity ---
        if (order.rescue_bag_id && rescueBag && typeof rescueBag.quantity_available === 'number') {
            const orderQty = order.quantity ?? 1;
            await supabase
                .from('rescue_bags')
                .update({ quantity_available: rescueBag.quantity_available + orderQty })
                .eq('id', order.rescue_bag_id);
        }

        // --- If after lock-in: issue a penalty strike ---
        let strikeIssued = false;
        let newStrikeCount = 0;
        let restaurantDeactivated = false;

        if (isAfterLockIn) {
            // Fetch current strike count
            const { data: restaurantData } = await supabase
                .from('restaurants')
                .select('strike_count, name')
                .eq('id', restaurantId)
                .single();

            if (restaurantData) {
                const currentStrikes = restaurantData.strike_count ?? 0;
                newStrikeCount = currentStrikes + 1;
                restaurantDeactivated = newStrikeCount >= 3;

                // Insert strike record
                await supabase.from('restaurant_strikes').insert({
                    restaurant_id: restaurantId,
                    strike_number: newStrikeCount,
                    reason: `Post lock-in cancellation — Order #${orderId.substring(0, 8).toUpperCase()}. ${cancellationReason}`,
                    issued_by_name: restaurantData.name,
                    issued_by_role: 'system_auto',
                });

                // Update restaurant strike count (and deactivate if 3 strikes)
                const restaurantUpdate: Record<string, any> = { strike_count: newStrikeCount };
                if (restaurantDeactivated) restaurantUpdate.is_active = false;

                await supabase
                    .from('restaurants')
                    .update(restaurantUpdate)
                    .eq('id', restaurantId);

                strikeIssued = true;
            }
        }

        return NextResponse.json({
            success: true,
            cancelled: true,
            isAfterLockIn,
            strikeIssued,
            newStrikeCount: strikeIssued ? newStrikeCount : undefined,
            restaurantDeactivated,
            message: isAfterLockIn
                ? `Order cancelled. A penalty strike has been issued (${newStrikeCount}/3). Customers may contact support for refunds.`
                : 'Order cancelled successfully.',
        });

    } catch (error: any) {
        console.error('Restaurant cancel order error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
