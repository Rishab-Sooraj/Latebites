"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Clock, MapPin, ChevronRight, User, Settings, ShieldCheck, Heart } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function MyActivity() {
  const { customer } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');
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
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!customer) return null;

  return (
    <section id="my-activity" className="py-24 px-4 sm:px-6 lg:px-12 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[120px] -z-10" />
      
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-16">
          {/* Sidebar Tabs */}
          <div className="w-full md:w-64 space-y-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <h2 className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Personal Hub</h2>
            </div>
            
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center gap-4 px-6 py-5 rounded-sm transition-all duration-500 group ${activeTab === 'orders' ? 'bg-primary text-primary-foreground shadow-2xl shadow-primary/20 scale-[1.02]' : 'hover:bg-primary/5 border border-transparent hover:border-primary/10'}`}
            >
              <ShoppingBag className={`w-4 h-4 ${activeTab === 'orders' ? '' : 'text-primary'}`} />
              <span className="text-[10px] uppercase tracking-widest font-semibold">My Rescues</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-4 px-6 py-5 rounded-sm transition-all duration-500 group ${activeTab === 'profile' ? 'bg-primary text-primary-foreground shadow-2xl shadow-primary/20 scale-[1.02]' : 'hover:bg-primary/5 border border-transparent hover:border-primary/10'}`}
            >
              <User className={`w-4 h-4 ${activeTab === 'profile' ? '' : 'text-primary'}`} />
              <span className="text-[10px] uppercase tracking-widest font-semibold">Account Hub</span>
            </button>
            
            <div className="pt-12 space-y-6 opacity-40 grayscale pointer-events-none">
                <div className="flex items-center gap-3 text-[9px] uppercase tracking-widest">
                    <ShieldCheck className="w-3 h-3" />
                    Verified Member
                </div>
                <div className="flex items-center gap-3 text-[9px] uppercase tracking-widest">
                    <Heart className="w-3 h-3" />
                    Elite Rescuer
                </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-h-[400px]">
            <AnimatePresence mode="wait">
              {activeTab === 'orders' ? (
                <motion.div
                  key="orders"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-end mb-8">
                    <h3 className="text-2xl font-serif">Recent Rescues</h3>
                    <Link href="/orders" className="text-[10px] uppercase tracking-widest text-primary hover:underline flex items-center gap-2">
                        View All History <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>

                  {loading ? (
                    <div className="h-64 flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                    </div>
                  ) : orders.length > 0 ? (
                    <div className="grid gap-4">
                      {orders.map((order, i) => (
                        <Link
                          key={order.id}
                          href={`/orders/${order.id}`}
                          className="group bg-background border border-primary/5 hover:border-primary/20 p-6 flex items-center gap-6 transition-all duration-500 rounded-sm"
                        >
                          <div className="w-16 h-16 bg-secondary/10 flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                            <ShoppingBag className="w-6 h-6 text-primary/30" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                            <h4 className="text-lg font-serif">{order.rescue_bags.title}</h4>
                            <p className="text-xs text-muted-foreground font-light">{order.restaurants.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-serif">₹{order.total_price}</p>
                            <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                              {order.status}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center border border-dashed border-primary/10 rounded-sm">
                        <ShoppingBag className="w-8 h-8 text-muted-foreground/20 mb-4" />
                        <p className="text-sm text-muted-foreground font-light">No orders yet. Your rescues will appear here.</p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-12"
                >
                  <div className="flex items-center gap-8 mb-12">
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-serif text-primary">
                        {customer.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="text-3xl font-serif mb-2">{customer.name}</h3>
                        <p className="text-sm text-muted-foreground font-light">{customer.email}</p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-8">
                    {[
                        { label: "Phone", value: customer.phone || "Not set", icon: User },
                        { label: "Joined", value: new Date(customer.created_at).toLocaleDateString(), icon: Clock },
                        { label: "Preferences", value: "Vegan, Indian", icon: Heart },
                        { label: "Settings", value: "Manage Notifications", icon: Settings },
                    ].map((item, i) => (
                        <div key={i} className="p-6 bg-background border border-primary/5 rounded-sm group hover:border-primary/20 transition-all">
                            <div className="flex items-center gap-4 mb-3">
                                <item.icon className="w-4 h-4 text-primary/40" />
                                <span className="text-[9px] uppercase tracking-widest text-muted-foreground">{item.label}</span>
                            </div>
                            <p className="text-sm font-light">{item.value}</p>
                        </div>
                    ))}
                  </div>

                  <div className="pt-8 flex gap-4">
                    <Link href="/profile" className="px-8 py-4 bg-primary text-primary-foreground text-[10px] uppercase tracking-[0.3em] hover:opacity-90 transition-opacity">
                        Edit Full Profile
                    </Link>
                    <Link href="/help" className="px-8 py-4 border border-primary/10 hover:bg-primary/5 text-[10px] uppercase tracking-[0.3em] transition-all">
                        Support Center
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
