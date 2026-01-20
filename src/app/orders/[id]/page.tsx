"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle, MapPin, Clock, Phone, Mail, ShoppingBag, Leaf, ArrowRight, Timer, AlertCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import type { Database } from "@/types/database";

type Order = Database['public']['Tables']['orders']['Row'] & {
    rescue_bags: Database['public']['Tables']['rescue_bags']['Row'];
    restaurants: Database['public']['Tables']['restaurants']['Row'];
};

const CountdownTimer = ({ endTime, orderStatus }: { endTime: string, orderStatus: string }) => {
    const [timeLeft, setTimeLeft] = useState<{ hours: number, minutes: number, seconds: number } | null>(null);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const [hours, minutes, seconds] = endTime.split(':').map(Number);
            const target = new Date();
            target.setHours(hours, minutes, seconds || 0, 0);

            const difference = target.getTime() - now.getTime();

            if (difference <= 0) {
                setIsExpired(true);
                return null;
            }

            return {
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60)
            };
        };

        const timer = setInterval(() => {
            const left = calculateTimeLeft();
            setTimeLeft(left);
        }, 1000);

        setTimeLeft(calculateTimeLeft());

        return () => clearInterval(timer);
    }, [endTime]);

    if (orderStatus !== 'pending' && orderStatus !== 'confirmed') return null;

    return (
        <div className="bg-gradient-to-r from-[#0B1E0F] to-[#001220] p-6 rounded-[24px] text-[#F7F4EB] shadow-2xl shadow-[#001220]/40 mb-8 relative overflow-hidden border border-white/5">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Timer className="w-24 h-24" />
            </div>
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-[#F7F4EB]" />
                    <p className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-60">Time Remaining to Collect</p>
                </div>
                {isExpired ? (
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-8 h-8" />
                        <h2 className="text-2xl font-serif">Pickup window has ended</h2>
                    </div>
                ) : timeLeft ? (
                    <div className="flex items-end gap-4">
                        <div className="text-center">
                            <span className="text-4xl md:text-5xl font-serif">{String(timeLeft.hours).padStart(2, '0')}</span>
                            <p className="text-[8px] uppercase tracking-widest opacity-60 mt-1 font-bold">Hours</p>
                        </div>
                        <span className="text-4xl md:text-5xl font-serif mb-4 opacity-40">:</span>
                        <div className="text-center">
                            <span className="text-4xl md:text-5xl font-serif">{String(timeLeft.minutes).padStart(2, '0')}</span>
                            <p className="text-[8px] uppercase tracking-widest opacity-60 mt-1 font-bold">Mins</p>
                        </div>
                        <span className="text-4xl md:text-5xl font-serif mb-4 opacity-40">:</span>
                        <div className="text-center">
                            <span className="text-4xl md:text-5xl font-serif">{String(timeLeft.seconds).padStart(2, '0')}</span>
                            <p className="text-[8px] uppercase tracking-widest opacity-60 mt-1 font-bold">Secs</p>
                        </div>
                    </div>
                ) : (
                    <div className="h-12 w-48 bg-white/10 animate-pulse rounded-2xl" />
                )}
            </div>
        </div>
    );
};

