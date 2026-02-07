"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle, Clock, MapPin, Copy, Home, ShoppingBag, AlertCircle } from "lucide-react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";

interface Order {
    id: string;
    quantity: number;
    total_price: number;
    status: string;
    payment_method: string;
    payment_status: string;
    pickup_otp: string;
    created_at: string;
    rescue_bags: {
        id: string;
        title: string;
        pickup_start_time: string;
        pickup_end_time: string;
        size: string;
    };
    restaurants: {
        id: string;
        name: string;
        address_line1: string;
        city: string;
        phone: string;
    };
}

function OrderSuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { customer, loading: authLoading } = useAuth();

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    const supabase = createClient();

    useEffect(() => {
        const orderId = searchParams.get('orderId');
        if (orderId) {
            fetchOrderDetails(orderId);
        } else {
            setLoading(false);
        }
    }, [searchParams]);

    const fetchOrderDetails = async (orderId: string) => {
        try {
            const { data, error } = await supabase
                .from("orders")
                .select(`
                    *,
                    rescue_bags (id, title, pickup_start_time, pickup_end_time, size),
                    restaurants (id, name, address_line1, city, phone)
                `)
                .eq("id", orderId)
                .single();

            if (error) throw error;
            setOrder(data as Order);
        } catch (error) {
            console.error("Error fetching order:", error);
            toast.error("Failed to load order details");
        } finally {
            setLoading(false);
        }
    };

    const copyOtp = () => {
        if (order?.pickup_otp) {
            navigator.clipboard.writeText(order.pickup_otp);
            toast.success("OTP copied to clipboard!");
        }
    };

    if (loading || authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Order not found</h1>
                <p className="text-gray-500 mb-6">We couldn't find this order.</p>
                <Link href="/browse" className="px-6 py-3 bg-[#0B1E0F] text-white rounded-xl font-medium">
                    Browse Bags
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
            <Toaster position="top-center" />

            <main className="max-w-lg mx-auto px-4 py-8">
                {/* Success Animation */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="flex justify-center mb-8"
                >
                    <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring" }}
                        >
                            <CheckCircle className="w-12 h-12 text-emerald-600" />
                        </motion.div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
                    <p className="text-gray-500">
                        {order.payment_method === 'online' ? 'Payment successful' : 'Pay at pickup'}
                    </p>
                </motion.div>

                {/* OTP Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg mb-6"
                >
                    <div className="text-center">
                        <p className="text-gray-500 mb-2">Your Pickup OTP</p>
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <span className="text-3xl sm:text-4xl font-bold tracking-[0.35em] sm:tracking-[0.5em] text-gray-900">
                                {order.pickup_otp}
                            </span>
                            <button
                                onClick={copyOtp}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <Copy className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <p className="text-sm text-gray-500">
                            Show this OTP to the restaurant staff when picking up your bag
                        </p>
                    </div>
                </motion.div>

                {/* Order Details */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white rounded-2xl p-6 border border-gray-100 mb-6"
                >
                    <h2 className="font-bold text-gray-900 mb-4">Order Details</h2>

                    <div className="flex items-start gap-4 mb-4 pb-4 border-b border-gray-100">
                        <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <ShoppingBag className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{order.rescue_bags.title}</h3>
                            <p className="text-sm text-gray-500">Quantity: {order.quantity}</p>
                            <p className="text-sm font-medium text-emerald-600 mt-1">₹{order.total_price}</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <Clock className="w-5 h-5 text-emerald-600 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-500">Pickup Time</p>
                                <p className="font-medium text-gray-900">
                                    {order.rescue_bags.pickup_start_time.slice(0, 5)} - {order.rescue_bags.pickup_end_time.slice(0, 5)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-emerald-600 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-500">Pickup Location</p>
                                <p className="font-medium text-gray-900">{order.restaurants.name}</p>
                                <p className="text-sm text-gray-500">
                                    {order.restaurants.address_line1}, {order.restaurants.city}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-3"
                >
                    <Link
                        href="/help"
                        className="block w-full py-4 bg-[#0B1E0F] text-white font-bold rounded-xl text-center hover:bg-[#142318] transition-colors"
                    >
                        View My Orders
                    </Link>
                    <Link
                        href="/browse"
                        className="block w-full py-4 bg-gray-100 text-gray-900 font-medium rounded-xl text-center hover:bg-gray-200 transition-colors"
                    >
                        <span className="flex items-center justify-center gap-2">
                            <Home className="w-5 h-5" />
                            Continue Browsing
                        </span>
                    </Link>
                </motion.div>

                {/* Order ID */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="text-center text-sm text-gray-400 mt-8"
                >
                    Order ID: {order.id.slice(0, 8)}...
                </motion.p>
            </main>
        </div>
    );
}

export default function OrderSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
            </div>
        }>
            <OrderSuccessContent />
        </Suspense>
    );
}
