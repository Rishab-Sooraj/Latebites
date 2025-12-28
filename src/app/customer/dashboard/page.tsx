"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import {
    ShoppingBag,
    TrendingUp,
    Package,
    Leaf,
    ArrowRight,
    User,
    HelpCircle,
} from "lucide-react";

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
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!customer) {
        return null;
    }

    const stats = [
        { label: "Active Orders", value: "0", icon: ShoppingBag },
        { label: "Total Savings", value: "₹0", icon: TrendingUp },
        { label: "Bags Rescued", value: "0", icon: Package },
        { label: "CO₂ Saved", value: "0 kg", icon: Leaf },
    ];

    const quickActions = [
        {
            title: "My Orders",
            description: "View your order history and track active pickups",
            href: "/orders",
            icon: ShoppingBag,
        },
        {
            title: "My Profile",
            description: "Manage your account settings and preferences",
            href: "/profile",
            icon: User,
        },
        {
            title: "Help & Support",
            description: "Get help with orders, payments, and more",
            href: "/help",
            icon: HelpCircle,
        },
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section - Minimalist */}
            <section className="border-b border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-3xl"
                    >
                        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-6">
                            Dashboard
                        </p>
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-light leading-tight mb-6">
                            Welcome back, {customer.name.split(" ")[0]}.
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground font-light leading-relaxed">
                            Discover surplus food from nearby restaurants and make a difference, one rescue bag at a time.
                        </p>
                    </motion.div>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
                {/* Stats Grid - Minimal */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-24">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * index, duration: 0.6 }}
                            className="space-y-3"
                        >
                            <stat.icon className="w-5 h-5 text-muted-foreground" />
                            <p className="text-3xl md:text-4xl font-serif font-light">
                                {stat.value}
                            </p>
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                {stat.label}
                            </p>
                        </motion.div>
                    ))}
                </div>

                {/* Main CTA - Minimal */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    onClick={() => router.push("/browse")}
                    className="border border-border hover:border-foreground/20 transition-colors cursor-pointer p-12 md:p-16 mb-24 group"
                >
                    <div className="max-w-2xl">
                        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">
                            Nearby
                        </p>
                        <h2 className="text-3xl md:text-5xl font-serif font-light mb-6">
                            Discover Rescue Bags
                        </h2>
                        <p className="text-lg text-muted-foreground font-light leading-relaxed mb-8">
                            Browse surplus food from restaurants near you. Save money while reducing food waste.
                        </p>
                        <div className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.3em] group-hover:gap-3 transition-all">
                            Start Browsing
                            <ArrowRight className="w-4 h-4" />
                        </div>
                    </div>
                </motion.div>

                {/* Quick Actions - Minimal Grid */}
                <div className="grid md:grid-cols-3 gap-8">
                    {quickActions.map((action, index) => (
                        <motion.button
                            key={action.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 + index * 0.1 }}
                            onClick={() => router.push(action.href)}
                            className="border border-border hover:border-foreground/20 transition-colors p-8 text-left group"
                        >
                            <action.icon className="w-5 h-5 text-muted-foreground mb-6" />
                            <h3 className="text-xl md:text-2xl font-serif font-light mb-3">
                                {action.title}
                            </h3>
                            <p className="text-sm text-muted-foreground font-light leading-relaxed mb-4">
                                {action.description}
                            </p>
                            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground group-hover:gap-3 transition-all">
                                View
                                <ArrowRight className="w-3 h-3" />
                            </div>
                        </motion.button>
                    ))}
                </div>
            </div>
        </div>
    );
}
