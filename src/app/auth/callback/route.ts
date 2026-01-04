import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams, origin } = new URL(request.url)
        const code = searchParams.get('code')
        const redirect = searchParams.get('redirect') || '/browse'
        const role = searchParams.get('role') || 'customer'

        if (!code) {
            console.error('No code provided in OAuth callback')
            return NextResponse.redirect(`${origin}/?error=no_code`)
        }

        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
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

        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError) {
            console.error('Error exchanging code for session:', exchangeError)
            return NextResponse.redirect(`${origin}/?error=auth_failed`)
        }

        // Get the authenticated user
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            console.error('Error getting user:', userError)
            return NextResponse.redirect(`${origin}/?error=user_fetch_failed`)
        }

        // Check if profile exists in the selected role's table
        const tableName = role === 'customer' ? 'customers' : 'restaurants'
        const { data: profile, error: profileError } = await supabase
            .from(tableName)
            .select('id')
            .eq('id', user.id)
            .maybeSingle()

        if (profileError) {
            console.error('Error checking profile:', profileError)
        }

        // If profile doesn't exist, create it
        if (!profile && role === 'customer') {
            const { error: insertError } = await supabase.from('customers').insert([{
                id: user.id,
                name: user.user_metadata.full_name || user.email?.split('@')[0] || 'User',
                email: user.email || '',
                phone: user.phone || '',
            }])

            if (insertError) {
                console.error('Error creating customer profile:', insertError)
                // Continue anyway - user is authenticated
            }
        }

        console.log('OAuth callback successful, redirecting to:', redirect)
        return NextResponse.redirect(`${origin}${redirect}`)
    } catch (error) {
        console.error('Unexpected error in OAuth callback:', error)
        const { origin } = new URL(request.url)
        return NextResponse.redirect(`${origin}/?error=unexpected_error`)
    }
}
