import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role to bypass RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        console.log('🔍 Checking if email exists in customers table:', email);

        // Check customers table instead of auth.users (no 50 user limit)
        const { data: customer, error: customerError } = await supabaseAdmin
            .from('customers')
            .select('id')
            .eq('email', email.toLowerCase())
            .maybeSingle();

        if (customerError) {
            console.error('❌ Error checking customers:', customerError);
            return NextResponse.json({ error: 'Failed to check email' }, { status: 500 });
        }

        const userExists = !!customer;
        console.log(`📧 Email ${email} exists in customers: ${userExists}`);

        return NextResponse.json({ exists: userExists });
    } catch (error) {
        console.error('❌ Error in check-email API:', error);
        return NextResponse.json(
            { error: 'Failed to check email' },
            { status: 500 }
        );
    }
}
