import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import { SUPABASE_AUTH_STORAGE_KEY } from './constants'

// Singleton client instance to ensure consistent session across the app
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
    if (supabaseClient) {
        return supabaseClient;
    }

    supabaseClient = createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                storageKey: SUPABASE_AUTH_STORAGE_KEY, // Unique key for customer app
            },
            // Use default cookie settings for compatibility with middleware
        }
    );

    return supabaseClient;
}
