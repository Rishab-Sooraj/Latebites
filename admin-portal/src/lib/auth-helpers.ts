import { createClient } from '@supabase/supabase-js';

// Service role client - bypasses RLS
export const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Get authenticated user from Authorization header token
export async function getAuthenticatedUser(request: Request) {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error('❌ No Authorization header found');
        return null;
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify the token using service role client
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
        console.error('❌ Token verification failed:', error?.message);
        return null;
    }

    console.log('✅ Token verified for:', user.email);
    return user;
}

// Check if user is a super admin
export async function isSuperAdmin(email: string): Promise<boolean> {
    const { data: admin } = await supabaseAdmin
        .from('admins')
        .select('role')
        .ilike('email', email)
        .eq('is_active', true)
        .single();

    return admin?.role === 'super_admin';
}

// Get admin data by email
export async function getAdminByEmail(email: string) {
    const { data: admin } = await supabaseAdmin
        .from('admins')
        .select('*')
        .ilike('email', email)
        .eq('is_active', true)
        .single();

    return admin;
}
