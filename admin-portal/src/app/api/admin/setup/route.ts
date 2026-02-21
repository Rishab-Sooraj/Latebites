import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service role client - bypasses everything
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const { email, password, name } = await request.json();

        const adminEmail = email || 'admin@latebites.in';
        const adminPassword = password || 'Admin@123';
        const adminName = name || 'Super Admin';

        console.log('🔧 Setting up super admin:', adminEmail);

        // Step 1: Check if auth user already exists
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(
            (u) => u.email?.toLowerCase() === adminEmail.toLowerCase()
        );

        let userId: string;

        if (existingUser) {
            console.log('✅ Auth user already exists, updating password...');
            // Update the password
            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                existingUser.id,
                { password: adminPassword, email_confirm: true }
            );
            if (updateError) {
                console.error('❌ Failed to update user:', updateError);
                return NextResponse.json({ error: updateError.message }, { status: 500 });
            }
            userId = existingUser.id;
        } else {
            console.log('📝 Creating new auth user...');
            // Create the auth user
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: adminEmail,
                password: adminPassword,
                email_confirm: true,
                user_metadata: { role: 'admin', name: adminName },
            });
            if (createError) {
                console.error('❌ Failed to create user:', createError);
                return NextResponse.json({ error: createError.message }, { status: 500 });
            }
            userId = newUser.user.id;
        }

        // Step 2: Upsert admin record
        console.log('📝 Upserting admin record for user_id:', userId);
        const { data: adminData, error: adminError } = await supabaseAdmin
            .from('admins')
            .upsert(
                {
                    user_id: userId,
                    name: adminName,
                    email: adminEmail,
                    role: 'super_admin',
                    is_active: true,
                    must_change_password: false,
                    frozen_at: null,
                    revoked_at: null,
                },
                { onConflict: 'email' }
            )
            .select()
            .single();

        if (adminError) {
            console.error('❌ Admin upsert error:', adminError);
            return NextResponse.json({ error: adminError.message }, { status: 500 });
        }

        console.log('✅ Super admin setup complete!');

        return NextResponse.json({
            success: true,
            message: 'Super admin setup complete!',
            admin: {
                id: adminData.id,
                email: adminData.email,
                name: adminData.name,
                role: adminData.role,
            },
            credentials: {
                email: adminEmail,
                password: adminPassword,
            },
        });
    } catch (error: any) {
        console.error('❌ Setup error:', error);
        return NextResponse.json(
            { error: error.message || 'Setup failed' },
            { status: 500 }
        );
    }
}
