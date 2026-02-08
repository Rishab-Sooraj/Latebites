import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role to bypass RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const { adminId, name } = await request.json();

        if (!adminId || !name) {
            return NextResponse.json({ error: 'Admin ID and name are required' }, { status: 400 });
        }

        console.log('📝 Updating admin metadata:', { adminId, name });

        // Update the user's metadata
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(adminId, {
            user_metadata: {
                name: name,
                full_name: name,
            }
        });

        if (error) {
            console.error('❌ Error updating admin metadata:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log('✅ Admin metadata updated successfully');
        return NextResponse.json({
            success: true,
            user: data.user
        });

    } catch (error: any) {
        console.error('❌ Error in update-admin-name API:', error);
        return NextResponse.json(
            { error: 'Failed to update admin name' },
            { status: 500 }
        );
    }
}
