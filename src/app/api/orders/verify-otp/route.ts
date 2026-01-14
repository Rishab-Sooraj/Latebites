import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

interface VerifyOTPRequest {
    order_id: string;
    otp: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: VerifyOTPRequest = await request.json();
        const { order_id, otp } = body;

        // Validate required fields
        if (!order_id || !otp) {
            return NextResponse.json(
                { error: 'Order ID and OTP are required' },
                { status: 400 }
            );
        }

        // Validate OTP format (4 digits)
        if (!/^\d{4}$/.test(otp)) {
            return NextResponse.json(
                { error: 'OTP must be a 4-digit number' },
                { status: 400 }
            );
        }

        // Create Supabase client
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        try {
                            cookieStore.set({ name, value, ...options });
                        } catch {
                            // Ignore - this happens in read-only contexts
                        }
                    },
                    remove(name: string, options: CookieOptions) {
                        try {
                            cookieStore.set({ name, value: '', ...options });
                        } catch {
                            // Ignore - this happens in read-only contexts
                        }
                    },
                },
            }
        );

        // Get the current user (restaurant)
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized. Please log in.' },
                { status: 401 }
            );
        }

        // Fetch the order with restaurant verification
        const { data: order, error: fetchError } = await supabase
            .from('orders')
            .select('*, restaurants!inner(*)')
            .eq('id', order_id)
            .single();

        if (fetchError || !order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        // Verify the OTP
        if (order.pickup_otp !== otp) {
            return NextResponse.json(
                { error: 'Invalid OTP. Please check and try again.' },
                { status: 400 }
            );
        }

        // Check if order is in a valid state to be completed
        if (order.status === 'completed') {
            return NextResponse.json(
                { error: 'Order is already completed' },
                { status: 400 }
            );
        }

        if (order.status === 'cancelled') {
            return NextResponse.json(
                { error: 'Cannot complete a cancelled order' },
                { status: 400 }
            );
        }

        // Update order status to completed
        const { data: updatedOrder, error: updateError } = await supabase
            .from('orders')
            .update({
                status: 'completed',
                payment_status: 'paid',
                updated_at: new Date().toISOString()
            })
            .eq('id', order_id)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating order:', updateError);
            return NextResponse.json(
                { error: 'Failed to complete order' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Order completed successfully!',
            order: updatedOrder
        });

    } catch (error) {
        console.error('Unexpected error in verify-otp API:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
