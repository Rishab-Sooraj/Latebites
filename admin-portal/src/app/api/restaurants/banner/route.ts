import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { restaurantId, adminEmail, bannerBase64, fileExt } = body;

        if (!restaurantId || !adminEmail || !bannerBase64 || !fileExt) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const adminClient = createAdminClient();

        // Verify the admin exists and is active
        const { data: adminData, error: adminError } = await adminClient
            .from('admins')
            .select('id')
            .ilike('email', adminEmail)
            .eq('is_active', true)
            .single();

        if (adminError || !adminData) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Upload the image to the restaurant-images bucket using service role
        const fileName = `banner_${restaurantId}_${Date.now()}.${fileExt}`;
        const base64Data = bannerBase64.split(',')[1]; // Remove "data:image/xxx;base64," prefix
        const buffer = Buffer.from(base64Data, 'base64');

        const { error: uploadError } = await adminClient.storage
            .from('restaurant-images')
            .upload(fileName, buffer, {
                contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
                upsert: true,
            });

        if (uploadError) {
            console.error('Storage upload error:', uploadError);
            return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
        }

        // Get the public URL
        const { data: urlData } = adminClient.storage
            .from('restaurant-images')
            .getPublicUrl(fileName);

        const bannerUrl = urlData?.publicUrl;

        // Update the restaurant record
        const { error: updateError } = await adminClient
            .from('restaurants')
            .update({ cover_image_url: bannerUrl })
            .eq('id', restaurantId);

        if (updateError) {
            console.error('DB update error:', updateError);
            return NextResponse.json({ error: `DB update failed: ${updateError.message}` }, { status: 500 });
        }

        return NextResponse.json({ success: true, bannerUrl });
    } catch (error: any) {
        console.error('Banner upload error:', error);
        return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
    }
}
