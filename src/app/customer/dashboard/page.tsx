"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import {
    ShoppingBag,
    TrendingUp,
    Sparkles,
    ArrowRight,
    MapPin,
    User,
    HelpCircle,
    Package,
    Leaf,
} from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";

export default function CustomerDashboard() {
    const { customer, loading, role } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && role !== "customer") {
            router.push("/");
        }
    }, [loading, role, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
        );
    }

    if (!customer) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
            {/* Premium Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 text-white">
                {/* Animated background pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                        backgroundSize: '40px 40px'
                    }} />
                </div>

                {/* Floating orbs */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    className="absolute top-20 right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1,
                    }}
                    className="absolute bottom-20 left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"
                />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="w-6 h-6" />
                            <span className="text-sm uppercase tracking-widest font-semibold">
                                Dashboard
                            </span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-serif italic mb-4">
                            Welcome back, {customer.name.split(" ")[0]}!
                        </h1>
                        <p className="text-xl text-orange-100 max-w-2xl">
                            Discover surplus food from nearby restaurants and make a difference, one rescue bag at a time.
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 pb-16">
                {/* Premium Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <StatsCard
                        icon={ShoppingBag}
                        label="Active Orders"
                        value={0}
                        color="orange"
                        delay={0.1}
                    />
                    <StatsCard
                        icon={TrendingUp}
                        label="Total Savings"
                        value={0}
                        prefix="₹"
                        color="green"
                        delay={0.2}
                    />
                    <StatsCard
                        icon={Package}
                        label="Bags Rescued"
                        value={0}
                        color="blue"
                        delay={0.3}
                    />
                    <StatsCard
                        icon={Leaf}
                        label="CO₂ Saved"
                        value={0}
                        suffix=" kg"
                        color="purple"
                        delay={0.4}
                    />
                </div>

                {/* Main CTA Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    onClick={() => router.push("/browse")}
                    className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-3xl p-10 mb-12 shadow-2xl relative overflow-hidden group cursor-pointer hover:shadow-3xl transition-all duration-300"
                >
                    {/* Animated background */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0" style={{
                            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                            backgroundSize: '30px 30px'
                        }} />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-4">
                                    <MapPin className="w-5 h-5 text-white" />
                                    <span className="text-xs uppercase tracking-widest text-orange-100 font-semibold">
                                        Nearby
                                    </span>
                                </div>
                                <h2 className="text-4xl font-serif italic text-white mb-4">
                                    Discover Rescue Bags
                                </h2>
                                <p className="text-orange-100 mb-8 max-w-lg text-lg">
                                    Browse surplus food from restaurants near you. Save money while reducing food waste.
                                </p>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="inline-flex items-center gap-2 bg-white text-orange-600 px-8 py-4 rounded-xl font-semibold hover:bg-orange-50 transition-colors shadow-lg"
                                >
                                    Start Browsing
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </motion.button>
                            </div>
                            <motion.div
                                animate={{ rotate: [0, 10, 0] }}
                                transition={{ duration: 4, repeat: Infinity }}
                            >
                                <MapPin className="w-32 h-32 text-white/20" />
                            </motion.div>
                        </div>
                    </div>
                </motion.div>

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        onClick={() => router.push("/orders")}
                        whileHover={{ y: -5 }}
                        className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all text-left group border-2 border-transparent hover:border-orange-200"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="p-4 bg-orange-100 rounded-xl group-hover:bg-orange-200 transition-colors">
                                <ShoppingBag className="w-7 h-7 text-orange-600" />
                            </div>
                            <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
                        </div>
                        <h3 className="text-2xl font-serif italic mb-2 text-gray-900">My Orders</h3>
                        <p className="text-gray-600">
                            View your order history and track active pickups
                        </p>
                    </motion.button>

                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        onClick={() => router.push("/profile")}
                        whileHover={{ y: -5 }}
                        className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all text-left group border-2 border-transparent hover:border-blue-200"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="p-4 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                                <User className="w-7 h-7 text-blue-600" />
                            </div>
                            <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                        </div>
                        <h3 className="text-2xl font-serif italic mb-2 text-gray-900">My Profile</h3>
                        <p className="text-gray-600">
                            Manage your account settings and preferences
                        </p>
                    </motion.button>

                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        onClick={() => router.push("/help")}
                        whileHover={{ y: -5 }}
                        className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all text-left group border-2 border-transparent hover:border-purple-200"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="p-4 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                                <HelpCircle className="w-7 h-7 text-purple-600" />
                            </div>
                            <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                        </div>
                        <h3 className="text-2xl font-serif italic mb-2 text-gray-900">Help & Support</h3>
                        <p className="text-gray-600">
                            Get help with orders, payments, and more
                        </p>
                    </motion.button>
                </div>
            </div>
        </div>
    );
}
