import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = await request.json();

        if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Verify Razorpay signature
        const body = razorpayOrderId + '|' + razorpayPaymentId;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpaySignature) {
            return NextResponse.json(
                { error: 'Invalid payment signature' },
                { status: 400 }
            );
        }

        // Fetch order to get bag details
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*, rescue_bags(*)')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        // Update order status
        const { error: updateError } = await supabase
            .from('orders')
            .update({
                status: 'confirmed',
                payment_status: 'paid',
                razorpay_payment_id: razorpayPaymentId,
            })
            .eq('id', orderId);

        if (updateError) {
            console.error('Order update error:', updateError);
            return NextResponse.json(
                { error: 'Failed to update order' },
                { status: 500 }
            );
        }

        // Update bag quantity
        const bag = order.rescue_bags;
        if (bag) {
            const newQuantity = Math.max(0, bag.quantity_available - order.quantity);
            await supabase
                .from('rescue_bags')
                .update({ quantity_available: newQuantity })
                .eq('id', bag.id);
        }

        return NextResponse.json({
            success: true,
            orderId: orderId,
        });
    } catch (error: any) {
        console.error('Payment verification error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
