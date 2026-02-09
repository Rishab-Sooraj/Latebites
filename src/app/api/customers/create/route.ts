import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

// Explicitly define runtime as nodejs to match other API routes (onboard/verify)
// This ensures compatibility with the build process and environment variable access
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, email, name, phone } = body;

        // 1. Authenticate user
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Validate input matches authenticated user
        if (userId !== user.id) {
            return NextResponse.json({ error: 'Unauthorized: User ID mismatch' }, { status: 403 });
        }

        if (!email || !name || !phone) {
            return NextResponse.json({
                error: 'Missing required fields: email, name, phone'
            }, { status: 400 });
        }

        // 3. Initialize admin client inside handler
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

        // Check if customer already exists
        const { data: existing } = await supabaseAdmin
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
        const { data: customer, error } = await supabaseAdmin
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
