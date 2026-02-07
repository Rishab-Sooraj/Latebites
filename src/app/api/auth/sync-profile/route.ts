import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

// Service role client for bypassing RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        // Get the current user from cookies
        const supabase = await createServerClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Use service role to check if customer profile exists (bypasses RLS)
        const { data: existingCustomer, error: checkError } = await supabaseAdmin
            .from('customers')
            .select('*')
            .eq('id', user.id)
            .single();

        if (existingCustomer) {
            console.log("✅ Sync-profile: Customer found:", existingCustomer.name);
            return NextResponse.json({ message: 'Profile exists', customer: existingCustomer });
        }

        // Create customer profile using service role
        const profileData = {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'Customer',
            phone: user.user_metadata?.phone || null,
        };

        console.log("📝 Sync-profile: Creating new customer:", profileData.email);

        const { data: newCustomer, error: insertError } = await supabaseAdmin
            .from('customers')
            .insert([profileData])
            .select()
            .single();

        if (insertError) {
            // If duplicate key error, try to fetch the existing one
            if (insertError.code === '23505') {
                const { data: retryCustomer } = await supabaseAdmin
                    .from('customers')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                if (retryCustomer) {
                    return NextResponse.json({ message: 'Profile exists', customer: retryCustomer });
                }
            }
            console.error('Profile creation error:', insertError);
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        console.log("✅ Sync-profile: Customer created:", newCustomer.name);
        return NextResponse.json({ message: 'Profile created', customer: newCustomer });
    } catch (error: any) {
        console.error('Sync profile error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
