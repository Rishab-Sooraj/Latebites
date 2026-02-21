import { NextResponse } from 'next/server';
import { getAuthenticatedUser, isSuperAdmin, supabaseAdmin } from '@/lib/auth-helpers';

// Generate a secure temporary password
function generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    const specialChars = '@#$%&*';
    let password = '';

    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
    password += Math.floor(Math.random() * 10);

    return password;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, role } = body;

        // Validate required fields
        if (!name || !email || !role) {
            return NextResponse.json(
                { error: 'Name, email, and role are required' },
                { status: 400 }
            );
        }

        // Validate role
        if (!['admin', 'super_admin'].includes(role)) {
            return NextResponse.json(
                { error: 'Invalid role' },
                { status: 400 }
            );
        }

        // Check authentication via token
        const user = await getAuthenticatedUser(request);

        if (!user || !user.email) {
            console.error('❌ No authenticated user found');
            return NextResponse.json(
                { error: 'Unauthorized - Please log in again' },
                { status: 401 }
            );
        }

        console.log('✅ Authenticated user:', user.email);

        // Check if user is super admin
        const isSuper = await isSuperAdmin(user.email);

        if (!isSuper) {
            console.error('❌ User is not a super admin:', user.email);
            return NextResponse.json(
                { error: 'Only super admins can create new admins' },
                { status: 403 }
            );
        }

        console.log('✅ User is super admin, proceeding...');

        // Check if email already exists
        const { data: existingAdmin } = await supabaseAdmin
            .from('admins')
            .select('id')
            .ilike('email', email)
            .single();

        if (existingAdmin) {
            return NextResponse.json(
                { error: 'An admin with this email already exists' },
                { status: 400 }
            );
        }

        // Generate temporary password
        const tempPassword = generateTempPassword();

        // Create auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
                role: 'admin',
                name: name,
            },
        });

        if (authError) {
            console.error('❌ Auth error:', authError);
            return NextResponse.json(
                { error: authError.message || 'Failed to create user account' },
                { status: 500 }
            );
        }

        console.log('✅ Auth user created:', authData.user.id);

        // Create admin record
        const { data: adminData, error: adminError } = await supabaseAdmin
            .from('admins')
            .insert({
                name: name,
                email: email,
                role: role,
                user_id: authData.user.id,
                is_active: true,
                must_change_password: true,
            })
            .select()
            .single();

        if (adminError) {
            console.error('❌ Admin insert error:', adminError);
            // Try to delete the auth user if admin creation fails
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

            return NextResponse.json(
                { error: adminError.message || 'Failed to create admin record' },
                { status: 500 }
            );
        }

        console.log('✅ Admin created successfully:', adminData.id);

        return NextResponse.json({
            success: true,
            adminId: adminData.id,
            name: name,
            email: email,
            role: role,
            temporaryPassword: tempPassword,
            message: 'Admin account created successfully',
        });

    } catch (error: any) {
        console.error('❌ Unexpected error:', error);
        return NextResponse.json(
            { error: error.message || 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
