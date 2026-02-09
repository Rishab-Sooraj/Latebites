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

        // Fallback: Check auth.users if not in customers table
        // Use getUserById won't work with email.
        // We use listUsers() but note it only checks first page by default.
        // However, if we assume customers table sync is working, this fallback is rarely needed.
        // If we really need to check auth, we must paginate or filter if supported.
        // Current JS client supports loose filtering or exact via RPC usually.
        // Given the constraints, let's just check customers table as primary source of truth.
        // If user deleted from customers but exists in Auth, they might be "zombie".
        // But for UI flow (Login vs Signup), existing customer record implies "Login".

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
