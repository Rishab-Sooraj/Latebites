import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail, SENDERS } from '@/lib/email';
import { getOnboardingConfirmationEmail } from '@/lib/email-templates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        // Create Supabase admin client inside the handler
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        const body = await request.json();
        const { restaurant_name, contact_person, email, phone_number, city } = body;

        // Validate required fields
        if (!restaurant_name || !contact_person || !email || !phone_number || !city) {
            return NextResponse.json(
                { error: 'All fields are required' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Please enter a valid email address' },
                { status: 400 }
            );
        }

        // Check for duplicate email
        const { data: existingEmail, error: checkError } = await supabaseAdmin
            .from('Resturant Onboarding')
            .select('email')
            .eq('email', email)
            .limit(1);

        if (checkError) {
            console.error('Error checking for duplicate email:', checkError);
        }

        if (existingEmail && existingEmail.length > 0) {
            return NextResponse.json(
                { error: 'This email address is already registered. Please use a different email or contact support if you believe this is an error.' },
                { status: 409 }
            );
        }

        // Insert data into Supabase
        const { data, error } = await supabaseAdmin
            .from('Resturant Onboarding')
            .insert([
                {
                    restaurant_name,
                    contact_person,
                    email,
                    phone_number,
                    city,
                    status: 'pending', // Default status
                    created_at: new Date().toISOString(),
                },
            ])
            .select();

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json(
                { error: 'Failed to submit onboarding request. Please try again.' },
                { status: 500 }
            );
        }

        // Send confirmation email via ZeptoMail
        try {
            const emailHtml = getOnboardingConfirmationEmail(restaurant_name, contact_person);

            const emailResult = await sendEmail({
                to: [{ email, name: contact_person }],
                from: SENDERS.onboarding,
                subject: 'Application Received - Latebites',
                htmlBody: emailHtml,
            });

            if (!emailResult.success) {
                console.error('Failed to send onboarding email:', emailResult.error);
            }
        } catch (emailError) {
            console.error('Email sending error:', emailError);
            // Don't fail the request if email fails - data is still saved
        }

        return NextResponse.json(
            {
                message: 'Thank you! Your application has been received.',
                data
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred. Please try again.' },
            { status: 500 }
        );
    }
}
