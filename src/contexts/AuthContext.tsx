"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

type Customer = Database['public']['Tables']['customers']['Row'];
type Restaurant = Database['public']['Tables']['restaurants']['Row'];

type UserRole = 'customer' | 'restaurant' | null;

interface AuthContextType {
    user: User | null;
    customer: Customer | null;
    restaurant: Restaurant | null;
    role: UserRole;
    session: Session | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [role, setRole] = useState<UserRole>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchUserProfile = async (userId: string) => {
        // Try to fetch customer first
        const { data: customerData } = await supabase
            .from('customers')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        if (customerData) {
            setCustomer(customerData);
            setRestaurant(null);
            setRole('customer');
            return;
        }

        // If not a customer, try restaurant
        const { data: restaurantData } = await supabase
            .from('restaurants')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        if (restaurantData) {
            setRestaurant(restaurantData);
            setCustomer(null);
            setRole('restaurant');
            return;
        }

        // No profile found
        setCustomer(null);
        setRestaurant(null);
        setRole(null);
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchUserProfile(user.id);
        }
    };

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                fetchUserProfile(session.user.id).then(() => setLoading(false));
            } else {
                setLoading(false);
            }
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                await fetchUserProfile(session.user.id);
            } else {
                setCustomer(null);
                setRestaurant(null);
                setRole(null);
            }

            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setCustomer(null);
        setRestaurant(null);
        setRole(null);
        setSession(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                customer,
                restaurant,
                role,
                session,
                loading,
                signOut,
                refreshProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
