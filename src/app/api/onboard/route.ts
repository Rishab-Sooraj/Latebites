import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
    try {
        const { userId, role, name, email, phone } = await request.json();

        // Create server-side Supabase client
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        if (role === 'customer') {
            const { error } = await supabase
                .from('customers')
                .insert([{
                    id: userId,
                    name,
                    email,
                    phone: phone || '',
                }]);

            if (error) throw error;
        } else if (role === 'restaurant') {
            const { error } = await supabase
                .from('restaurants')
                .insert([{
                    id: userId,
                    name,
                    email,
                    phone: phone || '',
                }]);

            if (error) throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Onboarding error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create profile' },
            { status: 500 }
        );
    }
}
