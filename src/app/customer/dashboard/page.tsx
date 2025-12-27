"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Search, ShoppingBag, TrendingUp, Sparkles, ArrowRight, MapPin } from "lucide-react";

export default function CustomerDashboard() {
    const { customer, loading, role } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && role !== 'customer') {
            router.push('/');
        }
    }, [loading, role, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!customer) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-r from-primary via-cyan-600 to-teal-600 text-white">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="w-6 h-6" />
                            <span className="text-sm uppercase tracking-widest font-medium">Dashboard</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-serif italic mb-4">
                            Welcome back, {customer.name.split(' ')[0]}!
                        </h1>
                        <p className="text-lg text-cyan-100 max-w-2xl">
                            Discover surplus food from nearby restaurants and make a difference, one rescue bag at a time.
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 pb-16">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white/80 backdrop-blur-sm rounded-sm border border-primary/10 p-6 shadow-lg hover:shadow-xl transition-shadow"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-orange-100 rounded-sm">
                                <ShoppingBag className="w-6 h-6 text-orange-600" />
                            </div>
                            <span className="text-xs uppercase tracking-widest text-muted-foreground">Active</span>
                        </div>
                        <p className="text-3xl font-serif italic text-primary mb-1">0</p>
                        <p className="text-sm text-muted-foreground">Active Orders</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white/80 backdrop-blur-sm rounded-sm border border-primary/10 p-6 shadow-lg hover:shadow-xl transition-shadow"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-green-100 rounded-sm">
                                <TrendingUp className="w-6 h-6 text-green-600" />
                            </div>
                            <span className="text-xs uppercase tracking-widest text-muted-foreground">Saved</span>
                        </div>
                        <p className="text-3xl font-serif italic text-primary mb-1">₹0</p>
                        <p className="text-sm text-muted-foreground">Total Savings</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white/80 backdrop-blur-sm rounded-sm border border-primary/10 p-6 shadow-lg hover:shadow-xl transition-shadow"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-blue-100 rounded-sm">
                                <Sparkles className="w-6 h-6 text-blue-600" />
                            </div>
                            <span className="text-xs uppercase tracking-widest text-muted-foreground">Impact</span>
                        </div>
                        <p className="text-3xl font-serif italic text-primary mb-1">0</p>
                        <p className="text-sm text-muted-foreground">Bags Rescued</p>
                    </motion.div>
                </div>

                {/* Main Action Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-sm p-8 mb-8 shadow-xl relative overflow-hidden group cursor-pointer"
                    onClick={() => router.push('/browse')}
                >
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
                    <div className="relative z-10">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                    <MapPin className="w-5 h-5 text-white" />
                                    <span className="text-xs uppercase tracking-widest text-orange-100">Nearby</span>
                                </div>
                                <h2 className="text-3xl font-serif italic text-white mb-3">
                                    Discover Rescue Bags
                                </h2>
                                <p className="text-orange-100 mb-6 max-w-lg">
                                    Browse surplus food from restaurants near you. Save money while reducing food waste.
                                </p>
                                <button className="inline-flex items-center gap-2 bg-white text-orange-600 px-6 py-3 rounded-sm font-medium hover:bg-orange-50 transition-colors group-hover:gap-3 transition-all">
                                    Start Browsing
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                            <Search className="w-24 h-24 text-white/20 group-hover:text-white/30 transition-colors" />
                        </div>
                    </div>
                </motion.div>

                {/* Quick Links */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                    <button
                        onClick={() => router.push('/orders')}
                        className="bg-white/80 backdrop-blur-sm rounded-sm border border-primary/10 p-6 shadow-lg hover:shadow-xl transition-all text-left group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-primary/10 rounded-sm group-hover:bg-primary/20 transition-colors">
                                <ShoppingBag className="w-6 h-6 text-primary" />
                            </div>
                            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <h3 className="text-xl font-serif italic mb-2">My Orders</h3>
                        <p className="text-sm text-muted-foreground">
                            View your order history and track active pickups
                        </p>
                    </button>

                    <button
                        onClick={() => router.push('/profile')}
                        className="bg-white/80 backdrop-blur-sm rounded-sm border border-primary/10 p-6 shadow-lg hover:shadow-xl transition-all text-left group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-primary/10 rounded-sm group-hover:bg-primary/20 transition-colors">
                                <Sparkles className="w-6 h-6 text-primary" />
                            </div>
                            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <h3 className="text-xl font-serif italic mb-2">My Profile</h3>
                        <p className="text-sm text-muted-foreground">
                            Manage your account settings and preferences
                        </p>
                    </button>
                </motion.div>
            </div>
        </div>
    );
}
