import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role to bypass RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const adminId = searchParams.get('id');

        if (!adminId) {
            return NextResponse.json({ error: 'Admin ID is required' }, { status: 400 });
        }

        console.log('🔍 Looking up admin info for:', adminId);

        // First try auth.users to get the real name from user_metadata
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(adminId);

        if (!userError && userData?.user) {
            const user = userData.user;
            // Check multiple name fields - prioritize user_metadata
            const name = user.user_metadata?.name ||
                user.user_metadata?.full_name ||
                user.user_metadata?.display_name ||
                null;

            // Only use if it's a real name (not "admin")
            if (name && name.toLowerCase() !== 'admin') {
                const admin = {
                    id: user.id,
                    name: name,
                    email: user.email || '',
                };
                console.log('✅ Found admin name in auth.users:', admin.name);
                return NextResponse.json({ admin });
            }
        }

        // If auth.users doesn't have a good name, try the admins table
        const { data: adminData, error: adminError } = await supabaseAdmin
            .from('admins')
            .select('id, name, email')
            .eq('id', adminId)
            .single();

        if (!adminError && adminData && adminData.name && adminData.name.toLowerCase() !== 'admin') {
            console.log('✅ Found admin in admins table:', adminData.name);
            return NextResponse.json({ admin: adminData });
        }

        // If we have userData but no good name, use formatted email prefix
        if (!userError && userData?.user?.email) {
            const emailName = userData.user.email.split('@')[0];
            // Capitalize first letter and format
            const formattedName = emailName
                .replace(/[._]/g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            const admin = {
                id: userData.user.id,
                name: formattedName,
                email: userData.user.email,
            };
            console.log('✅ Using formatted email as name:', admin.name);
            return NextResponse.json({ admin });
        }

        // Fallback
        console.log('⚠️ Admin not found, returning default');
        return NextResponse.json({
            admin: {
                id: adminId,
                name: 'Support Agent',
                email: '',
            }
        });

    } catch (error) {
        console.error('❌ Error getting admin info:', error);
        return NextResponse.json(
            { error: 'Failed to get admin info' },
            { status: 500 }
        );
    }
}
