import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize Resend for email
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
    try {
        const { items, customerId, customerEmail, customerName } = await request.json();

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: 'No items provided' }, { status: 400 });
        }

        if (!customerId) {
            return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
        }

        const createdOrders = [];
        const platformFee = 5;

        for (const item of items) {
            const { bagId, quantity, restaurantId, price, pickupStart, title, restaurantName } = item;

            // Generate 4-digit OTP
            const pickupOtp = Math.floor(1000 + Math.random() * 9000).toString();

            // Calculate pickup time
            const today = new Date();
            const [hours, minutes] = (pickupStart || '18:00').split(':').map(Number);
            today.setHours(hours, minutes, 0, 0);
            const pickupTime = today.toISOString();

            // Calculate total
            const totalPrice = (price * quantity) + platformFee;

            // Create order
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    customer_id: customerId,
                    rescue_bag_id: bagId,
                    restaurant_id: restaurantId,
                    quantity: quantity,
                    total_price: totalPrice,
                    status: 'pending',
                    payment_method: 'pay_at_pickup',
                    payment_status: 'pending',
                    pickup_time: pickupTime,
                    pickup_otp: pickupOtp,
                })
                .select()
                .single();

            if (orderError) {
                console.error('Order creation error:', orderError);
                return NextResponse.json(
                    { error: 'Failed to create order: ' + orderError.message },
                    { status: 500 }
                );
            }

            // Update bag quantity
            const { data: bag } = await supabase
                .from('rescue_bags')
                .select('quantity_available')
                .eq('id', bagId)
                .single();

            if (bag) {
                await supabase
                    .from('rescue_bags')
                    .update({ quantity_available: Math.max(0, bag.quantity_available - quantity) })
                    .eq('id', bagId);
            }

            createdOrders.push({
                ...order,
                title,
                restaurantName,
                pickupOtp,
            });
        }

        // Send confirmation email
        if (resend && customerEmail) {
            try {
                const orderSummary = createdOrders.map(o =>
                    `• ${o.title || 'Mystery Bag'} from ${o.restaurantName || 'Restaurant'} - ₹${o.total_price}`
                ).join('\n');

                await resend.emails.send({
                    from: 'Latebites <orders@latebites.in>',
                    to: customerEmail,
                    subject: '🍔 Your Latebites Order is Confirmed!',
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                            <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
                                <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Order Confirmed!</h1>
                            </div>
                            <div style="background: #f9fafb; padding: 30px;">
                                <p style="font-size: 18px; color: #111827;">Hey ${customerName || 'there'}! 👋</p>
                                <p style="color: #4b5563;">Your mystery bag order has been placed successfully!</p>
                                
                                <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                                    <h3 style="margin-top: 0; color: #111827;">Order Details</h3>
                                    <pre style="color: #4b5563; white-space: pre-wrap;">${orderSummary}</pre>
                                    
                                    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-top: 15px;">
                                        <p style="margin: 0; font-weight: bold; color: #92400e;">📍 Your Pickup OTP</p>
                                        <p style="font-size: 32px; font-weight: bold; color: #059669; margin: 10px 0; letter-spacing: 4px;">${createdOrders[0]?.pickupOtp || '****'}</p>
                                        <p style="margin: 0; font-size: 12px; color: #78716c;">Show this code at the restaurant to collect your order</p>
                                    </div>
                                </div>
                                
                                <p style="color: #4b5563;">Payment Method: <strong>Pay at Pickup (Cash/UPI)</strong></p>
                                
                                <p style="color: #6b7280; font-size: 14px;">Thanks for helping rescue food! Every bag you save makes a difference. 🌍💚</p>
                            </div>
                            <div style="background: #111827; padding: 20px; text-align: center; border-radius: 0 0 12px 12px;">
                                <p style="color: #9ca3af; margin: 0; font-size: 12px;">© 2026 Latebites - Rescue Delicious Food</p>
                            </div>
                        </div>
                    `,
                });
                console.log('Confirmation email sent to:', customerEmail);
            } catch (emailError) {
                console.error('Email sending failed:', emailError);
                // Don't fail the order if email fails
            }
        }

        return NextResponse.json({
            success: true,
            orders: createdOrders,
            message: `${createdOrders.length} order(s) placed successfully!`,
        });
    } catch (error: any) {
        console.error('Pickup order creation error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
