import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { currentPassword, newPassword, email } = body;

        if (!currentPassword || !newPassword || !email) {
            return NextResponse.json(
                { error: 'Email, current password, and new password are required' },
                { status: 400 }
            );
        }

        if (newPassword.length < 8) {
            return NextResponse.json(
                { error: 'New password must be at least 8 characters' },
                { status: 400 }
            );
        }

        // Verify the current password by attempting a sign-in with a fresh client
        const verifyClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        const { data: signInData, error: signInError } = await verifyClient.auth.signInWithPassword({
            email,
            password: currentPassword,
        });

        if (signInError || !signInData.user) {
            return NextResponse.json(
                { error: 'Current password is incorrect' },
                { status: 400 }
            );
        }

        // Verify admin exists in admins table
        const { data: adminData } = await supabaseAdmin
            .from('admins')
            .select('id, email')
            .ilike('email', email)
            .eq('is_active', true)
            .single();

        if (!adminData) {
            return NextResponse.json(
                { error: 'Admin not found' },
                { status: 404 }
            );
        }

        // Update the password using admin client
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            signInData.user.id,
            { password: newPassword }
        );

        if (updateError) {
            console.error('Password update error:', updateError);
            return NextResponse.json(
                { error: 'Failed to update password' },
                { status: 500 }
            );
        }

        // Update must_change_password flag
        const { error: dbError } = await supabaseAdmin
            .from('admins')
            .update({
                must_change_password: false,
                updated_at: new Date().toISOString()
            })
            .ilike('email', email);

        if (dbError) {
            console.error('DB update error:', dbError);
        } else {
            console.log('Successfully updated must_change_password flag to false for:', email);
        }

        return NextResponse.json({
            success: true,
            message: 'Password changed successfully. Please log in again.',
            requiresLogin: true,
        });

    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
