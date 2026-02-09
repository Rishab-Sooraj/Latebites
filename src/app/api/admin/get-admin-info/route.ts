import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
    try {
        // 1. Authenticate the requester
        // Ensure only logged-in users can query this endpoint
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const adminId = searchParams.get('id');

        if (!adminId) {
            return NextResponse.json({ error: 'Admin ID is required' }, { status: 400 });
        }

        // Initialize admin client inside the handler to avoid build-time env var issues
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceRoleKey) {
            console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey
        );

        console.log('🔍 Looking up admin info for:', adminId);

        // 2. Authorization Check: Verify the target ID belongs to an admin
        // We check the 'admins' table first. This is the source of truth for who is an admin.
        // This prevents users from querying arbitrary user IDs from auth.users.
        const { data: adminData, error: adminError } = await supabaseAdmin
            .from('admins')
            .select('id, name, email')
            .eq('id', adminId)
            .single();

        // If not in admins table, we treat them as a generic support agent (or not an admin)
        // We deliberately do NOT fall back to checking auth.users for any ID to prevent IDOR/Enumeration.
        if (adminError || !adminData) {
            console.log('⚠️ ID not found in admins table, returning default agent info.');
            return NextResponse.json({
                admin: {
                    id: adminId,
                    name: 'Support Agent',
                    email: '', // Do not expose email for unverified admins
                }
            });
        }

        // 3. If verified admin, we can try to get fresher data from auth.users if needed
        // (Optional, but preserves original behavior of preferring auth.users name)
        let finalName = adminData.name;
        let finalEmail = adminData.email;

        // It is safe to query auth.users now because we have verified adminId belongs to an admin
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(adminId);

        if (!userError && userData?.user) {
             const user = userData.user;
             const name = user.user_metadata?.name ||
                user.user_metadata?.full_name ||
                user.user_metadata?.display_name;

             // Only use if it's a real name (not "admin")
             if (name && name.toLowerCase() !== 'admin') {
                 finalName = name;
             }
             if (user.email) {
                 finalEmail = user.email;
             }

             // Also handle the formatted email fallback case from original code
             if (!finalName && user.email) {
                const emailName = user.email.split('@')[0];
                finalName = emailName
                    .replace(/[._]/g, ' ')
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
             }
        }

        console.log('✅ Found verified admin:', finalName);
        return NextResponse.json({
            admin: {
                id: adminData.id,
                name: finalName,
                email: finalEmail
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
