"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle, MapPin, Clock, Phone, Mail, ShoppingBag, ArrowRight, Timer, AlertCircle, Sparkles, Copy, Check, X, Loader2, RotateCcw, AlertTriangle } from "lucide-react";
import Link from "next/link";
import type { Database } from "@/types/database";

type Order = Database['public']['Tables']['orders']['Row'] & {
    rescue_bags: Database['public']['Tables']['rescue_bags']['Row'] | null;
    restaurants: Database['public']['Tables']['restaurants']['Row'] | null;
};

// Premium Rolling Digit Animation Component
const RollingDigit = ({ digit, delay = 0 }: { digit: string, delay?: number }) => {
    const [displayDigit, setDisplayDigit] = useState(0);
    const [isAnimating, setIsAnimating] = useState(true);
    const targetDigit = parseInt(digit) || 0;

    useEffect(() => {
        const startDelay = setTimeout(() => {
            let current = 0;
            const rolls = 15 + Math.floor(Math.random() * 10);
            let rollCount = 0;

            const interval = setInterval(() => {
                rollCount++;
                if (rollCount < rolls) {
                    current = Math.floor(Math.random() * 10);
                    setDisplayDigit(current);
                } else {
                    setDisplayDigit(targetDigit);
                    setIsAnimating(false);
                    clearInterval(interval);
                }
            }, 50 + rollCount * 3);

            return () => clearInterval(interval);
        }, delay);

        return () => clearTimeout(startDelay);
    }, [targetDigit, delay]);

    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0, rotateX: -90 }}
            animate={{ scale: 1, opacity: 1, rotateX: 0 }}
            transition={{ delay: delay / 1000, duration: 0.5, type: "spring" }}
            className="relative"
        >
            <div className="w-14 h-20 sm:w-16 sm:h-24 md:w-20 md:h-28 bg-gradient-to-b from-zinc-800 to-zinc-900 border border-emerald-500/30 rounded-lg flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.15)] relative overflow-hidden group">
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                {/* Top reflection */}
                <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/10 to-transparent rounded-t-lg" />

                {/* Digit */}
                <motion.span
                    key={displayDigit}
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className={`text-4xl sm:text-5xl md:text-6xl font-mono font-bold drop-shadow-[0_0_10px_rgba(16,185,129,0.5)] ${isAnimating ? 'text-emerald-300' : 'text-emerald-400'}`}
                >
                    {displayDigit}
                </motion.span>

                {/* Bottom shadow */}
                <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/40 to-transparent" />
            </div>

            {/* Glow under card */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-4 bg-emerald-500/20 blur-xl rounded-full" />
        </motion.div>
    );
};

