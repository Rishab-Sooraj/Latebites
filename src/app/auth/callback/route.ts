import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const redirect = searchParams.get('redirect') || '/browse'
    const role = searchParams.get('role') || 'customer'
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const cookieStore = cookies()
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
                            // Handle cookie setting errors
                        }
                    },
                    remove(name: string, options: CookieOptions) {
                        try {
                            cookieStore.set({ name, value: '', ...options })
                        } catch (error) {
                            // Handle cookie removal errors
                        }
                    },
                },
            }
        )

        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // Get the authenticated user
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                // Check if profile exists in the selected role's table
                const tableName = role === 'customer' ? 'customers' : 'restaurants'
                const { data: profile } = await supabase
                    .from(tableName)
                    .select('id')
                    .eq('id', user.id)
                    .maybeSingle()

                // If profile doesn't exist, create it
                if (!profile && role === 'customer') {
                    await supabase.from('customers').insert([{
                        id: user.id,
                        name: user.user_metadata.full_name || user.email?.split('@')[0] || 'User',
                        email: user.email || '',
                        phone: user.phone || '',
                    }] as any)
                }
            }

            return NextResponse.redirect(`${origin}${redirect}`)
        }
    }

    // Return the user to an error page with some instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
