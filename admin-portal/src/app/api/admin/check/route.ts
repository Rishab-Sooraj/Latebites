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

        console.log('🔍 Checking admin status for:', email);

        // Uses service role - bypasses RLS completely
        const { data: adminData, error: adminError } = await supabaseAdmin
            .from('admins')
            .select('*')
            .ilike('email', email)
            .eq('is_active', true)
            .single();

        if (adminError) {
            console.error('❌ Admin check error:', adminError);
            return NextResponse.json({ exists: false, admin: null });
        }

        console.log('✅ Admin found:', adminData?.email, 'Role:', adminData?.role);

        return NextResponse.json({
            exists: !!adminData,
            admin: adminData ? {
                id: adminData.id,
                name: adminData.name,
                email: adminData.email,
                role: adminData.role,
                must_change_password: adminData.must_change_password,
                frozen_at: adminData.frozen_at,
                revoked_at: adminData.revoked_at,
            } : null
        });
    } catch (error) {
        console.error('❌ Admin check-email error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
