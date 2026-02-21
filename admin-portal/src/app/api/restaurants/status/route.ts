import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail, SENDERS } from '@/lib/email';
import { getApprovalEmail } from '@/lib/email-templates';

export async function POST(request: Request) {
    console.log('🚀 Approval API Called');
    console.log('ZEPTOMAIL_API_KEY present:', !!process.env.ZEPTOMAIL_API_KEY);

    try {
        const body = await request.json();
        const { restaurantId, status, adminEmail } = body;

        console.log(`Processing status change: ${restaurantId} -> ${status}`);

        if (!restaurantId || !status) {
            return NextResponse.json(
                { error: 'Restaurant ID and status are required' },
                { status: 400 }
            );
        }

        if (!['approved', 'rejected'].includes(status)) {
            return NextResponse.json(
                { error: 'Status must be approved or rejected' },
                { status: 400 }
            );
        }

        if (!adminEmail) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Use admin client (service role) to validate the caller
        const adminClient = createAdminClient();

        // Verify the provided email belongs to an active admin
        const { data: adminData } = await adminClient
            .from('admins')
            .select('id')
            .ilike('email', adminEmail)
            .eq('is_active', true)
            .single();

        if (!adminData) {
            console.warn('Not an active admin:', adminEmail);
            return NextResponse.json(
                { error: 'Admin privileges required' },
                { status: 403 }
            );
        }

        // Get restaurant details before updating
        const { data: restaurant } = await adminClient
            .from('Resturant Onboarding')
            .select('restaurant_name, contact_person, email')
            .eq('id', restaurantId)
            .single();

        console.log('Restaurant details found:', restaurant ? 'Yes' : 'No', restaurant?.email);

        const { error: updateError } = await adminClient
            .from('Resturant Onboarding')
            .update({ status: status })
            .eq('id', restaurantId);

        if (updateError) {
            console.error('Update error:', updateError);
            return NextResponse.json(
                { error: updateError.message || 'Failed to update status' },
                { status: 500 }
            );
        }

        // Send approval email if status is approved
        if (status === 'approved' && restaurant) {
            console.log('📧 Attempting to send approval email to:', restaurant.email);
            const emailResult = await sendEmail({
                to: [{ email: restaurant.email, name: restaurant.contact_person }],
                from: SENDERS.onboarding,
                subject: '🎉 Your Latebites Application Has Been Approved!',
                htmlBody: getApprovalEmail(restaurant.restaurant_name, restaurant.contact_person),
            });

            if (!emailResult.success) {
                console.error('❌ Failed to send approval email:', emailResult.error);
            } else {
                console.log('✅ Approval email sent successfully');
            }
        }

        return NextResponse.json({
            success: true,
            message: `Restaurant ${status} successfully`,
            emailSent: status === 'approved',
        });

    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

