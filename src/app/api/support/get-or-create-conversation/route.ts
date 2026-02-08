import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role to bypass RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const { customerId, orderId, issueType, customerName } = await request.json();

        if (!customerId || !issueType) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        console.log('🎫 Getting/Creating support conversation:', { customerId, orderId, issueType });

        // First, check if conversation already exists
        let query = supabaseAdmin
            .from('support_conversations')
            .select('*')
            .eq('customer_id', customerId)
            .eq('issue_type', issueType);

        if (orderId) {
            query = query.eq('order_id', orderId);
        } else {
            query = query.is('order_id', null);
        }

        // Also exclude resolved conversations - we want to find active ones
        query = query.neq('status', 'resolved');

        const { data: existingConv, error: findError } = await query.maybeSingle();

        if (findError && findError.code !== 'PGRST116') {
            console.error('❌ Error finding conversation:', findError);
            return NextResponse.json({ error: findError.message }, { status: 500 });
        }

        // If conversation exists, return it
        if (existingConv) {
            console.log('✅ Found existing conversation:', existingConv.id);
            return NextResponse.json({
                conversation: existingConv,
                isNew: false
            });
        }

        // Create new conversation
        console.log('📝 Creating new conversation...');
        const { data: newConv, error: createError } = await supabaseAdmin
            .from('support_conversations')
            .insert({
                customer_id: customerId,
                order_id: orderId || null,
                issue_type: issueType,
                status: 'open',
            })
            .select()
            .single();

        if (createError) {
            // If duplicate key error, try to fetch the existing one
            if (createError.code === '23505') {
                console.log('⚠️ Duplicate detected, fetching existing...');
                const { data: retryConv } = await query.maybeSingle();
                if (retryConv) {
                    return NextResponse.json({
                        conversation: retryConv,
                        isNew: false
                    });
                }
            }
            console.error('❌ Error creating conversation:', createError);
            return NextResponse.json({ error: createError.message }, { status: 500 });
        }

        console.log('✅ Created new conversation:', newConv.id);

        // Fetch order info for welcome message
        let restaurantName = 'the restaurant';
        if (orderId) {
            const { data: orderData } = await supabaseAdmin
                .from('orders')
                .select('restaurants(name)')
                .eq('id', orderId)
                .single();

            if (orderData?.restaurants) {
                restaurantName = (orderData.restaurants as any).name || 'the restaurant';
            }
        }

        // Create welcome message
        const firstName = customerName?.split(' ')[0] || 'there';
        const welcomeMessage = orderId
            ? `Hi ${firstName}! 👋 Thanks for reaching out. I can see you had an issue with your order from ${restaurantName}. Our support team will be with you shortly!`
            : `Hi ${firstName}! 👋 Thanks for reaching out to Latebites support. How can we help you today? Our team will respond shortly!`;

        await supabaseAdmin.from('support_messages').insert({
            conversation_id: newConv.id,
            sender_type: 'admin',
            sender_id: '00000000-0000-0000-0000-000000000000',
            message: welcomeMessage,
            read_by_recipient: false,
        });

        return NextResponse.json({
            conversation: newConv,
            isNew: true
        });

    } catch (error) {
        console.error('❌ Error in support conversation API:', error);
        return NextResponse.json(
            { error: 'Failed to get/create conversation' },
            { status: 500 }
        );
    }
}
