"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Clock, MapPin, ChevronRight, Utensils, History, ArrowLeft, Loader2, Navigation, Heart, Star, Sparkles } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/Header";
import { Toaster } from "react-hot-toast";

export default function OrdersPage() {
    const { customer, loading: authLoading } = useAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const supabase = createClient();

    useEffect(() => {
        if (customer) {
            fetchOrders();
        } else if (!authLoading) {
            setLoading(false);
        }
    }, [customer, authLoading]);

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
            setOrders(data || []);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
            case "cancelled": return "bg-red-500/10 text-red-600 border-red-500/20";
            case "pending": return "bg-amber-500/10 text-amber-600 border-amber-500/20";
            default: return "bg-gray-100 text-gray-600 border-gray-200";
        }
    };

    return (
        <div className="relative min-h-screen bg-[#F7F4EB] selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
            <Toaster />
            <Header />

            {/* Premium Dynamic Background */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 15, repeat: Infinity }}
                    className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-[#0B1E0F]/20 via-[#001220]/10 to-transparent blur-[100px]"
                />
                <motion.div
                    animate={{ scale: [1.1, 1, 1.1], opacity: [0.05, 0.15, 0.05] }}
                    transition={{ duration: 20, repeat: Infinity }}
                    className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tl from-[#001220]/15 via-[#0B1E0F]/10 to-transparent blur-[100px]"
                />
            </div>

            <main className="pt-32 pb-24 relative px-4 sm:px-6 lg:px-12">
                <div className="max-w-5xl mx-auto">
                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-16">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-[#001220] text-[#F7F4EB] flex items-center justify-center shadow-xl">
                                    <History className="w-5 h-5" />
                                </div>
                                <p className="text-[10px] uppercase tracking-[0.4em] font-black text-[#0B1E0F]">Mission History</p>
                            </div>
                            <h1 className="text-5xl md:text-6xl font-serif leading-tight">Your <span className="italic">Rescues</span></h1>
                            <p className="text-[#0B1E0F]/60 font-light text-lg tracking-wide max-w-md">Every mystery bag here represents a step towards a zero-waste city.</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Link 
                                href="/browse"
                                className="group flex items-center gap-4 px-8 py-4 bg-white border border-[#0B1E0F]/10 rounded-2xl hover:border-[#0B1E0F]/40 hover:shadow-2xl transition-all duration-500"
                            >
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-[#0B1E0F]" />
                                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0B1E0F]">New Rescue Mission</span>
                            </Link>
                        </motion.div>
                    </div>

                    {loading ? (
                        <div className="py-32 flex flex-col items-center justify-center">
                            <Loader2 className="w-12 h-12 text-primary animate-spin mb-6" />
                            <p className="text-[10px] uppercase tracking-[0.4em] font-black text-muted-foreground">Decrypting Records...</p>
                        </div>
                    ) : orders.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6">
                            {orders.map((order, index) => (
                                <motion.div
                                    key={order.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                                >
                                    <Link
                                        href={`/orders/${order.id}`}
                                        className="group block bg-white rounded-[40px] border border-primary/5 hover:border-primary/20 transition-all duration-700 overflow-hidden hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] relative"
                                    >
                                        <div className="p-8 md:p-10 flex flex-col md:flex-row gap-10 items-center">
                                            <div className="relative">
                                                <div className="w-24 h-24 md:w-32 md:h-32 rounded-[32px] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden shadow-inner group-hover:scale-105 transition-transform duration-700">
                                                    {order.restaurants?.profile_image_url ? (
                                                        <img src={order.restaurants.profile_image_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Utensils className="w-10 h-10 text-primary/20" />
                                                    )}
                                                </div>
                                                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-black rounded-2xl flex items-center justify-center shadow-2xl text-white">
                                                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                                                </div>
                                            </div>

                                            <div className="flex-1 space-y-6 text-center md:text-left">
                                                <div>
                                                    <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2 justify-center md:justify-start">
                                                        <span className={`w-fit mx-auto md:mx-0 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${getStatusColor(order.status)}`}>
                                                            {order.status}
                                                        </span>
                                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                                            {new Date(order.created_at).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                    <h3 className="text-3xl font-serif group-hover:text-primary transition-colors duration-500">{order.rescue_bags?.title}</h3>
                                                    <p className="text-muted-foreground font-light tracking-wide italic">{order.restaurants?.name}</p>
                                                </div>

                                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-xs font-medium text-gray-500">
                                                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl">
                                                        <Clock className="w-3.5 h-3.5 text-primary" />
                                                        <span>{order.rescue_bags?.pickup_start_time.slice(0, 5)} - {order.rescue_bags?.pickup_end_time.slice(0, 5)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl max-w-[200px]">
                                                        <MapPin className="w-3.5 h-3.5 text-primary" />
                                                        <span className="truncate">{order.restaurants?.address_line1}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-center md:items-end gap-4 min-w-[140px]">
                                                <div className="text-center md:text-right">
                                                    <p className="text-[9px] uppercase tracking-[0.3em] font-black text-muted-foreground mb-1">Impact Value</p>
                                                    <p className="text-3xl font-serif font-black text-black">₹{order.total_price}</p>
                                                </div>
                                                <div className="w-14 h-14 rounded-2xl bg-gray-50 group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-all duration-500">
                                                    <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-[48px] p-20 border border-primary/5 shadow-2xl text-center space-y-10"
                        >
                            <div className="w-32 h-32 bg-primary/5 rounded-full flex items-center justify-center mx-auto relative">
                                <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping opacity-20" />
                                <ShoppingBag className="w-12 h-12 text-primary/30" />
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-4xl font-serif">The archive is empty.</h2>
                                <p className="text-muted-foreground font-light text-lg tracking-wide max-w-sm mx-auto">You haven't initiated any rescue missions yet. Start saving surplus today.</p>
                            </div>
                            <Link 
                                href="/browse"
                                className="inline-flex items-center justify-center gap-4 px-12 py-6 bg-black text-white text-[11px] uppercase tracking-[0.4em] font-black rounded-2xl hover:bg-primary hover:shadow-2xl transition-all duration-500 group"
                            >
                                <span>Begin First Mission</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </motion.div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="py-12 px-10 border-t border-primary/5 bg-white/30 backdrop-blur-md">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-serif text-sm">L</div>
                        <p className="text-[11px] uppercase tracking-[0.3em] font-black text-black">Latebites <span className="text-muted-foreground font-light ml-2">Manifesto 2024</span></p>
                    </div>
                    <div className="flex gap-8">
                        <Link href="/help" className="text-[10px] uppercase tracking-[0.2em] font-bold hover:text-primary transition-colors">Concierge</Link>
                        <Link href="/profile" className="text-[10px] uppercase tracking-[0.2em] font-bold hover:text-primary transition-colors">Privacy Protocol</Link>
                    </div>
                    <p className="text-[10px] text-muted-foreground/60 tracking-widest uppercase">Encrypted & Secured</p>
                </div>
            </footer>
        </div>
    );
}
