import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json(
                { error: 'Verification token is required' },
                { status: 400 }
            );
        }

        // Find the submission with this token
        const { data: submissions, error: fetchError } = await supabase
            .from('Resturant Onboarding')
            .select('*')
            .eq('verification_token', token)
            .limit(1);

        if (fetchError || !submissions || submissions.length === 0) {
            return NextResponse.json(
                { error: 'Invalid or expired verification token' },
                { status: 404 }
            );
        }

        const submission = submissions[0];

        // Check if already verified
        if (submission.verified) {
            return NextResponse.json(
                { message: 'Email already verified', alreadyVerified: true },
                { status: 200 }
            );
        }

        // Update to verified
        const { error: updateError } = await supabase
            .from('Resturant Onboarding')
            .update({ verified: true })
            .eq('verification_token', token);

        if (updateError) {
            console.error('Update error:', updateError);
            return NextResponse.json(
                { error: 'Failed to verify email. Please try again.' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { message: 'Email verified successfully!', verified: true },
            { status: 200 }
        );
    } catch (error) {
        console.error('Verification error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
