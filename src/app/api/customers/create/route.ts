import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, email, name, phone } = body;

        if (!userId || !email || !name || !phone) {
            return NextResponse.json({
                error: 'Missing required fields: userId, email, name, phone'
            }, { status: 400 });
        }

        // Use service role to bypass RLS
        const serviceClient = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                cookies: {
                    getAll() { return [] },
                    setAll() { }
                }
            }
        );

        // Check if customer already exists
        const { data: existing } = await serviceClient
            .from('customers')
            .select('id')
            .eq('id', userId)
            .single();

        if (existing) {
            return NextResponse.json({
                message: 'Customer already exists',
                customer: existing
            });
        }

        // Create customer profile
        const { data: customer, error } = await serviceClient
            .from('customers')
            .insert([{
                id: userId,
                email: email,
                name: name,
                phone: phone
            }])
            .select()
            .single();

        if (error) {
            console.error('Customer creation error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log('Customer created:', customer);
        return NextResponse.json({ message: 'Customer created', customer });
    } catch (error: any) {
        console.error('Create customer error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
