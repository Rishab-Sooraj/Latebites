"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { ShoppingBag, Clock, User, Check, X, AlertCircle, Loader2 } from "lucide-react";
import type { Database } from "@/types/database";

type Order = Database['public']['Tables']['orders']['Row'] & {
    rescue_bags: Database['public']['Tables']['rescue_bags']['Row'];
    customers: Database['public']['Tables']['customers']['Row'];
};

export default function RestaurantOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
    const [verifyingOrder, setVerifyingOrder] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const supabase = createClient();

    useEffect(() => {
        fetchOrders();

        // Set up real-time subscription for order updates
        const channel = supabase
            .channel('orders-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
                fetchOrders();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchOrders = async () => {
        try {
            // Get current user's restaurant
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) return;

            // Fetch restaurant
            const { data: restaurant } = await supabase
                .from('restaurants')
                .select('id')
                .eq('email', user.email)
                .single();

            if (!restaurant) return;

            // Fetch orders for this restaurant
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    rescue_bags (*),
                    customers (*)
                `)
                .eq('restaurant_id', restaurant.id)
                .in('status', ['pending', 'confirmed', 'ready'])
                .order('created_at', { ascending: false });

            if (error) throw error;

            setOrders(data as Order[]);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (orderId: string, value: string) => {
        // Only allow digits and max 4 characters
        const sanitized = value.replace(/\D/g, '').slice(0, 4);
        setOtpInputs(prev => ({ ...prev, [orderId]: sanitized }));
        setError(null);
    };

    const handleVerifyOtp = async (orderId: string) => {
        const otp = otpInputs[orderId];

        if (!otp || otp.length !== 4) {
            setError('Please enter a 4-digit OTP');
            return;
        }

        setVerifyingOrder(orderId);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch('/api/orders/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_id: orderId, otp }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to verify OTP');
                return;
            }

            setSuccess('Order completed successfully!');
            setOtpInputs(prev => ({ ...prev, [orderId]: '' }));

            // Refresh orders list
            fetchOrders();

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setVerifyingOrder(null);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
            confirmed: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
            ready: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        };
        return styles[status] || 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground animate-pulse">Loading Orders</p>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-black text-white pt-24 pb-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <h1 className="text-4xl md:text-5xl font-serif mb-2">Pending Orders</h1>
                    <p className="text-lg text-muted-foreground font-light">
                        Verify customer pickup with OTP
                    </p>
                </motion.div>

                {/* Status Messages */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-sm flex items-center gap-3"
                        >
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            <p className="text-red-400">{error}</p>
                        </motion.div>
                    )}
                    {success && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-sm flex items-center gap-3"
                        >
                            <Check className="w-5 h-5 text-emerald-500" />
                            <p className="text-emerald-400">{success}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Orders List */}
                {orders.length > 0 ? (
                    <div className="space-y-6">
                        {orders.map((order, index) => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-sm overflow-hidden"
                            >
                                <div className="p-6">
                                    {/* Order Header */}
                                    <div className="flex items-start justify-between mb-6">
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">
                                                Order #{order.id.slice(0, 8)}
                                            </p>
                                            <h3 className="text-xl font-serif">{order.rescue_bags.title}</h3>
                                        </div>
                                        <span className={`px-3 py-1 text-xs font-medium uppercase tracking-wider border rounded-sm ${getStatusBadge(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </div>

                                    {/* Order Details */}
                                    <div className="grid sm:grid-cols-3 gap-6 mb-6">
                                        <div className="flex items-center gap-3">
                                            <User className="w-5 h-5 text-muted-foreground" />
                                            <div>
                                                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Customer</p>
                                                <p className="text-sm">{order.customers?.name || 'Unknown'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <ShoppingBag className="w-5 h-5 text-muted-foreground" />
                                            <div>
                                                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Quantity</p>
                                                <p className="text-sm">{order.quantity} bag(s)</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Clock className="w-5 h-5 text-muted-foreground" />
                                            <div>
                                                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Pickup Time</p>
                                                <p className="text-sm">
                                                    {order.rescue_bags.pickup_start_time.slice(0, 5)} - {order.rescue_bags.pickup_end_time.slice(0, 5)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* OTP Verification */}
                                    <div className="pt-6 border-t border-white/5">
                                        <p className="text-[10px] uppercase tracking-[0.3em] text-primary mb-4">Enter Customer OTP to Complete</p>
                                        <div className="flex gap-4 items-center">
                                            <div className="flex gap-2">
                                                {[0, 1, 2, 3].map((i) => (
                                                    <input
                                                        key={i}
                                                        type="text"
                                                        inputMode="numeric"
                                                        maxLength={1}
                                                        value={(otpInputs[order.id] || '')[i] || ''}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            if (/^\d?$/.test(val)) {
                                                                const currentOtp = otpInputs[order.id] || '';
                                                                const otpArray = currentOtp.split('');
                                                                otpArray[i] = val;
                                                                handleOtpChange(order.id, otpArray.join(''));

                                                                // Auto-focus next input
                                                                if (val && i < 3) {
                                                                    const nextInput = e.target.nextElementSibling as HTMLInputElement;
                                                                    nextInput?.focus();
                                                                }
                                                            }
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Backspace' && !(otpInputs[order.id] || '')[i] && i > 0) {
                                                                const prevInput = e.currentTarget.previousElementSibling as HTMLInputElement;
                                                                prevInput?.focus();
                                                            }
                                                        }}
                                                        className="w-12 h-14 text-center text-2xl font-mono bg-black/50 border border-primary/30 rounded-sm focus:outline-none focus:border-primary transition-colors"
                                                    />
                                                ))}
                                            </div>
                                            <button
                                                onClick={() => handleVerifyOtp(order.id)}
                                                disabled={verifyingOrder === order.id || (otpInputs[order.id] || '').length !== 4}
                                                className="px-6 py-4 bg-primary text-primary-foreground text-xs uppercase tracking-widest font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                {verifyingOrder === order.id ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Verifying...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Check className="w-4 h-4" />
                                                        Verify & Complete
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-zinc-900/50 border border-white/5 rounded-sm p-12 text-center"
                    >
                        <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground/40" />
                        <h2 className="text-2xl font-serif mb-2">No pending orders</h2>
                        <p className="text-muted-foreground font-light">
                            When customers place orders, they will appear here
                        </p>
                    </motion.div>
                )}
            </div>
        </main>
    );
}
