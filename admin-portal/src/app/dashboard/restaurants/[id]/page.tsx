"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    Store, MapPin, Phone, Mail, ArrowLeft, Package,
    ShoppingBag, Clock, CheckCircle, XCircle, AlertTriangle
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Restaurant {
    id: string;
    name: string;
    owner_name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    verified: boolean;
    is_active: boolean;
    reliability_strikes: number;
    created_at: string;
}

interface Bag {
    id: string;
    title: string;
    size: string;
    original_price: number;
    discounted_price: number;
    quantity_available: number;
    pickup_start_time: string;
    pickup_end_time: string;
    is_active: boolean;
}

interface Order {
    id: string;
    bag_title: string;
    customer_name: string;
    customer_phone: string;
    status: string;
    total_amount: number;
    created_at: string;
    pickup_time: string;
}

export default function RestaurantDetailPage() {
    const params = useParams();
    const router = useRouter();
    const supabase = createClient();

    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [bags, setBags] = useState<Bag[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"ongoing" | "completed">("ongoing");

    useEffect(() => {
        if (params.id) {
            fetchData();
        }
    }, [params.id]);

    const fetchData = async () => {
        try {
            // Fetch restaurant details
            const { data: restaurantData, error: restaurantError } = await supabase
                .from('restaurants')
                .select('*')
                .eq('id', params.id)
                .single();

            if (restaurantError) throw restaurantError;
            setRestaurant(restaurantData);

            // Fetch bags
            const { data: bagsData, error: bagsError } = await supabase
                .from('rescue_bags')
                .select('*')
                .eq('restaurant_id', params.id)
                .eq('available_date', new Date().toISOString().split('T')[0])
                .order('created_at', { ascending: false });

            if (bagsError) throw bagsError;
            setBags(bagsData || []);

            // Fetch orders
            const { data: ordersData, error: ordersError } = await supabase
                .from('orders')
                .select(`
                    id,
                    status,
                    total_amount,
                    created_at,
                    pickup_time,
                    rescue_bags!inner(
                        title,
                        restaurant_id
                    ),
                    customers(
                        name,
                        phone
                    )
                `)
                .eq('rescue_bags.restaurant_id', params.id)
                .order('created_at', { ascending: false });

            if (ordersError) throw ordersError;

            // Transform orders data
            const transformedOrders = (ordersData || []).map((order: any) => ({
                id: order.id,
                bag_title: order.rescue_bags?.title || 'Unknown Bag',
                customer_name: order.customers?.name || 'Unknown',
                customer_phone: order.customers?.phone || '',
                status: order.status,
                total_amount: order.total_amount,
                created_at: order.created_at,
                pickup_time: order.pickup_time
            }));

            setOrders(transformedOrders);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (time: string) => {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const period = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${hour12}:${minutes} ${period}`;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-500/10 text-yellow-500';
            case 'confirmed':
                return 'bg-blue-500/10 text-blue-500';
            case 'picked_up':
            case 'completed':
                return 'bg-emerald-500/10 text-emerald-500';
            case 'cancelled':
                return 'bg-red-500/10 text-red-500';
            default:
                return 'bg-zinc-500/10 text-zinc-500';
        }
    };

    const ongoingOrders = orders.filter(o => ['pending', 'confirmed'].includes(o.status));
    const completedOrders = orders.filter(o => ['picked_up', 'completed', 'cancelled'].includes(o.status));

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
            </div>
        );
    }

    if (!restaurant) {
        return (
            <div className="text-center py-12">
                <p className="text-zinc-500">Restaurant not found</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-zinc-400" />
                </button>
                <div>
                    <h1 className="text-3xl font-serif text-white">{restaurant.name}</h1>
                    <p className="text-zinc-500 mt-1">{restaurant.owner_name}</p>
                </div>
            </div>

            {/* Restaurant Info Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-zinc-400">
                            <Mail className="w-4 h-4" />
                            <span>{restaurant.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-400">
                            <Phone className="w-4 h-4" />
                            <span>{restaurant.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-400">
                            <MapPin className="w-4 h-4" />
                            <span>{restaurant.city}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 text-sm font-medium rounded ${restaurant.verified
                                    ? 'bg-emerald-500/10 text-emerald-500'
                                    : 'bg-yellow-500/10 text-yellow-500'
                                }`}>
                                {restaurant.verified ? 'Verified' : 'Pending Verification'}
                            </span>
                            <span className={`px-3 py-1 text-sm font-medium rounded ${restaurant.is_active
                                    ? 'bg-blue-500/10 text-blue-500'
                                    : 'bg-zinc-500/10 text-zinc-500'
                                }`}>
                                {restaurant.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            <span className="text-sm text-zinc-400">
                                {restaurant.reliability_strikes || 0} of 3 Strikes
                            </span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Bags Listed Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-amber-500" />
                    Today's Bags Listed
                </h2>
                {bags.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {bags.map((bag) => (
                            <div
                                key={bag.id}
                                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="font-medium text-white">{bag.title}</h3>
                                        <span className="text-xs text-zinc-500 uppercase">{bag.size}</span>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-medium rounded ${bag.is_active
                                            ? 'bg-emerald-500/10 text-emerald-500'
                                            : 'bg-zinc-500/10 text-zinc-500'
                                        }`}>
                                        {bag.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center justify-between text-zinc-400">
                                        <span>Quantity Available:</span>
                                        <span className="text-white font-medium">{bag.quantity_available}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-zinc-400">
                                        <span>Customer Price:</span>
                                        <span className="text-amber-500 font-medium">₹{bag.discounted_price}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-zinc-400">
                                        <Clock className="w-4 h-4" />
                                        <span>{formatTime(bag.pickup_start_time)} - {formatTime(bag.pickup_end_time)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center">
                        <Package className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                        <p className="text-zinc-500">No bags listed for today</p>
                    </div>
                )}
            </motion.div>

            {/* Orders Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-amber-500" />
                    Orders
                </h2>

                {/* Tabs */}
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setActiveTab("ongoing")}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "ongoing"
                                ? 'bg-amber-500 text-black'
                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                            }`}
                    >
                        Ongoing ({ongoingOrders.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("completed")}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "completed"
                                ? 'bg-amber-500 text-black'
                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                            }`}
                    >
                        Completed ({completedOrders.length})
                    </button>
                </div>

                {/* Orders List */}
                {(activeTab === "ongoing" ? ongoingOrders : completedOrders).length > 0 ? (
                    <div className="space-y-3">
                        {(activeTab === "ongoing" ? ongoingOrders : completedOrders).map((order) => (
                            <div
                                key={order.id}
                                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="font-medium text-white">{order.bag_title}</h3>
                                        <p className="text-sm text-zinc-500">Customer: {order.customer_name}</p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(order.status)}`}>
                                        {order.status.replace('_', ' ').toUpperCase()}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="text-zinc-400">
                                        <span className="block text-xs mb-1">Amount</span>
                                        <span className="text-white font-medium">₹{order.total_amount}</span>
                                    </div>
                                    <div className="text-zinc-400">
                                        <span className="block text-xs mb-1">Ordered</span>
                                        <span className="text-white">{new Date(order.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center">
                        <ShoppingBag className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                        <p className="text-zinc-500">
                            No {activeTab} orders
                        </p>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
