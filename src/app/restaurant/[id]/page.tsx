"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft, MapPin, Phone, Clock, ShoppingBag,
    Plus, Minus, Leaf, Drumstick, UtensilsCrossed,
    AlertCircle
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";

interface Bag {
    id: string;
    title: string;
    description: string | null;
    size: string;
    original_price: number;
    discounted_price: number;
    quantity_available: number;
    pickup_start_time: string;
    pickup_end_time: string;
    dietary_info?: string[];
}

interface Restaurant {
    id: string;
    name: string;
    address_line1: string;
    city: string;
    phone: string;
    cover_image_url?: string;
}

const sizeConfig: Record<string, { label: string; gradient: string; icon: string }> = {
    small: { label: 'Small', gradient: 'from-blue-500 to-cyan-500', icon: '🎁' },
    medium: { label: 'Medium', gradient: 'from-purple-500 to-pink-500', icon: '🎊' },
    large: { label: 'Large', gradient: 'from-orange-500 to-red-500', icon: '🎉' },
};

const DietaryBadge = ({ type }: { type: string }) => {
    const config: Record<string, { icon: any; color: string; bg: string; label: string }> = {
        veg: { icon: Leaf, color: 'text-green-600', bg: 'bg-green-50 border-green-200', label: 'Veg' },
        'non-veg': { icon: Drumstick, color: 'text-red-600', bg: 'bg-red-50 border-red-200', label: 'Non-Veg' },
        mixed: { icon: UtensilsCrossed, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', label: 'Mixed' },
    };
    const cfg = config[type] || config.mixed;
    const Icon = cfg.icon;

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.color}`}>
            <Icon className="w-3 h-3" />
            {cfg.label}
        </span>
    );
};

export default function RestaurantPage() {
    const params = useParams();
    const router = useRouter();
    const cart = useCart();

    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [bags, setBags] = useState<Bag[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showClearCartModal, setShowClearCartModal] = useState(false);
    const [pendingItem, setPendingItem] = useState<Bag | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/restaurant/${params.id}`);
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();
                setRestaurant(data.restaurant);
                setBags(data.bags || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        if (params.id) fetchData();
    }, [params.id]);

    const handleAddToCart = (bag: Bag) => {
        if (!restaurant) return;

        const success = cart.addToCart({
            bagId: bag.id,
            restaurantId: restaurant.id,
            restaurantName: restaurant.name,
            title: bag.title,
            size: bag.size,
            price: bag.discounted_price,
            quantity: 1,
            pickupStart: bag.pickup_start_time,
            pickupEnd: bag.pickup_end_time,
            maxQuantity: bag.quantity_available,
            dietaryInfo: bag.dietary_info,
        });

        if (!success) {
            // Different restaurant - show confirmation modal
            setPendingItem(bag);
            setShowClearCartModal(true);
        }
    };

    const handleClearAndAdd = () => {
        if (!restaurant || !pendingItem) return;
        cart.clearCart();
        cart.addToCart({
            bagId: pendingItem.id,
            restaurantId: restaurant.id,
            restaurantName: restaurant.name,
            title: pendingItem.title,
            size: pendingItem.size,
            price: pendingItem.discounted_price,
            quantity: 1,
            pickupStart: pendingItem.pickup_start_time,
            pickupEnd: pendingItem.pickup_end_time,
            maxQuantity: pendingItem.quantity_available,
            dietaryInfo: pendingItem.dietary_info,
        });
        setShowClearCartModal(false);
        setPendingItem(null);
    };

    const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':');
        const h = parseInt(hours);
        const period = h >= 12 ? 'PM' : 'AM';
        const hour12 = h % 12 || 12;
        return `${hour12}:${minutes} ${period}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500 font-medium">Loading restaurant...</p>
                </div>
            </div>
        );
    }

    if (error || !restaurant) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
                <ShoppingBag className="w-20 h-20 text-gray-300 mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Restaurant not found</h1>
                <p className="text-gray-500 mb-6">{error || "This restaurant doesn't exist"}</p>
                <button
                    onClick={() => router.push('/browse')}
                    className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition"
                >
                    Back to Browse
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-32">
            {/* Header with Cover Image */}
            <div className="relative h-56 md:h-72">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                        backgroundImage: restaurant.cover_image_url
                            ? `url(${restaurant.cover_image_url})`
                            : `url(/images/hero-indian-food.png)`
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                {/* Back button */}
                <button
                    onClick={() => router.back()}
                    className="absolute top-4 left-4 z-10 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg hover:bg-white transition"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-700" />
                </button>

                {/* Restaurant name overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">
                        {restaurant.name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm">
                        <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {restaurant.address_line1}, {restaurant.city}
                        </span>
                        {restaurant.phone && (
                            <span className="flex items-center gap-1">
                                <Phone className="w-4 h-4" />
                                {restaurant.phone}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Mystery Bags Section */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-8 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full" />
                    <h2 className="text-2xl font-bold text-gray-900">
                        Mystery Bags
                        <span className="ml-2 text-lg font-normal text-gray-500">({bags.length})</span>
                    </h2>
                </div>

                {bags.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm"
                    >
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShoppingBag className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No bags available</h3>
                        <p className="text-gray-500">Check back later for mystery bags!</p>
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        {bags.map((bag, index) => {
                            const cartQty = cart.getItemQuantity(bag.id);
                            const config = sizeConfig[bag.size] || sizeConfig.medium;

                            return (
                                <motion.div
                                    key={bag.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="p-5">
                                        <div className="flex items-start justify-between gap-4">
                                            {/* Left side - Bag info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    {/* Size badge */}
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-gradient-to-r ${config.gradient}`}>
                                                        <span>{config.icon}</span>
                                                        {config.label}
                                                    </span>

                                                    {/* Dietary badge */}
                                                    {bag.dietary_info && bag.dietary_info[0] && (
                                                        <DietaryBadge type={bag.dietary_info[0]} />
                                                    )}
                                                </div>

                                                <h3 className="text-lg font-bold text-gray-900 mb-1">
                                                    {bag.title}
                                                </h3>

                                                {bag.description && (
                                                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                                                        {bag.description}
                                                    </p>
                                                )}

                                                {/* Pickup time */}
                                                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                    <Clock className="w-4 h-4 text-emerald-600" />
                                                    <span>Pickup: {formatTime(bag.pickup_start_time)} - {formatTime(bag.pickup_end_time)}</span>
                                                </div>

                                                {/* Price */}
                                                <div className="flex items-baseline gap-2 mt-3">
                                                    <span className="text-2xl font-bold text-gray-900">₹{bag.discounted_price}</span>
                                                    <span className="text-sm text-gray-400 line-through">₹{bag.original_price}</span>
                                                </div>

                                                {/* Stock info */}
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {bag.quantity_available} bag{bag.quantity_available !== 1 ? 's' : ''} left
                                                </p>
                                            </div>

                                            {/* Right side - Add to cart controls */}
                                            <div className="flex flex-col items-end justify-between min-h-[120px]">
                                                {cartQty === 0 ? (
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => handleAddToCart(bag)}
                                                        className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 transition flex items-center gap-2"
                                                    >
                                                        <Plus className="w-5 h-5" />
                                                        ADD
                                                    </motion.button>
                                                ) : (
                                                    <div className="flex items-center gap-1 bg-emerald-600 rounded-xl overflow-hidden shadow-lg">
                                                        <button
                                                            onClick={() => cart.updateQuantity(bag.id, cartQty - 1)}
                                                            className="w-10 h-10 flex items-center justify-center text-white hover:bg-emerald-700 transition"
                                                        >
                                                            <Minus className="w-5 h-5" />
                                                        </button>
                                                        <span className="w-8 text-center text-white font-bold text-lg">
                                                            {cartQty}
                                                        </span>
                                                        <button
                                                            onClick={() => {
                                                                if (cartQty < bag.quantity_available) {
                                                                    cart.updateQuantity(bag.id, cartQty + 1);
                                                                }
                                                            }}
                                                            disabled={cartQty >= bag.quantity_available}
                                                            className="w-10 h-10 flex items-center justify-center text-white hover:bg-emerald-700 transition disabled:opacity-50"
                                                        >
                                                            <Plus className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Clear Cart Modal */}
            <AnimatePresence>
                {showClearCartModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
                        onClick={() => setShowClearCartModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                                    <AlertCircle className="w-6 h-6 text-orange-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Different Restaurant</h3>
                                    <p className="text-sm text-gray-500">Your cart has items from another restaurant</p>
                                </div>
                            </div>
                            <p className="text-gray-600 mb-6">
                                Adding this item will clear your current cart. Do you want to continue?
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowClearCartModal(false)}
                                    className="flex-1 py-3 px-4 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleClearAndAdd}
                                    className="flex-1 py-3 px-4 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition"
                                >
                                    Clear & Add
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
