"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import {
    MapPin, Clock, Star, ArrowLeft, ShoppingBag, Leaf, Phone, Navigation,
    ChevronRight, Utensils, Flame, Timer, Package, Sparkles, X, Loader2
} from "lucide-react";
import { calculateDistance, formatDistance, getSavedLocation, type Coordinates } from "@/lib/location/geolocation";
import "../../premium-animations.css";

interface Restaurant {
    id: string;
    name: string;
    owner_name: string;
    email: string;
    phone: string;
    address_line1: string;
    address_line2: string | null;
    city: string;
    state: string;
    pincode: string;
    latitude: number;
    longitude: number;
    cuisine_types: string[] | null;
    profile_image_url: string | null;
    cover_image_url: string | null;
    menu_image_url: string | null;
    description: string | null;
    verified: boolean;
    is_active: boolean;
}

interface RescueBag {
    id: string;
    restaurant_id: string;
    title: string;
    description: string | null;
    size: string;
    original_price: number;
    discounted_price: number;
    quantity_available: number;
    pickup_start_time: string;
    pickup_end_time: string;
    available_date: string;
    image_url: string | null;
    is_active: boolean;
}

export default function RestaurantDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user, customer } = useAuth();
    const supabase = createClient();

    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [bags, setBags] = useState<RescueBag[]>([]);
    const [loading, setLoading] = useState(true);
    const [distance, setDistance] = useState<number | null>(null);
    const [reservingBag, setReservingBag] = useState<string | null>(null);
    const [showMenuModal, setShowMenuModal] = useState(false);

    useEffect(() => {
        if (params.id) {
            fetchRestaurantData();
        }
    }, [params.id]);

    const fetchRestaurantData = async () => {
        try {
            // Fetch restaurant
            const { data: restaurantData, error: restaurantError } = await supabase
                .from('restaurants')
                .select('*')
                .eq('id', params.id)
                .single();

            if (restaurantError) throw restaurantError;
            setRestaurant(restaurantData);

            // Calculate distance
            const userLocation = getSavedLocation();
            if (userLocation && restaurantData) {
                const dist = calculateDistance(userLocation, {
                    latitude: restaurantData.latitude,
                    longitude: restaurantData.longitude,
                });
                setDistance(dist);
            }

            // Fetch available bags for today
            const today = new Date().toISOString().split('T')[0];
            const { data: bagsData, error: bagsError } = await supabase
                .from('rescue_bags')
                .select('*')
                .eq('restaurant_id', params.id)
                .eq('is_active', true)
                .eq('available_date', today)
                .gte('quantity_available', 1)
                .order('discounted_price', { ascending: true });

            if (!bagsError && bagsData) {
                setBags(bagsData);
            }
        } catch (error) {
            console.error('Error fetching restaurant:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReserveBag = async (bag: RescueBag) => {
        if (!customer) {
            toast.error("Please sign in to reserve a bag");
            router.push('/?auth=customer');
            return;
        }

        setReservingBag(bag.id);
        try {
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert([{
                    customer_id: customer.id,
                    rescue_bag_id: bag.id,
                    restaurant_id: bag.restaurant_id,
                    quantity: 1,
                    total_price: bag.discounted_price,
                    status: 'pending',
                    payment_method: 'pay_at_pickup',
                }])
                .select()
                .single();

            if (orderError) throw orderError;

            // Update bag quantity
            await supabase
                .from('rescue_bags')
                .update({ quantity_available: bag.quantity_available - 1 })
                .eq('id', bag.id);

            toast.success("Bag reserved successfully!");
            router.push(`/orders/${orderData.id}`);
        } catch (error: any) {
            console.error('Error reserving bag:', error);
            toast.error(error.message || "Failed to reserve bag");
        } finally {
            setReservingBag(null);
        }
    };

    const formatTime = (time: string) => {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const formatPickupWindow = (start: string, end: string) => {
        return `${formatTime(start)} - ${formatTime(end)}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FEFCF9] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-16 h-16 rounded-full border-[3px] border-primary/20 border-t-primary"
                    />
                    <p className="text-sm text-muted-foreground uppercase tracking-widest">Loading restaurant...</p>
                </div>
            </div>
        );
    }

    if (!restaurant) {
        return (
            <div className="min-h-screen bg-[#FEFCF9] flex items-center justify-center p-4">
                <div className="text-center">
                    <Utensils className="w-20 h-20 mx-auto mb-6 text-muted-foreground/20" />
                    <h2 className="text-3xl font-serif mb-3">Restaurant not found</h2>
                    <p className="text-muted-foreground mb-8">This restaurant may no longer be available</p>
                    <Link
                        href="/browse"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white text-xs uppercase tracking-[0.3em] font-bold rounded-2xl hover:bg-primary transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Browse
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FEFCF9] selection:bg-primary selection:text-primary-foreground">
            <Toaster />
            <Header />

            {/* Hero Section */}
            <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0">
                    <img
                        src={restaurant.cover_image_url || "/images/hero-indian-food.png"}
                        alt={restaurant.name}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                </div>

                {/* Back Button */}
                <div className="absolute top-28 left-6 z-20">
                    <Link
                        href="/browse"
                        className="group flex items-center gap-3 px-5 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white hover:bg-white hover:text-black transition-all duration-300"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs uppercase tracking-[0.2em] font-bold">Back</span>
                    </Link>
                </div>

                {/* Distance Badge */}
                {distance !== null && (
                    <div className="absolute top-28 right-6 z-20">
                        <div className="px-5 py-3 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl flex items-center gap-3">
                            <Navigation className="w-4 h-4 text-primary" />
                            <span className="text-sm font-bold">{formatDistance(distance)}</span>
                        </div>
                    </div>
                )}

                {/* Hero Content */}
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 z-10">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            {/* Badges */}
                            <div className="flex flex-wrap gap-3 mb-4">
                                {restaurant.verified && (
                                    <div className="px-4 py-2 bg-emerald-500/20 backdrop-blur-md text-emerald-400 text-[10px] uppercase tracking-[0.2em] font-black rounded-xl flex items-center gap-2">
                                        <Star className="w-3 h-3 fill-current" />
                                        Verified Partner
                                    </div>
                                )}
                                <div className="px-4 py-2 bg-gradient-to-r from-primary/80 to-orange-500/80 backdrop-blur-md text-white text-[10px] uppercase tracking-[0.2em] font-black rounded-xl flex items-center gap-2">
                                    <Flame className="w-3 h-3" />
                                    {bags.length} Bags Available
                                </div>
                            </div>

                            {/* Title */}
                            <h1 className="text-4xl md:text-6xl font-serif text-white mb-3 leading-tight">
                                {restaurant.name}
                            </h1>

                            {/* Cuisines */}
                            {restaurant.cuisine_types && restaurant.cuisine_types.length > 0 && (
                                <div className="flex items-center gap-2 text-white/80 mb-4">
                                    <Utensils className="w-4 h-4" />
                                    <p className="text-sm font-light italic tracking-wide">
                                        {restaurant.cuisine_types.slice(0, 3).join(" • ")}
                                    </p>
                                </div>
                            )}

                            {/* Location */}
                            <div className="flex items-center gap-2 text-white/70">
                                <MapPin className="w-4 h-4" />
                                <span className="text-sm font-light">
                                    {restaurant.address_line1}, {restaurant.city}
                                </span>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <main className="relative -mt-8 z-20">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    {/* Quick Info Cards */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
                    >
                        <div className="bg-white rounded-[28px] p-6 shadow-xl shadow-black/5 border border-primary/5">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                                <Package className="w-6 h-6 text-primary" />
                            </div>
                            <p className="text-3xl font-bold mb-1">{bags.length}</p>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest">Bags Today</p>
                        </div>
                        <div className="bg-white rounded-[28px] p-6 shadow-xl shadow-black/5 border border-primary/5">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
                                <Leaf className="w-6 h-6 text-emerald-600" />
                            </div>
                            <p className="text-3xl font-bold mb-1">50%+</p>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest">Min Discount</p>
                        </div>
                        <div className="bg-white rounded-[28px] p-6 shadow-xl shadow-black/5 border border-primary/5">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
                                <Timer className="w-6 h-6 text-amber-600" />
                            </div>
                            <p className="text-3xl font-bold mb-1">{bags[0] ? formatTime(bags[0].pickup_start_time).split(' ')[0] : '--'}</p>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest">Pickup From</p>
                        </div>
                        <div className="bg-white rounded-[28px] p-6 shadow-xl shadow-black/5 border border-primary/5 cursor-pointer hover:border-primary/20 transition-all" onClick={() => restaurant.menu_image_url && setShowMenuModal(true)}>
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
                                <Utensils className="w-6 h-6 text-blue-600" />
                            </div>
                            <p className="text-lg font-bold mb-1 truncate">{restaurant.menu_image_url ? 'View Menu' : 'No Menu'}</p>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest">Restaurant Menu</p>
                        </div>
                    </motion.div>

                    {/* About Section */}
                    {restaurant.description && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white rounded-[32px] p-8 shadow-xl shadow-black/5 border border-primary/5 mb-12"
                        >
                            <h2 className="text-xl font-serif mb-4 flex items-center gap-3">
                                <Sparkles className="w-5 h-5 text-primary" />
                                About This Kitchen
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">{restaurant.description}</p>
                        </motion.div>
                    )}

                    {/* Rescue Bags Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="mb-16"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-1.5 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" />
                            <h2 className="text-2xl md:text-3xl font-serif">Available Rescue Bags</h2>
                        </div>

                        {bags.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {bags.map((bag, index) => {
                                    const discountPercent = Math.round((1 - bag.discounted_price / bag.original_price) * 100);
                                    return (
                                        <motion.div
                                            key={bag.id}
                                            initial={{ opacity: 0, y: 30 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 * index }}
                                            className="group bg-white rounded-[32px] border border-primary/5 overflow-hidden hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-2 transition-all duration-500"
                                        >
                                            {/* Card Header with Image */}
                                            <div className="relative h-48 bg-gradient-to-br from-secondary/50 to-primary/10 overflow-hidden">
                                                {bag.image_url ? (
                                                    <img src={bag.image_url} alt={bag.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                ) : restaurant.cover_image_url ? (
                                                    <img src={restaurant.cover_image_url} alt={bag.title} className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <ShoppingBag className="w-16 h-16 text-primary/20" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                                                {/* Discount Badge */}
                                                <div className="absolute top-4 left-4 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] uppercase tracking-[0.2em] font-black rounded-xl shadow-lg">
                                                    {discountPercent}% OFF
                                                </div>

                                                {/* Quantity */}
                                                <div className="absolute top-4 right-4 px-4 py-2 bg-white/95 backdrop-blur-sm text-[11px] font-bold rounded-xl shadow-lg flex items-center gap-2">
                                                    <Package className="w-3.5 h-3.5 text-primary" />
                                                    {bag.quantity_available} left
                                                </div>

                                                {/* Size Badge */}
                                                <div className="absolute bottom-4 left-4">
                                                    <span className="px-3 py-1.5 bg-black/50 backdrop-blur-sm text-white text-[10px] uppercase tracking-widest font-bold rounded-lg">
                                                        {bag.size} Bag
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Card Content */}
                                            <div className="p-6">
                                                <h3 className="text-xl font-serif mb-2 group-hover:text-primary transition-colors">{bag.title}</h3>

                                                {bag.description && (
                                                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{bag.description}</p>
                                                )}

                                                {/* Pickup Time */}
                                                <div className="flex items-center gap-2 mb-5 p-3 bg-amber-500/5 rounded-xl">
                                                    <Clock className="w-4 h-4 text-amber-600" />
                                                    <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                                                        {formatPickupWindow(bag.pickup_start_time, bag.pickup_end_time)}
                                                    </span>
                                                </div>

                                                {/* Price & Action */}
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="flex items-baseline gap-2">
                                                            <span className="text-2xl font-bold text-primary">₹{bag.discounted_price}</span>
                                                            <span className="text-sm text-muted-foreground line-through">₹{bag.original_price}</span>
                                                        </div>
                                                        <p className="text-[10px] text-emerald-600 font-medium mt-1">
                                                            Save ₹{bag.original_price - bag.discounted_price}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleReserveBag(bag)}
                                                        disabled={reservingBag === bag.id}
                                                        className="px-6 py-3 bg-black text-white text-[10px] uppercase tracking-[0.2em] font-black rounded-xl hover:bg-primary transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
                                                    >
                                                        {reservingBag === bag.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <>
                                                                Reserve
                                                                <ChevronRight className="w-4 h-4" />
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="bg-white rounded-[40px] p-16 text-center border border-primary/5 shadow-xl">
                                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/5 flex items-center justify-center">
                                    <ShoppingBag className="w-10 h-10 text-primary/30" />
                                </div>
                                <h3 className="text-2xl font-serif mb-3">No bags available right now</h3>
                                <p className="text-muted-foreground max-w-md mx-auto mb-8">
                                    This restaurant hasn't listed any rescue bags for today. Check back later or explore other restaurants nearby.
                                </p>
                                <Link
                                    href="/browse"
                                    className="inline-flex items-center gap-3 px-8 py-4 bg-black text-white text-[10px] uppercase tracking-[0.3em] font-black rounded-2xl hover:bg-primary transition-all"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Browse Other Restaurants
                                </Link>
                            </div>
                        )}
                    </motion.div>

                    {/* Contact Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-gradient-to-br from-primary/5 via-orange-50/50 to-amber-50/30 rounded-[40px] p-8 md:p-12 mb-16 border border-primary/10 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div>
                                <h3 className="text-2xl font-serif mb-2">Need help with your order?</h3>
                                <p className="text-muted-foreground">Contact the restaurant directly for any inquiries</p>
                            </div>
                            <a
                                href={`tel:${restaurant.phone}`}
                                className="flex items-center gap-4 px-8 py-5 bg-white rounded-2xl shadow-xl border border-primary/10 hover:border-primary/30 transition-all group"
                            >
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                                    <Phone className="w-5 h-5 text-primary group-hover:text-white" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-widest">Call Restaurant</p>
                                    <p className="text-lg font-bold">{restaurant.phone}</p>
                                </div>
                            </a>
                        </div>
                    </motion.div>
                </div>
            </main>

            {/* Menu Modal */}
            <AnimatePresence>
                {showMenuModal && restaurant.menu_image_url && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowMenuModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative max-w-4xl max-h-[90vh]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setShowMenuModal(false)}
                                className="absolute -top-12 right-0 p-2 text-white hover:text-zinc-300 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <img
                                src={restaurant.menu_image_url}
                                alt="Restaurant Menu"
                                className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-white/10"
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                    <p className="text-[10px] text-muted-foreground/60 tracking-widest">ENCRYPTED & SECURED</p>
                </div>
            </footer>
        </div>
    );
}
