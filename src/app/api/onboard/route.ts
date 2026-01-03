import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { generateVerificationEmail, generateVerificationToken } from '@/lib/email-template';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Helper function to get Resend client (lazy initialization)
function getResendClient() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.warn('⚠️ RESEND_API_KEY not configured - email sending will be skipped');
        return null;
    }
    return new Resend(apiKey);
}

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

        // Generate verification token
        const verificationToken = generateVerificationToken();
        const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify?token=${verificationToken}`;

        // Insert data into Supabase with verified: false
        const { data, error } = await supabaseAdmin
            .from('Resturant Onboarding')
            .insert([
                {
                    restaurant_name,
                    contact_person,
                    email,
                    phone_number,
                    city,
                    verified: false,
                    verification_token: verificationToken,
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

        // Send verification email
        try {
            const resend = getResendClient();

            if (!resend) {
                console.warn('⚠️ Skipping email send - Resend not configured');
                // Continue without sending email - data is still saved
            } else {
                const emailHtml = generateVerificationEmail(restaurant_name, contact_person, verificationUrl);

                console.log('📧 Attempting to send email to:', email);
                console.log('🔗 Verification URL:', verificationUrl);

                const emailResult = await resend.emails.send({
                    from: 'Latebites <hello@onboarding.latebites.in>',
                    to: email,
                    subject: 'Verify Your Email - Latebites Restaurant Onboarding',
                    html: emailHtml,
                });

                console.log('✅ Email sent successfully!', emailResult);
            }
        } catch (emailError) {
            console.error('❌ Email sending error:', emailError);
            // Don't fail the request if email fails - data is still saved
            // You can manually verify or resend later
        }

        return NextResponse.json(
            {
                message: 'Thank you! Please check your email to verify your address. We\'ll contact you once verified.',
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
