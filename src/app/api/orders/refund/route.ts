import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Razorpay from 'razorpay';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
    try {
        const { orderId, reason, amount, adminId } = await request.json();

        if (!orderId) {
            return NextResponse.json(
                { error: 'Order ID is required' },
                { status: 400 }
            );
        }

        console.log('🔄 Processing refund for order:', orderId);

        // Fetch order with payment details
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

        // Check if order was paid online
        if (order.payment_method !== 'online' || order.payment_status !== 'paid') {
            return NextResponse.json(
                { error: 'This order was not paid online or payment is not completed' },
                { status: 400 }
            );
        }

        // Check if order already has a full refund
        if (order.refund_status === 'full') {
            return NextResponse.json(
                { error: 'This order has already been fully refunded' },
                { status: 400 }
            );
        }

        // Get the Razorpay payment ID
        const paymentId = order.razorpay_payment_id;
        if (!paymentId) {
            return NextResponse.json(
                { error: 'No Razorpay payment ID found for this order' },
                { status: 400 }
            );
        }

        // Calculate refund amount (in paise)
        const orderTotal = order.total_price * 100; // Convert to paise
        const alreadyRefunded = (order.refund_amount || 0) * 100;
        const maxRefundable = orderTotal - alreadyRefunded;

        // If amount specified, use it; otherwise refund full remaining amount
        let refundAmountPaise: number;
        if (amount && amount > 0) {
            refundAmountPaise = Math.min(amount * 100, maxRefundable);
        } else {
            refundAmountPaise = maxRefundable;
        }

        if (refundAmountPaise <= 0) {
            return NextResponse.json(
                { error: 'No amount available to refund' },
                { status: 400 }
            );
        }

        console.log('💰 Refund amount (paise):', refundAmountPaise);
        console.log('💳 Payment ID:', paymentId);

        // Create refund record in pending state
        const { data: refundRecord, error: refundInsertError } = await supabase
            .from('refunds')
            .insert({
                order_id: orderId,
                razorpay_payment_id: paymentId,
                amount: refundAmountPaise,
                status: 'processing',
                reason: reason || 'Refund requested by admin',
                initiated_by: adminId || null,
            })
            .select()
            .single();

        if (refundInsertError) {
            console.error('Refund record creation error:', refundInsertError);
            return NextResponse.json(
                { error: 'Failed to create refund record' },
                { status: 500 }
            );
        }

        try {
            // Process refund through Razorpay
            const refund = await razorpay.payments.refund(paymentId, {
                amount: refundAmountPaise,
                speed: 'normal', // 'normal' for 5-7 days, 'optimum' for instant if eligible
                notes: {
                    orderId: orderId,
                    reason: reason || 'Refund requested by admin',
                    refundRecordId: refundRecord.id,
                },
            });

            console.log('✅ Razorpay refund created:', refund.id);

            // Update refund record with Razorpay refund ID
            await supabase
                .from('refunds')
                .update({
                    razorpay_refund_id: refund.id,
                    status: 'processed',
                    processed_at: new Date().toISOString(),
                })
                .eq('id', refundRecord.id);

            // Calculate new refund total
            const newRefundAmount = (order.refund_amount || 0) + (refundAmountPaise / 100);
            const isFullRefund = newRefundAmount >= order.total_price;

            // Update order with refund status
            await supabase
                .from('orders')
                .update({
                    refund_status: isFullRefund ? 'full' : 'partial',
                    refund_amount: newRefundAmount,
                    refunded_at: new Date().toISOString(),
                    status: isFullRefund ? 'refunded' : order.status,
                })
                .eq('id', orderId);

            // If full refund, restore bag quantity
            if (isFullRefund && order.rescue_bag_id) {
                const bag = order.rescue_bags;
                if (bag) {
                    await supabase
                        .from('rescue_bags')
                        .update({
                            quantity_available: bag.quantity_available + order.quantity,
                        })
                        .eq('id', order.rescue_bag_id);
                }
            }

            return NextResponse.json({
                success: true,
                refund: {
                    id: refund.id,
                    amount: refundAmountPaise / 100, // Return in rupees
                    status: refund.status,
                    speed: refund.speed_processed || 'normal',
                },
                message: `Refund of ₹${(refundAmountPaise / 100).toFixed(2)} has been initiated. It will be credited to the customer's bank account within 5-7 business days.`,
            });

        } catch (razorpayError: any) {
            console.error('❌ Razorpay refund error:', razorpayError);

            // Update refund record with failure
            await supabase
                .from('refunds')
                .update({
                    status: 'failed',
                    failure_reason: razorpayError.error?.description || razorpayError.message || 'Unknown error',
                })
                .eq('id', refundRecord.id);

            // Update order refund status
            await supabase
                .from('orders')
                .update({
                    refund_status: 'failed',
                })
                .eq('id', orderId);

            return NextResponse.json(
                {
                    error: razorpayError.error?.description || razorpayError.message || 'Razorpay refund failed',
                    details: razorpayError.error || razorpayError,
                },
                { status: 500 }
            );
        }

    } catch (error: any) {
        console.error('❌ Refund API error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET endpoint to check refund status
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('orderId');
        const refundId = searchParams.get('refundId');

        if (refundId) {
            // Get specific refund status from Razorpay
            try {
                const refund = await razorpay.refunds.fetch(refundId);
                return NextResponse.json({ refund });
            } catch (error: any) {
                return NextResponse.json(
                    { error: 'Refund not found' },
                    { status: 404 }
                );
            }
        }

        if (orderId) {
            // Get all refunds for an order
            const { data: refunds, error } = await supabase
                .from('refunds')
                .select('*')
                .eq('order_id', orderId)
                .order('created_at', { ascending: false });

            if (error) {
                return NextResponse.json(
                    { error: 'Failed to fetch refunds' },
                    { status: 500 }
                );
            }

            return NextResponse.json({ refunds: refunds || [] });
        }

        return NextResponse.json(
            { error: 'Order ID or Refund ID is required' },
            { status: 400 }
        );

    } catch (error: any) {
        console.error('Refund status check error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
