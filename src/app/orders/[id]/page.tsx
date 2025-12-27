"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle, MapPin, Clock, Phone, Mail, ShoppingBag, Leaf, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Database } from "@/types/database";

type Order = Database['public']['Tables']['orders']['Row'] & {
    rescue_bags: Database['public']['Tables']['rescue_bags']['Row'];
    restaurants: Database['public']['Tables']['restaurants']['Row'];
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
            <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading order...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground/40" />
                    <h2 className="text-2xl font-serif mb-2">Order not found</h2>
                    <Link
                        href="/orders"
                        className="inline-block px-6 py-3 bg-primary text-primary-foreground text-sm uppercase tracking-widest hover:opacity-90 transition-opacity rounded-sm mt-4"
                    >
                        View All Orders
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50 pt-24 pb-12 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Success Header */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6">
                        <CheckCircle className="w-12 h-12 text-primary" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-serif mb-4">
                        Reservation Confirmed!
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Your rescue bag is ready for pickup
                    </p>
                </motion.div>

                {/* Order Details Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/80 backdrop-blur-sm rounded-lg border border-primary/10 overflow-hidden mb-6"
                >
                    {/* Order Header */}
                    <div className="bg-primary/5 p-6 border-b border-primary/10">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Order ID</p>
                                <p className="font-mono text-sm">{order.id.slice(0, 8)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-muted-foreground mb-1">Status</p>
                                <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full capitalize">
                                    {order.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Bag Details */}
                    <div className="p-6 border-b border-primary/10">
                        <h3 className="text-lg font-serif mb-4">Your Rescue Bag</h3>
                        <div className="flex gap-4">
                            <div className="w-24 h-24 bg-gradient-to-br from-cyan-100 to-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <ShoppingBag className="w-10 h-10 text-primary/40" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-medium mb-1">{order.rescue_bags.title}</h4>
                                <p className="text-sm text-muted-foreground mb-2">
                                    {order.restaurants.name}
                                </p>
                                <div className="flex items-center gap-4">
                                    <span className="text-2xl font-bold text-primary">
                                        ₹{order.total_price}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        Quantity: {order.quantity}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pickup Details */}
                    <div className="p-6">
                        <h3 className="text-lg font-serif mb-4">Pickup Information</h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Clock className="w-5 h-5 text-primary mt-0.5" />
                                <div>
                                    <p className="font-medium mb-1">Pickup Time</p>
                                    <p className="text-sm text-muted-foreground">
                                        Today, {order.rescue_bags.pickup_start_time.slice(0, 5)} - {order.rescue_bags.pickup_end_time.slice(0, 5)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-primary mt-0.5" />
                                <div>
                                    <p className="font-medium mb-1">{order.restaurants.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {order.restaurants.address}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Phone className="w-5 h-5 text-primary mt-0.5" />
                                <div>
                                    <p className="font-medium mb-1">Restaurant Contact</p>
                                    <p className="text-sm text-muted-foreground">
                                        {order.restaurants.phone}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="bg-yellow-50/50 p-6 border-t border-primary/10">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-lg">💰</span>
                            </div>
                            <div>
                                <p className="font-medium mb-1">Payment Method</p>
                                <p className="text-sm text-muted-foreground">
                                    Pay at pickup • Cash or UPI accepted
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Impact Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-primary/10 to-teal-100/50 p-6 rounded-lg border border-primary/20 mb-6"
                >
                    <h3 className="text-lg font-serif mb-4 flex items-center gap-2">
                        <Leaf className="w-5 h-5 text-primary" />
                        Your Impact
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-white/50 rounded-lg">
                            <p className="text-3xl font-bold text-primary mb-1">2.5kg</p>
                            <p className="text-xs text-muted-foreground">Food saved from waste</p>
                        </div>
                        <div className="text-center p-4 bg-white/50 rounded-lg">
                            <p className="text-3xl font-bold text-primary mb-1">3.2kg</p>
                            <p className="text-xs text-muted-foreground">CO₂ emissions prevented</p>
                        </div>
                    </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex gap-4"
                >
                    <Link
                        href="/browse"
                        className="flex-1 py-4 bg-primary text-primary-foreground text-center text-sm uppercase tracking-widest hover:opacity-90 transition-opacity rounded-sm font-medium"
                    >
                        Browse More Bags
                    </Link>
                    <Link
                        href="/orders"
                        className="flex-1 py-4 border-2 border-primary text-primary text-center text-sm uppercase tracking-widest hover:bg-primary/5 transition-colors rounded-sm font-medium"
                    >
                        View All Orders
                    </Link>
                </motion.div>

                {/* Help Text */}
                <p className="text-center text-sm text-muted-foreground mt-8">
                    Questions? Contact the restaurant directly or{" "}
                    <Link href="/support" className="text-primary hover:underline">
                        reach out to support
                    </Link>
                </p>
            </div>
        </main>
    );
}
