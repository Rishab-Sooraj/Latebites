import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SUPABASE_AUTH_STORAGE_KEY } from '@/lib/supabase/constants'

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams, origin } = new URL(request.url)
        const code = searchParams.get('code')
        const redirect = searchParams.get('redirect') || '/browse'
        const role = searchParams.get('role') || 'customer'

        console.log('🔐 OAuth callback started:', { code: code?.substring(0, 10), redirect, role })

        if (!code) {
            console.error('❌ No code provided in OAuth callback')
            return NextResponse.redirect(`${origin}/?error=no_code`)
        }

        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                auth: {
                    storageKey: SUPABASE_AUTH_STORAGE_KEY,
                },
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        try {
                            cookieStore.set({ name, value, ...options })
                        } catch (error) {
                            console.error('Error setting cookie:', error)
                        }
                    },
                    remove(name: string, options: CookieOptions) {
                        try {
                            cookieStore.set({ name, value: '', ...options })
                        } catch (error) {
                            console.error('Error removing cookie:', error)
                        }
                    },
                },
            }
        )

        console.log('🔄 Exchanging code for session...')
        const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError) {
            console.error('❌ Error exchanging code for session:', exchangeError)
            return NextResponse.redirect(`${origin}/?error=auth_failed`)
        }

        console.log('✅ Session established:', sessionData.user?.email)

        // Get the authenticated user
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            console.error('❌ Error getting user:', userError)
            return NextResponse.redirect(`${origin}/?error=user_fetch_failed`)
        }

        console.log('✅ User authenticated:', user.email)

        // Check if profile exists in the selected role's table
        const tableName = role === 'customer' ? 'customers' : 'restaurants'
        const { data: profile, error: profileError } = await supabase
            .from(tableName)
            .select('id')
            .eq('id', user.id)
            .maybeSingle()

        if (profileError) {
            console.error('⚠️ Error checking profile:', profileError)
        }

        // If profile doesn't exist, create it
        if (!profile && role === 'customer') {
            console.log('📝 Creating customer profile...')
            // Phone is required in customers table, use a placeholder if not provided
            const phoneNumber = user.phone || user.user_metadata.phone || '+910000000000';

            const { error: insertError } = await supabase.from('customers').insert([{
                id: user.id,
                name: user.user_metadata.full_name || user.user_metadata.name || user.email?.split('@')[0] || 'User',
                email: user.email || '',
                phone: phoneNumber,
            }])

            if (insertError) {
                console.error('❌ Error creating customer profile:', insertError)
                // Continue anyway - user is authenticated
            } else {
                console.log('✅ Customer profile created successfully')
            }
        } else if (profile) {
            console.log('✅ Profile already exists')
        }

        console.log('🎉 OAuth callback successful, redirecting to:', redirect)

        // Create response with redirect
        const response = NextResponse.redirect(`${origin}${redirect}`)

        // Ensure cookies are set on the response
        response.cookies.set({
            name: SUPABASE_AUTH_STORAGE_KEY,
            value: JSON.stringify(sessionData.session),
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
        })

        return response
    } catch (error) {
        console.error('❌ Unexpected error in OAuth callback:', error)
        const { origin } = new URL(request.url)
        return NextResponse.redirect(`${origin}/?error=unexpected_error`)
    }
}
