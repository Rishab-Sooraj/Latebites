import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service role client - bypasses RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from('admins')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching admins:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data || []);
    } catch (error: any) {
        console.error('Unexpected error fetching admins:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch admins' },
            { status: 500 }
        );
    }
}
