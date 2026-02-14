import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { sendEmail } from '@/lib/zeptomail';
import { generateOrderConfirmationEmail } from '@/lib/email-template';

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

        // Send order confirmation email
        try {
            // Fetch customer and restaurant details
            const { data: customer } = await supabase
                .from('customers')
                .select('name, email')
                .eq('id', order.customer_id)
                .single();

            const { data: restaurant } = await supabase
                .from('restaurants')
                .select('name, address_line1, city, state, pincode')
                .eq('id', order.restaurant_id)
                .single();

            if (customer && restaurant && bag) {
                const pickupTime = new Date(order.pickup_time).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                });

                const pickupAddress = `${restaurant.address_line1}, ${restaurant.city}, ${restaurant.state} ${restaurant.pincode}`;

                const emailHtml = generateOrderConfirmationEmail(
                    customer.name,
                    order.id.substring(0, 8),
                    restaurant.name,
                    [{
                        title: bag.title,
                        quantity: order.quantity,
                        price: bag.discounted_price
                    }],
                    order.total_price,
                    pickupTime,
                    pickupAddress,
                    order.pickup_otp || ''
                );

                await sendEmail({
                    to: customer.email,
                    subject: `Order Confirmed - ${restaurant.name} | Latebites`,
                    html: emailHtml
                });

                console.log('✅ Order confirmation email sent to:', customer.email);
            }
        } catch (emailError) {
            console.error('❌ Failed to send confirmation email:', emailError);
            // Don't fail the request if email fails
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
