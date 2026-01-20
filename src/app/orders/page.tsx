"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { ShoppingBag, Clock, MapPin, ChevronRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Order = Database['public']['Tables']['orders']['Row'] & {
    rescue_bags: Database['public']['Tables']['rescue_bags']['Row'];
    restaurants: Database['public']['Tables']['restaurants']['Row'];
};

export default function OrdersPage() {
    const { customer } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const supabase = createClient();

    useEffect(() => {
        if (customer) {
            fetchOrders();
        }
    }, [customer]);

    const fetchOrders = async () => {
        try {
            const { data, error } = await supabase
                .from("orders")
                .select(`
          *,
          rescue_bags (*),
          restaurants (*)
        `)
                .eq("customer_id", customer?.id)
                .order("created_at", { ascending: false });

            if (error) throw error;

            setOrders(data as Order[]);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed":
                return "bg-green-100 text-green-700";
            case "cancelled":
                return "bg-red-100 text-red-700";
            case "pending":
                return "bg-yellow-100 text-yellow-700";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50 pt-24 pb-12 px-4">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <h1 className="text-4xl md:text-5xl font-serif mb-2">My Orders</h1>
                    <p className="text-lg text-muted-foreground">
                        Track your rescue bag orders
                    </p>
                </motion.div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : orders.length > 0 ? (
                    <div className="space-y-4">
                        {orders.map((order, index) => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Link
                                    href={`/orders/${order.id}`}
                                    className="block bg-white/80 backdrop-blur-sm rounded-lg border border-primary/10 p-6 hover:shadow-lg transition-shadow group"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">
                                                {new Date(order.created_at).toLocaleDateString("en-IN", {
                                                    day: "numeric",
                                                    month: "long",
                                                    year: "numeric",
                                                })}
                                            </p>
                                            <p className="font-mono text-xs text-muted-foreground">
                                                Order #{order.id.slice(0, 8)}
                                            </p>
                                        </div>
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(
                                                order.status
                                            )}`}
                                        >
                                            {order.status}
                                        </span>
                                    </div>

                                    <div className="flex gap-4 mb-4">
                                        <div className="w-20 h-20 bg-gradient-to-br from-cyan-100 to-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <ShoppingBag className="w-8 h-8 text-primary/40" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium mb-1 group-hover:text-primary transition-colors">
                                                {order.rescue_bags.title}
                                            </h3>
                                            <p className="text-sm text-muted-foreground mb-2">
                                                {order.restaurants.name}
                                            </p>
                                            <p className="text-lg font-bold text-primary">
                                                ₹{order.total_price}
                                            </p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                    </div>

                                    <div className="flex items-center gap-6 text-sm text-muted-foreground pt-4 border-t border-primary/10">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            <span>
                                                {order.rescue_bags.pickup_start_time.slice(0, 5)} -{" "}
                                                {order.rescue_bags.pickup_end_time.slice(0, 5)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4" />
                                            <span className="truncate">{order.restaurants.address}</span>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white border border-primary/10 rounded-sm p-12 text-center"
                    >
                        <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground/40" />
                        <h2 className="text-2xl font-serif mb-2">No orders yet</h2>
                        <p className="text-muted-foreground mb-6">
                            Start rescuing food to see your orders here
                        </p>
                        <Link
                            href="/browse"
                            className="inline-block px-6 py-3 bg-primary text-primary-foreground text-sm uppercase tracking-widest hover:opacity-90 transition-opacity rounded-sm"
                        >
                            Browse Rescue Bags
                        </Link>
                    </motion.div>
                )}
            </div>
        </main>
    );
}
