import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Explicitly define runtime as nodejs to ensure compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        console.log('🔍 Checking if email exists:', email);

        // Initialize admin client inside handler
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceRoleKey) {
            console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        // Check customers table first (faster, indexed)
        const { data: customerData, error: customerError } = await supabaseAdmin
            .from('customers')
            .select('id')
            .eq('email', email)
            .single();

        if (customerData) {
            console.log(`✅ Email ${email} exists in customers table`);
            return NextResponse.json({ exists: true });
        }

        // Note: We primarily check the 'customers' table for performance and scalability.
        // Direct checks against auth.users via listUsers() are slow and rate-limited.
        // If a user exists in Auth but not in Customers (e.g. partial cleanup),
        // the check-email will return false (allowing signup flow).
        // However, the actual signup attempt will fail with "User already registered" or "Database error".
        // The frontend (AuthModal) is configured to catch these errors and redirect to Login.

        console.log(`❌ Email ${email} not found in customers table`);
        return NextResponse.json({ exists: false });

    } catch (error) {
        console.error('❌ Error in check-email API:', error);
        return NextResponse.json(
            { error: 'Failed to check email' },
            { status: 500 }
        );
    }
}
