import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const bagId = searchParams.get('id');
        const adminEmail = searchParams.get('adminEmail');

        if (!bagId) {
            return NextResponse.json(
                { error: 'Bag ID is required' },
                { status: 400 }
            );
        }

        if (!adminEmail) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const adminClient = createAdminClient();

        // Verify caller is an active admin
        const { data: adminData } = await adminClient
            .from('admins')
            .select('role')
            .ilike('email', adminEmail)
            .eq('is_active', true)
            .single();

        if (!adminData) {
            return NextResponse.json(
                { error: 'Admin privileges required' },
                { status: 403 }
            );
        }

        const { error } = await adminClient
            .from('rescue_bags')
            .delete()
            .eq('id', bagId);

        if (error) {
            console.error('Error deleting bag:', error);
            return NextResponse.json(
                { error: 'Failed to delete bag' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Bag deleted successfully'
        });

    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
