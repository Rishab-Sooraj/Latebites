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

        console.log('🔍 Checking if email exists in auth.users:', email);

        // Check if user exists in Supabase auth
        const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

        if (authError) {
            console.error('❌ Error checking auth users:', authError);
            return NextResponse.json({ error: 'Failed to check email' }, { status: 500 });
        }

        // Check if email exists in auth.users
        const userExists = authUsers.users.some(
            user => user.email?.toLowerCase() === email.toLowerCase()
        );

        console.log(`📧 Email ${email} exists in auth: ${userExists}`);

        return NextResponse.json({ exists: userExists });
    } catch (error) {
        console.error('❌ Error in check-email API:', error);
        return NextResponse.json(
            { error: 'Failed to check email' },
            { status: 500 }
        );
    }
}
