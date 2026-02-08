import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Razorpay from 'razorpay';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Lazy-load Razorpay to avoid build-time initialization
const getRazorpay = () => {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        return null;
    }
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
};

export async function POST(request: NextRequest) {
    try {
        const { orderId, reason } = await request.json();

        if (!orderId) {
            return NextResponse.json(
                { error: 'Order ID is required' },
                { status: 400 }
            );
        }

        console.log('🔄 Processing cancellation for order:', orderId);

        // Fetch order with rescue bag details
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*, rescue_bags(*)')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            console.error('Order fetch error:', orderError);
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        // Check if order can be cancelled
        if (['cancelled', 'completed'].includes(order.status)) {
            return NextResponse.json(
                { error: 'This order cannot be cancelled' },
                { status: 400 }
            );
        }

        // Check if already refunded
        if (order.refund_status === 'full') {
            return NextResponse.json(
                { error: 'This order has already been refunded' },
                { status: 400 }
            );
        }

        // Calculate if we're before lock-in time (45 mins before pickup)
        const rescueBag = order.rescue_bags;
        let isBeforeLockIn = true;

        if (rescueBag?.pickup_start_time) {
            const now = new Date();
            const [hours, minutes, seconds] = rescueBag.pickup_start_time.split(':').map(Number);
            const pickupStart = new Date();
            pickupStart.setHours(hours, minutes, seconds || 0, 0);

            // If pickup time is in the past today, it's for tomorrow
            if (pickupStart.getTime() < now.getTime()) {
                pickupStart.setDate(pickupStart.getDate() + 1);
            }

            // Lock-in is 45 minutes before pickup
            const lockInTime = new Date(pickupStart.getTime() - 45 * 60 * 1000);
            isBeforeLockIn = now.getTime() < lockInTime.getTime();
        }

        console.log('🔒 Is before lock-in:', isBeforeLockIn);

        // Process refund if paid online and before lock-in
        let refundResult = null;
        const isPaidOnline = order.payment_method === 'online' && order.payment_status === 'paid';

        if (isPaidOnline && isBeforeLockIn) {
            // Get payment ID
            let paymentId = order.razorpay_payment_id;

            // Try to fetch from Razorpay if not in DB
            if (!paymentId && order.razorpay_order_id && getRazorpay()) {
                try {
                    const payments = await getRazorpay()!.orders.fetchPayments(order.razorpay_order_id);
                    if (payments.items && payments.items.length > 0) {
                        const successfulPayment = payments.items.find((p: any) => p.status === 'captured');
                        if (successfulPayment) {
                            paymentId = successfulPayment.id;
                            // Save for future
                            await supabase
                                .from('orders')
                                .update({ razorpay_payment_id: paymentId })
                                .eq('id', orderId);
                        }
                    }
                } catch (e) {
                    console.error('Failed to fetch payment from Razorpay:', e);
                }
            }

            if (paymentId && getRazorpay()) {
                try {
                    const refundAmountPaise = Math.round(order.total_price * 100);

                    // Create refund record
                    const { data: refundRecord } = await supabase
                        .from('refunds')
                        .insert({
                            order_id: orderId,
                            razorpay_payment_id: paymentId,
                            amount: refundAmountPaise,
                            status: 'processing',
                            reason: reason || 'Customer cancelled before lock-in',
                            initiated_by: null, // Customer initiated
                        })
                        .select()
                        .single();

                    // Process refund via Razorpay
                    const refund = await getRazorpay()!.payments.refund(paymentId, {
                        amount: refundAmountPaise,
                        speed: 'normal',
                        notes: {
                            orderId: orderId,
                            reason: reason || 'Customer cancelled before lock-in',
                        },
                    });

                    console.log('✅ Refund processed:', refund.id);

                    // Update refund record
                    if (refundRecord) {
                        await supabase
                            .from('refunds')
                            .update({
                                razorpay_refund_id: refund.id,
                                status: 'processed',
                                processed_at: new Date().toISOString(),
                            })
                            .eq('id', refundRecord.id);
                    }

                    refundResult = {
                        id: refund.id,
                        amount: refundAmountPaise / 100,
                        status: 'processed',
                    };

                    // Update order with refund info
                    await supabase
                        .from('orders')
                        .update({
                            status: 'cancelled',
                            refund_status: 'full',
                            refund_amount: order.total_price,
                            refunded_at: new Date().toISOString(),
                            cancellation_reason: reason || 'Customer cancelled before lock-in',
                        })
                        .eq('id', orderId);

                    // Restore bag quantity
                    if (order.rescue_bag_id && rescueBag) {
                        await supabase
                            .from('rescue_bags')
                            .update({
                                quantity_available: rescueBag.quantity_available + order.quantity,
                            })
                            .eq('id', order.rescue_bag_id);
                    }

                } catch (refundError: any) {
                    console.error('❌ Refund failed:', refundError);
                    // Still cancel the order but mark refund as failed
                    await supabase
                        .from('orders')
                        .update({
                            status: 'cancelled',
                            refund_status: 'failed',
                            cancellation_reason: reason || 'Customer cancelled - refund failed',
                        })
                        .eq('id', orderId);

                    return NextResponse.json({
                        success: true,
                        cancelled: true,
                        refunded: false,
                        message: 'Order cancelled but refund failed. Please contact support.',
                        error: refundError.error?.description || refundError.message,
                    });
                }
            } else {
                // No payment ID found or no Razorpay, just cancel
                await supabase
                    .from('orders')
                    .update({
                        status: 'cancelled',
                        cancellation_reason: reason || 'Customer cancelled',
                    })
                    .eq('id', orderId);

                // Restore bag quantity
                if (order.rescue_bag_id && rescueBag) {
                    await supabase
                        .from('rescue_bags')
                        .update({
                            quantity_available: rescueBag.quantity_available + order.quantity,
                        })
                        .eq('id', order.rescue_bag_id);
                }
            }
        } else if (isPaidOnline && !isBeforeLockIn) {
            // After lock-in - don't process refund, just return info
            return NextResponse.json({
                success: false,
                cancelled: false,
                refunded: false,
                isAfterLockIn: true,
                message: 'The lock-in period has passed. Please contact customer support for cancellation and refund requests.',
                supportEmail: 'support@latebites.in',
            });
        } else {
            // Not paid online or pay at pickup - just cancel
            await supabase
                .from('orders')
                .update({
                    status: 'cancelled',
                    cancellation_reason: reason || 'Customer cancelled',
                })
                .eq('id', orderId);

            // Restore bag quantity
            if (order.rescue_bag_id && rescueBag) {
                await supabase
                    .from('rescue_bags')
                    .update({
                        quantity_available: rescueBag.quantity_available + order.quantity,
                    })
                    .eq('id', order.rescue_bag_id);
            }
        }

        return NextResponse.json({
            success: true,
            cancelled: true,
            refunded: refundResult !== null,
            refund: refundResult,
            message: refundResult
                ? `Order cancelled and ₹${refundResult.amount} will be refunded within 5-7 business days.`
                : 'Order cancelled successfully.',
        });

    } catch (error: any) {
        console.error('❌ Cancel order API error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
