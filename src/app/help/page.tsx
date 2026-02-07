"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, MessageCircle, Package, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";

interface Order {
    id: string;
    restaurant_id: string;
    rescue_bag_id: string;
    pickup_time: string;
    total_price: number;
    status: string;
    created_at: string;
    restaurant: {
        name: string;
        address: string;
    };
    rescue_bag: {
        name: string;
    };
}

const issueTypes = [
    { id: 'value_not_met', label: "Bag didn't meet expected value", description: "The items received were worth less than the amount paid" },
    { id: 'quality_issue', label: 'Food quality/freshness issue', description: 'Items were not fresh or had quality problems' },
    { id: 'missing_items', label: 'Missing items from my bag', description: 'Some items were missing from the Mystery Bag' },
    { id: 'wrong_order', label: 'Received wrong order', description: 'Got a completely different order or bag' },
    { id: 'pickup_issue', label: 'Pickup location/timing problem', description: 'Could not pick up or had timing issues' },
    { id: 'other', label: 'Other issue', description: 'Something else went wrong' },
];

export default function HelpPage() {
    const { customer, loading: authLoading } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
    const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        // Wait for auth to finish loading
        if (authLoading) return;

        if (customer) {
            fetchRecentOrders();
        } else {
            // Not logged in, stop loading
            setLoading(false);
        }
    }, [customer, authLoading]);

    const fetchRecentOrders = async () => {
        if (!customer?.id) {
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    restaurants(*),
                    rescue_bags(*)
                `)
                .eq('customer_id', customer.id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;

            // Transform data to handle null relationships
            const transformedOrders = (data || []).map((order: any) => ({
                ...order,
                restaurant: order.restaurants || { name: 'Restaurant', address: '' },
                rescue_bag: order.rescue_bags || { name: 'Mystery Bag', title: 'Mystery Bag' },
            }));

            setOrders(transformedOrders);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            'confirmed': 'bg-blue-100 text-blue-800',
            'ready': 'bg-green-100 text-green-800',
            'completed': 'bg-gray-100 text-gray-800',
            'cancelled': 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="relative min-h-screen bg-gray-50 selection:bg-primary selection:text-primary-foreground">
            <Header />

            <main className="pt-24 pb-24 px-4 sm:px-6 lg:px-12">
                <div className="max-w-3xl mx-auto">
                    {/* Page Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">Help & Support</h1>
                        <p className="text-gray-600">Select an order to get help or chat with our support team</p>
                    </motion.div>

                    {/* General Support Button - Always Visible */}
                    <div className="mb-8">
                        <Link
                            href="/help/chat?issue=other"
                            className="block bg-gradient-to-r from-[#0B1E0F] to-[#142318] rounded-2xl p-6 text-white hover:opacity-95 transition-opacity"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-semibold mb-1">💬 Chat with Support</h3>
                                    <p className="text-white/80 text-sm">Have a question or need help? We're here for you!</p>
                                </div>
                                <ChevronRight className="w-6 h-6 text-white/60" />
                            </div>
                            <p className="text-xs text-white/60 mt-3">
                                <span className="text-emerald-400">●</span> Avg. response time: &lt; 2 min
                            </p>
                        </Link>
                    </div>

                    {/* Recent Orders Section */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900 px-1">Your Recent Orders</h2>

                        {loading ? (
                            <div className="bg-white rounded-2xl p-12 text-center">
                                <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-gray-200 border-t-emerald-600 animate-spin" />
                                <p className="text-gray-500">Loading your orders...</p>
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                                <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">No orders yet</h3>
                                <p className="text-gray-500 text-sm mb-4">Start rescuing Mystery Bags to see them here!</p>
                                <Link
                                    href="/browse"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium"
                                >
                                    Browse Mystery Bags
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {orders.map((order) => (
                                    <motion.div
                                        key={order.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
                                    >
                                        <button
                                            onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
                                            className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="text-lg font-semibold text-gray-900">{order.restaurant.name}</h3>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mb-1">{order.rescue_bag.name}</p>
                                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-4 h-4" />
                                                            {formatDate(order.created_at)}
                                                        </span>
                                                        <span className="font-semibold text-gray-900">₹{order.total_price}</span>
                                                    </div>
                                                </div>
                                                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${selectedOrder === order.id ? 'rotate-180' : ''}`} />
                                            </div>
                                        </button>

                                        <AnimatePresence>
                                            {selectedOrder === order.id && (
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: 'auto' }}
                                                    exit={{ height: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="px-6 pb-6 pt-2 border-t border-gray-100">
                                                        <p className="text-sm font-medium text-gray-700 mb-3">What went wrong?</p>
                                                        <div className="space-y-2">
                                                            {issueTypes.map((issue) => (
                                                                <div key={issue.id} className="border border-gray-200 rounded-xl overflow-hidden">
                                                                    <button
                                                                        onClick={() => setExpandedIssue(expandedIssue === issue.id ? null : issue.id)}
                                                                        className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                                                                    >
                                                                        <span className="text-sm font-medium text-gray-900">{issue.label}</span>
                                                                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedIssue === issue.id ? 'rotate-180' : ''}`} />
                                                                    </button>

                                                                    <AnimatePresence>
                                                                        {expandedIssue === issue.id && (
                                                                            <motion.div
                                                                                initial={{ height: 0 }}
                                                                                animate={{ height: 'auto' }}
                                                                                exit={{ height: 0 }}
                                                                                className="overflow-hidden"
                                                                            >
                                                                                <div className="px-4 pb-4 bg-gray-50 border-t border-gray-200">
                                                                                    <p className="text-xs text-gray-600 mb-3 mt-3">{issue.description}</p>
                                                                                    <Link
                                                                                        href={`/help/chat?order=${order.id}&issue=${issue.id}`}
                                                                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0B1E0F] text-white rounded-xl hover:bg-[#142318] transition-colors text-sm font-medium"
                                                                                    >
                                                                                        <MessageCircle className="w-4 h-4" />
                                                                                        Chat with Support
                                                                                    </Link>
                                                                                    <p className="text-xs text-gray-500 mt-2">
                                                                                        <span className="font-semibold text-emerald-600">●</span> Avg. response time: &lt; 2 min
                                                                                    </p>
                                                                                </div>
                                                                            </motion.div>
                                                                        )}
                                                                    </AnimatePresence>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* General Help */}
                    <div className="mt-12">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 px-1">General Help</h2>
                        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100">
                            <Link href="/faq" className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
                                <div>
                                    <p className="font-medium text-gray-900">How Mystery Bags work</p>
                                    <p className="text-sm text-gray-600">Learn about the process</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </Link>
                            <Link href="/faq#pickup" className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
                                <div>
                                    <p className="font-medium text-gray-900">Pickup process</p>
                                    <p className="text-sm text-gray-600">When and where to collect</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </Link>
                            <Link href="/faq#refunds" className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
                                <div>
                                    <p className="font-medium text-gray-900">Refund policy</p>
                                    <p className="text-sm text-gray-600">How refunds work</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </Link>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="mt-8 bg-gradient-to-br from-[#0B1E0F] to-[#142318] rounded-2xl p-8 text-white">
                        <h3 className="text-xl font-bold mb-4">Still need help?</h3>
                        <p className="text-white/80 mb-6">Our support team is here to help you!</p>
                        <div className="space-y-3">
                            <a href="mailto:support@latebites.in" className="flex items-center gap-3 text-white/90 hover:text-white transition-colors">
                                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                                    📧
                                </div>
                                <span className="text-sm">support@latebites.in</span>
                            </a>
                            <a href="tel:+911234567890" className="flex items-center gap-3 text-white/90 hover:text-white transition-colors">
                                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                                    📞
                                </div>
                                <span className="text-sm">+91 123 456 7890</span>
                            </a>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