// Lock-in Countdown Timer (45 mins before pickup starts)
const LockInCountdown = ({ pickupStartTime, orderStatus }: { pickupStartTime: string, orderStatus: string }) => {
    const [timeLeft, setTimeLeft] = useState<{ hours: number, minutes: number, seconds: number } | null>(null);
    const [isLocked, setIsLocked] = useState(false);
    const [lockInTime, setLockInTime] = useState<string>('');

    useEffect(() => {
        // Calculate lock-in time (45 minutes before pickup start)
        const [hours, minutes, seconds] = pickupStartTime.split(':').map(Number);
        const now = new Date();
        const pickupStart = new Date();
        pickupStart.setHours(hours, minutes, seconds || 0, 0);

        // If pickup time is in the past today (e.g., 00:30 when it's 12:53), it's for tomorrow
        if (pickupStart.getTime() < now.getTime()) {
            pickupStart.setDate(pickupStart.getDate() + 1);
        }

        // Lock-in is 45 minutes before pickup
        const lockIn = new Date(pickupStart.getTime() - 45 * 60 * 1000);

        // Format lock-in time for display
        const lockInHours = lockIn.getHours().toString().padStart(2, '0');
        const lockInMins = lockIn.getMinutes().toString().padStart(2, '0');
        setLockInTime(`${lockInHours}:${lockInMins}`);

        const calculateTimeLeft = () => {
            const currentTime = new Date();
            let difference = lockIn.getTime() - currentTime.getTime();

            if (difference < 0) {
                // Lock-in time has passed
                setIsLocked(true);
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
    }, [pickupStartTime]);

    // Only show for pending orders
    if (!['pending'].includes(orderStatus.toLowerCase())) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-xl mb-6"
        >
            {/* Animated gradient background */}
            <div className={`absolute inset-0 bg-gradient-to-r ${isLocked ? 'from-red-600 via-rose-500 to-red-600' : 'from-violet-600 via-purple-500 to-violet-600'} bg-[length:200%_100%]`}
                style={{ animation: 'shimmer 3s ease-in-out infinite' }} />

            <div className="relative p-6 sm:p-8">
                {/* Floating icon */}
                <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                    <AlertCircle className="w-full h-full text-white" />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-white/80" />
                        <p className="text-[10px] uppercase tracking-[0.3em] font-medium text-white/90">
                            {isLocked ? 'Order Locked In' : 'Lock-in Deadline'}
                        </p>
                    </div>

                    {/* Show when lock-in is */}
                    <p className="text-sm text-white/70 mb-4">
                        {isLocked
                            ? 'Your order is now locked. Cancellation fees may apply.'
                            : `Free cancellation until ${lockInTime} (45 mins before pickup)`
                        }
                    </p>

                    {isLocked ? (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-serif text-white">Locked In ✓</h2>
                        </div>
                    ) : timeLeft ? (
                        <div className="flex items-end gap-1 sm:gap-3">
                            {[
                                { value: timeLeft.hours, label: 'Hours' },
                                { value: timeLeft.minutes, label: 'Mins' },
                                { value: timeLeft.seconds, label: 'Secs' }
                            ].map((item, index) => (
                                <div key={item.label} className="flex items-end">
                                    <div className="text-center">
                                        <motion.span
                                            key={item.value}
                                            initial={{ y: -10, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            className="block text-4xl sm:text-5xl md:text-6xl font-serif text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]"
                                        >
                                            {String(item.value).padStart(2, '0')}
                                        </motion.span>
                                        <p className="text-[8px] uppercase tracking-widest text-white/70 mt-1">{item.label}</p>
                                    </div>
                                    {index < 2 && (
                                        <span className="text-4xl sm:text-5xl md:text-6xl font-serif text-white/50 mx-1 sm:mx-2 mb-5">:</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : null}
                </div>
            </div>
        </motion.div>
    );
};


// Premium Countdown Timer (Pickup Window)
const CountdownTimer = ({ endTime, orderStatus }: { endTime: string, orderStatus: string }) => {
    const [timeLeft, setTimeLeft] = useState<{ hours: number, minutes: number, seconds: number } | null>(null);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const [hours, minutes, seconds] = endTime.split(':').map(Number);
            const target = new Date();
            target.setHours(hours, minutes, seconds || 0, 0);

            // If target time is in the past today, assume it's for tomorrow
            let difference = target.getTime() - now.getTime();
            if (difference < 0) {
                target.setDate(target.getDate() + 1);
                difference = target.getTime() - now.getTime();
            }

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

    // Show for active orders - removed strict status check
    if (!['pending', 'confirmed', 'ready'].includes(orderStatus.toLowerCase())) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-xl mb-8"
        >
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 bg-[length:200%_100%]"
                style={{ animation: 'shimmer 3s ease-in-out infinite' }} />

            <div className="relative p-6 sm:p-8">
                {/* Floating particles */}
                <div className="absolute top-0 right-0 w-32 h-32">
                    <Timer className="w-full h-full text-white/10" />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-4 h-4 text-white/80" />
                        <p className="text-[10px] uppercase tracking-[0.3em] font-medium text-white/90">
                            Pickup Window Closes In
                        </p>
                    </div>

                    {isExpired ? (
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-8 h-8 text-white" />
                            <h2 className="text-2xl font-serif text-white">Pickup window has ended</h2>
                        </div>
                    ) : timeLeft ? (
                        <div className="flex items-end gap-1 sm:gap-3">
                            {[
                                { value: timeLeft.hours, label: 'Hours' },
                                { value: timeLeft.minutes, label: 'Mins' },
                                { value: timeLeft.seconds, label: 'Secs' }
                            ].map((item, index) => (
                                <div key={item.label} className="flex items-end">
                                    <div className="text-center">
                                        <motion.span
                                            key={item.value}
                                            initial={{ y: -10, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            className="block text-4xl sm:text-5xl md:text-6xl font-serif text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]"
                                        >
                                            {String(item.value).padStart(2, '0')}
                                        </motion.span>
                                        <p className="text-[8px] uppercase tracking-widest text-white/70 mt-1">{item.label}</p>
                                    </div>
                                    {index < 2 && (
                                        <span className="text-4xl sm:text-5xl md:text-6xl font-serif text-white/50 mx-1 sm:mx-2 mb-5">:</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-16 w-48 bg-white/20 animate-pulse rounded-lg" />
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default function OrderConfirmationPage() {
    const params = useParams();
    const { customer } = useAuth();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [cancelResult, setCancelResult] = useState<{ success: boolean; message: string; refunded?: boolean } | null>(null);
    const [isLocked, setIsLocked] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        if (params.id) {
            fetchOrderDetails();
        }
    }, [params.id]);

    const fetchOrderDetails = async () => {
        try {
            // Use API endpoint to get order with rescue bag data (bypasses RLS)
            const response = await fetch(`/api/orders/${params.id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch order');
            }

            const orderData = await response.json();
            console.log('✅ Order fetched via API:', orderData);
            console.log('📦 Rescue bag:', orderData.rescue_bags);
            console.log('🍽️ Restaurant:', orderData.restaurants);

            setOrder(orderData as Order);
        } catch (error) {
            console.error("Error fetching order:", error);
        } finally {
            setLoading(false);
        }
    };

    const copyOtp = () => {
        if ((order as any)?.pickup_otp) {
            navigator.clipboard.writeText((order as any).pickup_otp);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Check if before lock-in period
    const checkIsBeforeLockIn = () => {
        if (!order?.rescue_bags?.pickup_start_time) return true;

        const now = new Date();
        const [hours, minutes, seconds] = order.rescue_bags.pickup_start_time.split(':').map(Number);
        const pickupStart = new Date();
        pickupStart.setHours(hours, minutes, seconds || 0, 0);

        if (pickupStart.getTime() < now.getTime()) {
            pickupStart.setDate(pickupStart.getDate() + 1);
        }

        const lockInTime = new Date(pickupStart.getTime() - 45 * 60 * 1000);
        return now.getTime() < lockInTime.getTime();
    };

    const handleCancelOrder = async () => {
        if (!order) return;

        setCancelLoading(true);
        setCancelResult(null);

        try {
            const response = await fetch('/api/orders/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: order.id,
                    reason: 'Customer requested cancellation',
                }),
            });

            const data = await response.json();

            if (data.isAfterLockIn) {
                setCancelResult({
                    success: false,
                    message: data.message,
                });
                return;
            }

            if (data.success) {
                setCancelResult({
                    success: true,
                    message: data.message,
                    refunded: data.refunded,
                });
                // Refresh order data
                await fetchOrderDetails();
            } else {
                setCancelResult({
                    success: false,
                    message: data.error || 'Failed to cancel order',
                });
            }
        } catch (error: any) {
            setCancelResult({
                success: false,
                message: error.message || 'Failed to cancel order',
            });
        } finally {
            setCancelLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 border-2 border-emerald-500/20 rounded-full" />
                        <div className="absolute inset-0 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        <div className="absolute inset-2 border border-emerald-500/30 rounded-full animate-ping" />
                    </div>
                    <p className="text-xs uppercase tracking-[0.4em] text-zinc-500 animate-pulse">
                        Retrieving Reservation
                    </p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <div className="w-24 h-24 mx-auto mb-6 bg-zinc-900 rounded-2xl flex items-center justify-center">
                        <ShoppingBag className="w-12 h-12 text-zinc-700" />
                    </div>
                    <h2 className="text-2xl font-serif mb-4 text-white">Order not found</h2>
                    <p className="text-zinc-500 mb-8">This order may have been cancelled or doesn&apos;t exist.</p>
                    <Link
                        href="/browse"
                        className="inline-block px-10 py-4 bg-emerald-500 text-black text-sm font-semibold uppercase tracking-widest hover:bg-emerald-400 transition-all rounded-lg"
                    >
                        Back to Browse
                    </Link>
                </motion.div>
            </div>
        );
    }

    const otpDigits = (order as any).pickup_otp?.split('') || [];

    return (
        <main className="min-h-screen bg-black text-white pt-24 sm:pt-32 pb-24 px-4 relative overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[200px] pointer-events-none" />
            <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[200px] pointer-events-none" />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-emerald-500/5 rounded-full blur-[300px] pointer-events-none" />

            <div className="max-w-5xl mx-auto relative">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3 mb-6"
                        >
                            <div className="relative">
                                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                            </div>
                            <span className="text-[10px] uppercase tracking-[0.4em] text-zinc-500">
                                Successful Reservation
                            </span>
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif leading-tight"
                        >
                            Dignity in Rescue.
                        </motion.h1>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="lg:text-right"
                    >
                        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2">Order Status</p>
                        <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest ${order.status === 'completed' ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' : order.status === 'cancelled' ? 'bg-red-500/20 border border-red-500/30 text-red-400' : 'bg-amber-500/20 border border-amber-500/30 text-amber-400'}`}>
                            <div className={`w-2 h-2 rounded-full ${order.status === 'completed' ? 'bg-emerald-400' : order.status === 'cancelled' ? 'bg-red-400' : 'bg-amber-400 animate-pulse'}`} />
                            {order.status}
                        </div>
                    </motion.div>
                </div>

                <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
                    <div className="lg:col-span-3 space-y-6">
                        {/* Lock-in Deadline Countdown */}
                        {order.rescue_bags?.pickup_start_time && (
                            <LockInCountdown
                                pickupStartTime={order.rescue_bags.pickup_start_time}
                                orderStatus={order.status}
                            />
                        )}

                        {/* Pickup Window Countdown */}
                        {order.rescue_bags?.pickup_end_time && (
                            <CountdownTimer
                                endTime={order.rescue_bags.pickup_end_time}
                                orderStatus={order.status}
                            />
                        )}

                        {/* Premium OTP Card with Rolling Animation */}
                        {(order.status === 'pending' || order.status === 'confirmed' || order.status === 'ready') && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.15 }}
                                className="relative overflow-hidden rounded-2xl"
                            >
                                {/* Gradient border effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/50 via-teal-500/30 to-emerald-500/50 p-[1px] rounded-2xl">
                                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black rounded-2xl" />
                                </div>

                                <div className="relative bg-gradient-to-br from-zinc-900/90 to-black/90 backdrop-blur-xl p-8 sm:p-10 rounded-2xl">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                                <CheckCircle className="w-5 h-5 text-emerald-400" />
                                            </div>
                                            <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-400 font-semibold">
                                                Your Pickup Code
                                            </p>
                                        </div>
                                        <button
                                            onClick={copyOtp}
                                            className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700 rounded-lg transition-all text-zinc-400 hover:text-white"
                                        >
                                            {copied ? (
                                                <>
                                                    <Check className="w-4 h-4 text-emerald-400" />
                                                    <span className="text-xs text-emerald-400">Copied!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-4 h-4" />
                                                    <span className="text-xs">Copy</span>
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {/* Rolling OTP Digits */}
                                    <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4 mb-8">
                                        {otpDigits.map((digit: string, index: number) => (
                                            <RollingDigit
                                                key={index}
                                                digit={digit}
                                                delay={index * 200}
                                            />
                                        ))}
                                    </div>

                                    <p className="text-center text-zinc-400 text-sm">
                                        Share this code with the restaurant to confirm your pickup
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {/* Order Details Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 p-6 sm:p-8 rounded-2xl"
                        >
                            <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
                                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0">
                                    <ShoppingBag className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-500" />
                                </div>
                                <div className="flex-1 text-center sm:text-left">
                                    <h3 className="text-xl sm:text-2xl font-serif mb-1 text-white">
                                        {order.rescue_bags?.title || 'Mystery Bag'}
                                    </h3>
                                    <p className="text-zinc-400 font-light italic mb-4">
                                        From {order.restaurants?.name || 'Restaurant'}
                                    </p>
                                    <div className="flex items-center justify-center sm:justify-start gap-6">
                                        <div>
                                            <p className="text-[9px] uppercase tracking-widest text-zinc-500 mb-1">Total Paid</p>
                                            <p className="text-2xl font-serif text-emerald-400">₹{order.total_price}</p>
                                        </div>
                                        <div className="w-px h-10 bg-zinc-700" />
                                        <div>
                                            <p className="text-[9px] uppercase tracking-widest text-zinc-500 mb-1">Quantity</p>
                                            <p className="text-xl font-serif text-white">{order.quantity}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 pt-8 mt-8 border-t border-zinc-800">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-emerald-400">
                                        <Clock className="w-4 h-4" />
                                        <p className="text-[10px] uppercase tracking-[0.2em] font-semibold">Collection Window</p>
                                    </div>
                                    <p className="text-zinc-300 font-light">
                                        Today, {order.rescue_bags?.pickup_start_time?.slice(0, 5) || '--:--'} - {order.rescue_bags?.pickup_end_time?.slice(0, 5) || '--:--'}
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-emerald-400">
                                        <MapPin className="w-4 h-4" />
                                        <p className="text-[10px] uppercase tracking-[0.2em] font-semibold">Location</p>
                                    </div>
                                    <div>
                                        <p className="text-zinc-300 font-light">{order.restaurants?.name || 'Restaurant'}</p>
                                        <p className="text-zinc-500 text-sm">
                                            {order.restaurants?.address_line1 || ''}{order.restaurants?.city ? `, ${order.restaurants.city}` : ''}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Restaurant Contact */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-emerald-500/5 border border-emerald-500/20 p-6 sm:p-8 rounded-2xl"
                        >
                            <h4 className="text-[11px] uppercase tracking-[0.3em] text-emerald-400 font-semibold mb-6">
                                Need Assistance?
                            </h4>
                            <div className="space-y-5">
                                <a href={`tel:${order.restaurants?.phone}`} className="flex items-center gap-4 group cursor-pointer">
                                    <div className="w-11 h-11 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500 transition-all duration-300">
                                        <Phone className="w-4 h-4 text-emerald-400 group-hover:text-black transition-colors" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] uppercase tracking-widest text-zinc-500 mb-0.5">Call Restaurant</p>
                                        <p className="text-zinc-300 font-light group-hover:text-white transition-colors">
                                            {order.restaurants?.phone || 'N/A'}
                                        </p>
                                    </div>
                                </a>
                                <a href="mailto:support@latebites.in" className="flex items-center gap-4 group cursor-pointer">
                                    <div className="w-11 h-11 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500 transition-all duration-300">
                                        <Mail className="w-4 h-4 text-emerald-400 group-hover:text-black transition-colors" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] uppercase tracking-widest text-zinc-500 mb-0.5">Email Support</p>
                                        <p className="text-zinc-300 font-light group-hover:text-white transition-colors">
                                            support@latebites.in
                                        </p>
                                    </div>
                                </a>
                            </div>
                        </motion.div>

                        {/* Actions */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="space-y-4"
                        >
                            <Link
                                href="/browse"
                                className="group w-full flex items-center justify-center gap-3 py-4 sm:py-5 bg-gradient-to-r from-emerald-500 to-teal-500 text-black text-[11px] uppercase tracking-[0.2em] font-bold hover:from-emerald-400 hover:to-teal-400 transition-all rounded-xl shadow-lg shadow-emerald-500/20"
                            >
                                Continue Rescuing
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                href="/orders"
                                className="w-full flex items-center justify-center py-4 sm:py-5 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-900 text-[11px] uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-all rounded-xl"
                            >
                                View My Rescues
                            </Link>

                            {/* Cancel Order Button - Only for active orders */}
                            {['pending', 'confirmed'].includes(order.status) && (
                                <button
                                    onClick={() => setShowCancelModal(true)}
                                    className="w-full flex items-center justify-center py-4 sm:py-5 border border-red-500/30 hover:border-red-500/50 hover:bg-red-500/10 text-[11px] uppercase tracking-[0.2em] text-red-400 hover:text-red-300 transition-all rounded-xl"
                                >
                                    Cancel Order
                                </button>
                            )}
                        </motion.div>

                        {/* Order ID - Prominent Display */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="text-center pt-6 border-t border-zinc-800"
                        >
                            <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 mb-2">Order Reference</p>
                            <p className="text-lg font-mono font-bold text-emerald-400 tracking-wider">
                                #{order.id.slice(0, 13).toUpperCase()}
                            </p>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Global styles for animations */}
            <style jsx global>{`
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>

            {/* Cancel Order Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-red-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">Cancel Order</h2>
                                    <p className="text-sm text-zinc-500">This action cannot be undone</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowCancelModal(false);
                                    setCancelResult(null);
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-800 transition-colors"
                            >
                                <X className="w-4 h-4 text-zinc-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {cancelResult ? (
                                <div className={`p-4 rounded-lg ${cancelResult.success ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                                    <div className="flex items-start gap-3">
                                        {cancelResult.success ? (
                                            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                        ) : (
                                            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                        )}
                                        <div>
                                            <h4 className={`font-medium ${cancelResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {cancelResult.success ? 'Order Cancelled' : 'Unable to Cancel'}
                                            </h4>
                                            <p className="text-sm text-zinc-400 mt-1">{cancelResult.message}</p>
                                            {cancelResult.refunded && (
                                                <p className="text-sm text-emerald-400 mt-2 flex items-center gap-2">
                                                    <RotateCcw className="w-4 h-4" />
                                                    Refund initiated
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Lock-in warning */}
                                    {checkIsBeforeLockIn() ? (
                                        <div className="bg-emerald-500/10 p-4 rounded-lg mb-4">
                                            <p className="text-sm text-emerald-400">
                                                ✅ You're within the free cancellation period.
                                                {order?.payment_method === 'online' && order?.payment_status === 'paid' && (
                                                    <span className="block mt-1"> A full refund of <strong>₹{order?.total_price}</strong> will be processed.</span>
                                                )}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="bg-amber-500/10 p-4 rounded-lg mb-4">
                                            <p className="text-sm text-amber-400">
                                                ⚠️ The lock-in period has passed. Cancellation may require contacting customer support.
                                            </p>
                                        </div>
                                    )}

                                    <p className="text-zinc-400 text-sm">
                                        Are you sure you want to cancel this order?
                                        {order?.rescue_bags?.title && (
                                            <span className="block mt-2 text-white font-medium">
                                                {order.rescue_bags.title} from {order?.restaurants?.name}
                                            </span>
                                        )}
                                    </p>
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-800">
                            {cancelResult ? (
                                <button
                                    onClick={() => {
                                        setShowCancelModal(false);
                                        setCancelResult(null);
                                    }}
                                    className="px-6 py-2.5 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
                                >
                                    Close
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setShowCancelModal(false)}
                                        className="px-6 py-2.5 text-zinc-400 hover:text-white transition-colors"
                                    >
                                        Keep Order
                                    </button>
                                    <button
                                        onClick={handleCancelOrder}
                                        disabled={cancelLoading}
                                        className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {cancelLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            'Yes, Cancel Order'
                                        )}
                                    </button>
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </main >
    );
}