export default function OrderConfirmationPage() {
    const params = useParams();
    const { customer } = useAuth();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    const supabase = createClient();

    useEffect(() => {
        fetchOrderDetails();
    }, [params.id]);

    const fetchOrderDetails = async () => {
        try {
            const { data, error } = await supabase
                .from("orders")
                .select(`
          *,
          rescue_bags (*),
          restaurants (*)
        `)
                .eq("id", params.id)
                .single();

            if (error) throw error;

            setOrder(data as Order);
        } catch (error) {
            console.error("Error fetching order:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0B1E0F] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-2 border-white/10 border-t-white rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[10px] uppercase tracking-[0.4em] text-white/40 animate-pulse font-black">Retrieving Reservation</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-[#0B1E0F] flex items-center justify-center p-4">
                <div className="text-center">
                    <ShoppingBag className="w-16 h-16 mx-auto mb-6 text-white/10" />
                    <h2 className="text-3xl font-serif mb-6 text-[#F7F4EB]">Order not found</h2>
                    <Link
                        href="/browse"
                        className="inline-block px-10 py-5 bg-[#F7F4EB] text-[#0B1E0F] text-[10px] uppercase tracking-[0.3em] font-black hover:bg-white transition-colors rounded-2xl"
                    >
                        Back to Browse
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#0B1E0F] text-[#F7F4EB] pt-32 pb-24 px-4 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#001220]/40 rounded-full blur-[150px] -z-10" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#0B1E0F]/40 rounded-full blur-[150px] -z-10" />

            <div className="max-w-4xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3 mb-6"
                        >
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] uppercase tracking-[0.4em] text-[#F7F4EB]/40 font-black">Successful Reservation</span>
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-5xl md:text-7xl font-serif leading-tight"
                        >
                            Dignity in <span className="italic opacity-60">Rescue.</span>
                        </motion.h1>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-right"
                    >
                        <p className="text-[10px] uppercase tracking-[0.2em] text-[#F7F4EB]/40 mb-2 font-black">Order Status</p>
                        <div className="px-6 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-2xl">
                            {order.status}
                        </div>
                    </motion.div>
                </div>

                <div className="grid md:grid-cols-5 gap-12">
                    <div className="md:col-span-3 space-y-8">
                        {/* Countdown Timer Component */}
                        <CountdownTimer 
                            endTime={order.rescue_bags.pickup_end_time} 
                            orderStatus={order.status} 
                        />

                        {/* Order Details Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white/5 backdrop-blur-md border border-white/10 p-10 rounded-[48px] space-y-12 shadow-2xl"
                        >
                            <div className="flex flex-col sm:flex-row gap-10 items-center sm:items-start">
                                <div className="w-32 h-32 bg-gradient-to-br from-[#0B1E0F] to-[#001220] rounded-[32px] border border-white/10 flex items-center justify-center flex-shrink-0 group relative overflow-hidden shadow-2xl">
                                    <ShoppingBag className="w-12 h-12 text-[#F7F4EB]/20 animate-pulse" />
                                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="flex-1 text-center sm:text-left">
                                    <h3 className="text-3xl font-serif mb-2">{order.rescue_bags.title}</h3>
                                    <p className="text-[#F7F4EB]/40 font-light tracking-widest italic mb-6">From {order.restaurants.name}</p>
                                    <div className="flex items-center justify-center sm:justify-start gap-8">
                                        <div>
                                            <p className="text-[9px] uppercase tracking-widest text-[#F7F4EB]/40 mb-1 font-black">Total Paid</p>
                                            <p className="text-3xl font-serif text-[#F7F4EB]">₹{order.total_price}</p>
                                        </div>
                                        <div className="w-px h-10 bg-white/10" />
                                        <div>
                                            <p className="text-[9px] uppercase tracking-widest text-[#F7F4EB]/40 mb-1 font-black">Quantity</p>
                                            <p className="text-2xl font-serif text-[#F7F4EB]">{order.quantity} Mystery Bag</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-10 pt-12 border-t border-white/10">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-[#F7F4EB]/60">
                                        <Clock className="w-4 h-4" />
                                        <p className="text-[10px] uppercase tracking-[0.2em] font-black">Collection Window</p>
                                    </div>
                                    <p className="text-base font-light leading-relaxed">
                                        Today, {order.rescue_bags.pickup_start_time.slice(0, 5)} - {order.rescue_bags.pickup_end_time.slice(0, 5)}
                                    </p>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-[#F7F4EB]/60">
                                        <MapPin className="w-4 h-4" />
                                        <p className="text-[10px] uppercase tracking-[0.2em] font-black">Target Location</p>
                                    </div>
                                    <p className="text-base font-light leading-relaxed">
                                        {order.restaurants.name}<br />
                                        <span className="opacity-40 text-sm">
                                            {order.restaurants.address_line1}, {order.restaurants.city}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    <div className="md:col-span-2 space-y-8">
                        {/* Restaurant Contact */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white/5 border border-white/10 p-8 rounded-[40px]"
                        >
                            <h4 className="text-[10px] uppercase tracking-[0.3em] text-[#F7F4EB]/40 mb-8 font-black">Protocol Assistance</h4>
                            <div className="space-y-8">
                                <div className="flex items-center gap-5 group cursor-pointer">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-[#F7F4EB] group-hover:text-[#0B1E0F] transition-all duration-500">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[8px] uppercase tracking-widest text-[#F7F4EB]/40 mb-1 font-black">Call Command</p>
                                        <p className="text-base font-light tracking-wide">{order.restaurants.phone}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-5 group cursor-pointer">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-[#F7F4EB] group-hover:text-[#0B1E0F] transition-all duration-500">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[8px] uppercase tracking-widest text-[#F7F4EB]/40 mb-1 font-black">Encrypted Mail</p>
                                        <p className="text-base font-light tracking-wide">{order.restaurants.email}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Actions */}
                        <div className="space-y-4 pt-4">
                            <Link
                                href="/browse"
                                className="w-full flex items-center justify-center gap-4 py-6 bg-[#F7F4EB] text-[#0B1E0F] text-[11px] uppercase tracking-[0.4em] font-black hover:bg-white transition-all rounded-[24px] shadow-2xl shadow-black/40 group overflow-hidden relative"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#0B1E0F]/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                <span className="relative z-10">Return to Field</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform relative z-10" />
                            </Link>
                            <Link
                                href="/orders"
                                className="w-full flex items-center justify-center py-6 border border-white/10 hover:bg-white/5 text-[10px] uppercase tracking-[0.4em] transition-all rounded-[24px] font-bold text-[#F7F4EB]/60 hover:text-[#F7F4EB]"
                            >
                                Mission Archives
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground animate-pulse">Retrieving Reservation</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <div className="text-center">
                    <ShoppingBag className="w-16 h-16 mx-auto mb-6 text-muted-foreground/20" />
                    <h2 className="text-2xl font-serif mb-6 text-white">Order not found</h2>
                    <Link
                        href="/browse"
                        className="inline-block px-10 py-5 bg-primary text-primary-foreground text-[10px] uppercase tracking-[0.3em] font-medium hover:opacity-90 transition-opacity rounded-sm"
                    >
                        Back to Browse
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-black text-white pt-32 pb-24 px-4 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] -z-10" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[150px] -z-10" />

            <div className="max-w-4xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3 mb-6"
                        >
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Successful Reservation</span>
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl md:text-6xl font-serif leading-tight"
                        >
                            Dignity in Rescue.
                        </motion.h1>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-right"
                    >
                        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Order Status</p>
                        <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-medium uppercase tracking-widest rounded-sm">
                            {order.status}
                        </div>
                    </motion.div>
                </div>

                <div className="grid md:grid-cols-5 gap-12">
                    <div className="md:col-span-3 space-y-8">
                        {/* Countdown Timer Component */}
                        <CountdownTimer 
                            endTime={order.rescue_bags.pickup_end_time} 
                            orderStatus={order.status} 
                        />

                        {/* Order Details Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-zinc-900/50 backdrop-blur-md border border-white/5 p-8 rounded-sm space-y-10"
                        >
                            <div className="flex gap-8">
                                <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-orange-500/20 rounded-sm flex items-center justify-center flex-shrink-0 group relative overflow-hidden">
                                    <ShoppingBag className="w-10 h-10 text-primary animate-pulse" />
                                    <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-serif mb-2">{order.rescue_bags.title}</h3>
                                    <p className="text-muted-foreground font-light italic mb-4">From {order.restaurants.name}</p>
                                    <div className="flex items-center gap-6">
                                        <div>
                                            <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Total Paid</p>
                                            <p className="text-2xl font-serif text-primary">₹{order.total_price}</p>
                                        </div>
                                        <div className="w-px h-8 bg-white/10" />
                                        <div>
                                            <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Quantity</p>
                                            <p className="text-xl font-serif">{order.quantity}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-8 pt-10 border-t border-white/5">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-primary">
                                        <Clock className="w-4 h-4" />
                                        <p className="text-[10px] uppercase tracking-[0.2em] font-medium">Collection Window</p>
                                    </div>
                                    <p className="text-sm font-light leading-relaxed">
                                        Today, {order.rescue_bags.pickup_start_time.slice(0, 5)} - {order.rescue_bags.pickup_end_time.slice(0, 5)}
                                    </p>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-primary">
                                        <MapPin className="w-4 h-4" />
                                        <p className="text-[10px] uppercase tracking-[0.2em] font-medium">Location</p>
                                    </div>
                                    <p className="text-sm font-light leading-relaxed">
                                        {order.restaurants.name}<br />
                                        <span className="text-muted-foreground opacity-60">
                                            {order.restaurants.address_line1}, {order.restaurants.city}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    <div className="md:col-span-2 space-y-8">
                        {/* Restaurant Contact */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-primary/5 border border-primary/10 p-8 rounded-sm"
                        >
                            <h4 className="text-[10px] uppercase tracking-[0.3em] text-primary mb-6">Need Assistance?</h4>
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 group cursor-pointer">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                                        <Phone className="w-4 h-4 text-primary group-hover:text-primary-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-[8px] uppercase tracking-widest text-muted-foreground mb-0.5">Call Restaurant</p>
                                        <p className="text-sm font-light">{order.restaurants.phone}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 group cursor-pointer">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                                        <Mail className="w-4 h-4 text-primary group-hover:text-primary-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-[8px] uppercase tracking-widest text-muted-foreground mb-0.5">Email Support</p>
                                        <p className="text-sm font-light">{order.restaurants.email}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Actions */}
                        <div className="space-y-4">
                            <Link
                                href="/browse"
                                className="w-full flex items-center justify-center gap-3 py-5 bg-white text-black text-[10px] uppercase tracking-[0.3em] font-semibold hover:bg-white/90 transition-all rounded-sm"
                            >
                                Continue Rescuing <ArrowRight className="w-3 h-3" />
                            </Link>
                            <Link
                                href="/browse#my-activity"
                                className="w-full flex items-center justify-center py-5 border border-white/10 hover:bg-white/5 text-[10px] uppercase tracking-[0.3em] transition-all rounded-sm"
                            >
                                View My Rescues
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
