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
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 rounded-sm text-white shadow-xl shadow-orange-500/20 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20">
                <Timer className="w-24 h-24" />
            </div>
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4" />
                    <p className="text-[10px] uppercase tracking-[0.3em] font-medium">Time Remaining to Collect</p>
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
                            <p className="text-[8px] uppercase tracking-widest opacity-80 mt-1">Hours</p>
                        </div>
                        <span className="text-4xl md:text-5xl font-serif mb-4">:</span>
                        <div className="text-center">
                            <span className="text-4xl md:text-5xl font-serif">{String(timeLeft.minutes).padStart(2, '0')}</span>
                            <p className="text-[8px] uppercase tracking-widest opacity-80 mt-1">Mins</p>
                        </div>
                        <span className="text-4xl md:text-5xl font-serif mb-4">:</span>
                        <div className="text-center">
                            <span className="text-4xl md:text-5xl font-serif">{String(timeLeft.seconds).padStart(2, '0')}</span>
                            <p className="text-[8px] uppercase tracking-widest opacity-80 mt-1">Secs</p>
                        </div>
                    </div>
                ) : (
                    <div className="h-12 w-48 bg-white/20 animate-pulse rounded-sm" />
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

                        {/* Pickup OTP Card */}
                        {(order.status === 'pending' || order.status === 'confirmed' || order.status === 'ready') && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.15 }}
                                className="bg-gradient-to-br from-emerald-900/50 to-teal-900/50 backdrop-blur-md border border-emerald-500/20 p-8 rounded-sm mb-8"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                                    </div>
                                    <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-400 font-medium">Your Pickup Code</p>
                                </div>
                                <div className="flex items-center justify-center gap-3">
                                    {order.pickup_otp?.split('').map((digit, index) => (
                                        <div
                                            key={index}
                                            className="w-16 h-20 bg-black/40 border border-emerald-500/30 rounded-sm flex items-center justify-center"
                                        >
                                            <span className="text-4xl font-mono font-bold text-emerald-400">{digit}</span>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-center text-muted-foreground text-sm mt-6 font-light">
                                    Share this code with the restaurant to confirm your pickup
                                </p>
                            </motion.div>
                        )}

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
