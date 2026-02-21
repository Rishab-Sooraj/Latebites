import { NextResponse } from 'next/server';
import { getAuthenticatedUser, isSuperAdmin, supabaseAdmin } from '@/lib/auth-helpers';

export async function POST(request: Request) {
    try {
        const { adminId } = await request.json();

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
                { error: 'Only super admins can delete admins' },
                { status: 403 }
            );
        }

        // Get the admin to delete
        const { data: adminToDelete } = await supabaseAdmin
            .from('admins')
            .select('user_id, role')
            .eq('id', adminId)
            .single();

        if (!adminToDelete) {
            return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
        }

        // Prevent deleting super admins
        if (adminToDelete.role === 'super_admin') {
            return NextResponse.json(
                { error: 'Cannot delete super admin accounts' },
                { status: 403 }
            );
        }

        // Delete from admins table
        const { error: deleteError } = await supabaseAdmin
            .from('admins')
            .delete()
            .eq('id', adminId);

        if (deleteError) {
            console.error('Delete admin error:', deleteError);
            return NextResponse.json(
                { error: deleteError.message || 'Failed to delete admin' },
                { status: 500 }
            );
        }

        // Delete auth user
        if (adminToDelete.user_id) {
            await supabaseAdmin.auth.admin.deleteUser(adminToDelete.user_id);
        }

        return NextResponse.json({ success: true, message: 'Admin deleted successfully' });

    } catch (error: any) {
        console.error('Delete admin error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete admin' },
            { status: 500 }
        );
    }
}
