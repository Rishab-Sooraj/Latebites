import { NextResponse } from 'next/server';
import { getAuthenticatedUser, isSuperAdmin, supabaseAdmin } from '@/lib/auth-helpers';

export async function POST(request: Request) {
    try {
        const { adminId, freeze } = await request.json();

        if (!adminId) {
            return NextResponse.json({ error: 'Admin ID is required' }, { status: 400 });
        }

        // Check authentication
        const user = await getAuthenticatedUser(request);

        if (!user || !user.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is super admin
        const isSuper = await isSuperAdmin(user.email);

        if (!isSuper) {
            return NextResponse.json(
                { error: 'Only super admins can freeze/unfreeze admins' },
                { status: 403 }
            );
        }

        // Get current admin to get their user_id
        const { data: currentAdmin } = await supabaseAdmin
            .from('admins')
            .select('id')
            .ilike('email', user.email)
            .single();

        // Update freeze status
        const { error: updateError } = await supabaseAdmin
            .from('admins')
            .update({
                frozen_at: freeze ? new Date().toISOString() : null,
                frozen_by: freeze ? currentAdmin?.id : null,
            })
            .eq('id', adminId);

        if (updateError) {
            console.error('Freeze admin error:', updateError);
            return NextResponse.json(
                { error: updateError.message || 'Failed to update admin status' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: freeze ? 'Admin frozen successfully' : 'Admin unfrozen successfully',
        });

    } catch (error: any) {
        console.error('Freeze admin error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update admin status' },
            { status: 500 }
        );
    }
}
