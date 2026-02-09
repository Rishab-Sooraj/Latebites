import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import Razorpay from 'razorpay';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

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

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
        });

        // Handle both single bag format and cart items format
        let bagId: string;
        let quantity: number;
        // customerId is inferred from session, but body might contain it. We should use session ID.

        // Validate request body structure
        if (body.items && Array.isArray(body.items)) {
            // Cart format: { items: [...], customerId, totalAmount }
            if (body.items.length === 0) {
                return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
            }
            // Use first item (for now, only support single item checkout)
            bagId = body.items[0].bagId;
            quantity = body.items[0].quantity;
        } else {
            // Direct format: { bagId, quantity, customerId }
            bagId = body.bagId;
            quantity = body.quantity;
        }

        // Validate basic fields
        if (!bagId || quantity === undefined) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate quantity (positive integer)
        if (!Number.isInteger(quantity) || quantity <= 0) {
            return NextResponse.json(
                { error: 'Invalid quantity' },
                { status: 400 }
            );
        }

        const customerId = user.id; // Use authenticated user ID, ignore body.customerId

        // Fetch bag details
        const { data: bag, error: bagError } = await supabaseAdmin
            .from('rescue_bags')
            .select('*')
            .eq('id', bagId)
            .single();

        if (bagError || !bag) {
            return NextResponse.json(
                { error: 'Bag not found' },
                { status: 404 }
            );
        }

        // Check availability
        if (bag.quantity_available < quantity) {
            return NextResponse.json(
                { error: 'Not enough bags available' },
                { status: 400 }
            );
        }

        // Check lock-in time (45 minutes before pickup start)
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const pickupStart = new Date(`${today}T${bag.pickup_start_time}`);
        const lockInTime = new Date(pickupStart.getTime() - 45 * 60 * 1000);

        if (now > lockInTime) {
            return NextResponse.json(
                { error: "This bag's lock-in time has passed. You cannot order it anymore." },
                { status: 400 }
            );
        }

        // Calculate amounts
        const platformFee = 5;
        const totalAmount = (bag.discounted_price * quantity) + platformFee;
        const amountInPaise = totalAmount * 100; // Razorpay uses paise

        // Generate 4-digit OTP for pickup verification
        const pickupOtp = Math.floor(1000 + Math.random() * 9000).toString();

        // Create order in database with pending status
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                customer_id: customerId,
                rescue_bag_id: bagId,
                restaurant_id: bag.restaurant_id,
                quantity: quantity,
                total_price: totalAmount,
                status: 'pending',
                payment_method: 'online',
                payment_status: 'pending',
                pickup_otp: pickupOtp,
                pickup_time: pickupStart.toISOString(),
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

        // Create Razorpay order
        const razorpayOrder = await razorpay.orders.create({
            amount: amountInPaise,
            currency: 'INR',
            receipt: order.id,
            notes: {
                orderId: order.id,
                bagId: bagId,
                customerId: customerId,
            },
        });

        // Update order with Razorpay order ID
        await supabaseAdmin
            .from('orders')
            .update({ razorpay_order_id: razorpayOrder.id })
            .eq('id', order.id);

        return NextResponse.json({
            orderId: order.id,
            razorpayOrder: {
                id: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
            },
        });
    } catch (error: any) {
        console.error('Order creation error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
