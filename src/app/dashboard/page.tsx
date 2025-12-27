"use client";

import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import Link from "next/link";
import { ShoppingBag, Heart, TrendingUp, Leaf } from "lucide-react";

export default function DashboardPage() {
    const { customer } = useAuth();

    return (
        <main className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50 pt-24 pb-12 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Welcome Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <h1 className="text-4xl md:text-5xl font-serif mb-2">
                        Welcome back, {customer?.name}
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Your impact on reducing food waste
                    </p>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {[
                        {
                            icon: ShoppingBag,
                            label: "Bags Rescued",
                            value: "0",
                            color: "text-primary",
                        },
                        {
                            icon: Heart,
                            label: "Favorites",
                            value: "0",
                            color: "text-red-500",
                        },
                        {
                            icon: TrendingUp,
                            label: "Money Saved",
                            value: "₹0",
                            color: "text-green-500",
                        },
                        {
                            icon: Leaf,
                            label: "CO₂ Reduced",
                            value: "0kg",
                            color: "text-teal-500",
                        },
                    ].map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white border border-primary/10 rounded-sm p-6"
                        >
                            <stat.icon className={`w-8 h-8 ${stat.color} mb-4`} />
                            <p className="text-3xl font-bold mb-1">{stat.value}</p>
                            <p className="text-sm text-muted-foreground">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white border border-primary/10 rounded-sm p-8 mb-12"
                >
                    <h2 className="text-2xl font-serif mb-6">Quick Actions</h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        <Link
                            href="/browse"
                            className="p-6 border border-primary/20 rounded-sm hover:border-primary hover:bg-primary/5 transition-all text-center"
                        >
                            <ShoppingBag className="w-8 h-8 mx-auto mb-3 text-primary" />
                            <p className="font-medium">Browse Bags</p>
                        </Link>
                        <Link
                            href="/orders"
                            className="p-6 border border-primary/20 rounded-sm hover:border-primary hover:bg-primary/5 transition-all text-center"
                        >
                            <ShoppingBag className="w-8 h-8 mx-auto mb-3 text-primary" />
                            <p className="font-medium">My Orders</p>
                        </Link>
                        <Link
                            href="/profile"
                            className="p-6 border border-primary/20 rounded-sm hover:border-primary hover:bg-primary/5 transition-all text-center"
                        >
                            <ShoppingBag className="w-8 h-8 mx-auto mb-3 text-primary" />
                            <p className="font-medium">Profile Settings</p>
                        </Link>
                    </div>
                </motion.div>

                {/* Recent Activity */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white border border-primary/10 rounded-sm p-8"
                >
                    <h2 className="text-2xl font-serif mb-6">Recent Activity</h2>
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No recent activity yet</p>
                        <Link
                            href="/browse"
                            className="inline-block mt-4 text-primary hover:underline"
                        >
                            Start rescuing food →
                        </Link>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
