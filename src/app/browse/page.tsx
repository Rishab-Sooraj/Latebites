"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrentLocation, formatDistance, type Coordinates } from "@/lib/location/geolocation";
import { MapPin, Search, Clock, X, Navigation, Loader2, ArrowRight, ShoppingBag, Timer, ChevronRight, User, Utensils, Star, Flame } from "lucide-react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";

import { Header } from "@/components/Header";
import "../premium-animations.css";

interface Restaurant {
    id: string;
    name: string;
    owner_name: string;
    email: string;
    phone: string;
    address_line1: string;
    city: string;
    state: string;
    pincode: string;
    latitude: number;
    longitude: number;
    cuisine_types: string[] | null;
    profile_image_url: string | null;
    cover_image_url: string | null;
    description: string | null;
    distance_km: number;
    rescue_bags: RescueBag[];
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

export default function BrowsePage() {
    const router = useRouter();
    const { user, customer, loading: authLoading } = useAuth();
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
    const [locationName, setLocationName] = useState("");
    const [locationError, setLocationError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [orders, setOrders] = useState<any[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(true);

    const searchInputRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const supabase = createClient();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/?auth=customer');
        }
    }, [authLoading, user, router]);

    useEffect(() => {
        if (customer) {
            fetchOrders();
        }
    }, [customer]);

    const fetchOrders = async () => {
        try {
            const { data, error } = await supabase
                .from("orders")
                .select(`*, rescue_bags (*), restaurants (*)`)
                .eq("customer_id", customer?.id)
                .order("created_at", { ascending: false })
                .limit(3);

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setOrdersLoading(false);
        }
    };

    const fetchNearbyRestaurants = useCallback(async (coords: Coordinates) => {
        setLoading(true);
        try {
            const response = await fetch('/api/restaurants/nearby', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                    radius: 7,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch restaurants');
            }

            const data = await response.json();
            setRestaurants(data.restaurants || []);
        } catch (error: any) {
            console.error("Error fetching nearby restaurants:", error);
            toast.error(error.message || "Failed to load restaurants");
            setRestaurants([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const reverseGeocode = async (coords: Coordinates) => {
        try {
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.latitude},${coords.longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
            );
            const data = await response.json();
            if (data.results && data.results[0]) {
                const parts = data.results[0].formatted_address.split(',');
                setLocationName(parts.slice(0, 2).join(','));
            }
        } catch (error) {
            console.error("Reverse geocode error:", error);
        }
    };

    useEffect(() => {
        if (!user) return;
        getCurrentLocation()
            .then((coords) => {
                setUserLocation(coords);
                fetchNearbyRestaurants(coords);
                reverseGeocode(coords);
            })
            .catch((error) => {
                console.error("Location error:", error);
                setLocationError(error.message);
                setLoading(false);
                setShowLocationModal(true);
            });
    }, [user, fetchNearbyRestaurants]);

    useEffect(() => {
        if (showLocationModal && searchInputRef.current && !autocompleteRef.current) {
            const loadGoogleMaps = () => {
                if (window.google && window.google.maps) {
                    initAutocomplete();
                    return;
                }
                const script = document.createElement('script');
                script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
                script.async = true;
                script.defer = true;
                script.onload = () => initAutocomplete();
                document.head.appendChild(script);
            };

            const initAutocomplete = () => {
                if (searchInputRef.current && window.google) {
                    autocompleteRef.current = new google.maps.places.Autocomplete(
                        searchInputRef.current,
                        {
                            componentRestrictions: { country: "in" },
                            fields: ["geometry", "formatted_address", "name"],
                        }
                    );

                    autocompleteRef.current.addListener("place_changed", () => {
                        const place = autocompleteRef.current?.getPlace();
                        if (place?.geometry?.location) {
                            const coords: Coordinates = {
                                latitude: place.geometry.location.lat(),
                                longitude: place.geometry.location.lng(),
                            };
                            setUserLocation(coords);
                            setLocationName(place.formatted_address || place.name || "");
                            setLocationError("");
                            fetchNearbyRestaurants(coords);
                            setShowLocationModal(false);
                            toast.success("Location updated!");
                        }
                    });
                }
            };
            loadGoogleMaps();
        }
    }, [showLocationModal, fetchNearbyRestaurants]);

    const handleRefreshLocation = async () => {
        setLocationLoading(true);
        setLocationError("");
        try {
            const coords = await getCurrentLocation();
            setUserLocation(coords);
            await fetchNearbyRestaurants(coords);
            await reverseGeocode(coords);
            setShowLocationModal(false);
            toast.success("Location fetched successfully!");
        } catch (error: any) {
            console.error("Location error:", error);
            let errorMessage = error.message || "Failed to get location";
            if (error.code === 1) errorMessage = "Location permission denied.";
            else if (error.code === 2) errorMessage = "Location unavailable.";
            else if (error.code === 3) errorMessage = "Location request timed out.";
            setLocationError(errorMessage);
        } finally {
            setLocationLoading(false);
        }
    };

    const filteredRestaurants = restaurants.filter((restaurant) =>
        restaurant.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatPickupTime = (start: string, end: string) => {
        const formatTime = (time: string) => {
            const [hours, minutes] = time.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            return `${displayHour}:${minutes} ${ampm}`;
        };
        return `${formatTime(start)} - ${formatTime(end)}`;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-amber-500/20 text-amber-600 border-amber-500/30';
            case 'confirmed': return 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30';
            case 'completed': return 'bg-blue-500/20 text-blue-600 border-blue-500/30';
            case 'cancelled': return 'bg-red-500/20 text-red-600 border-red-500/30';
            default: return 'bg-primary/20 text-primary border-primary/30';
        }
    };

    return (
        <div className="relative min-h-screen bg-[#FEFCF9] selection:bg-primary selection:text-primary-foreground">
            <Toaster />
            <Header />

            {/* Animated Background Gradients */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{ scale: [1, 1.2, 1], x: [0, 30, 0], y: [0, 20, 0] }}
                    transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-primary/8 via-orange-400/5 to-transparent blur-[100px]"
                />
                <motion.div
                    animate={{ scale: [1.1, 1, 1.1], x: [0, -40, 0], y: [0, -30, 0] }}
                    transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tl from-emerald-500/6 via-teal-400/4 to-transparent blur-[100px]"
                />
                <motion.div
                    animate={{ scale: [1, 1.15, 1], y: [0, 40, 0] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[40%] right-[20%] w-[30%] h-[30%] rounded-full bg-gradient-to-bl from-amber-500/5 to-transparent blur-[80px]"
                />
            </div>

            <main className="pt-28 md:pt-36 pb-24">
                {/* Hero Section - Compact & Colorful */}
                <section className="px-4 sm:px-6 lg:px-12 mb-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                            {/* Left: Welcome + Location */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                                className="flex-1"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center text-white font-serif text-lg shadow-lg shadow-primary/30">
                                        {customer?.name?.charAt(0).toUpperCase() || 'R'}
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Welcome back</p>
                                        <h1 className="text-2xl md:text-3xl font-serif font-light">
                                            {customer?.name?.split(" ")[0] || "Rescuer"}
                                        </h1>
                                    </div>
                                </div>
                                
                                <button
                                    onClick={() => setShowLocationModal(true)}
                                    className="flex items-center gap-3 px-4 py-2 bg-white/60 backdrop-blur-sm border border-primary/10 rounded-full hover:border-primary/30 hover:bg-white transition-all group"
                                >
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                                        <MapPin className="w-3 h-3 text-white" />
                                    </div>
                                    <span className="text-sm font-light truncate max-w-[200px]">
                                        {locationName || "Set your location"}
                                    </span>
                                    <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                                </button>
                            </motion.div>

                            {/* Right: My Rescues Quick Access */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="lg:w-[420px]"
                            >
                                <div className="bg-white/70 backdrop-blur-xl border border-primary/10 rounded-2xl p-5 shadow-xl shadow-black/5">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center shadow-lg shadow-primary/20">
                                                <ShoppingBag className="w-4 h-4 text-white" />
                                            </div>
                                            <h3 className="text-sm font-semibold tracking-tight">My Rescues</h3>
                                        </div>
                                        <Link 
                                            href="/orders" 
                                            className="text-[9px] uppercase tracking-widest text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
                                        >
                                            View All <ChevronRight className="w-3 h-3" />
                                        </Link>
                                    </div>
                                    
                                    {ordersLoading ? (
                                        <div className="h-20 flex items-center justify-center">
                                            <Loader2 className="w-5 h-5 text-primary animate-spin" />
                                        </div>
                                    ) : orders.length > 0 ? (
                                        <div className="space-y-2">
                                            {orders.slice(0, 2).map((order) => (
                                                <Link
                                                    key={order.id}
                                                    href={`/orders/${order.id}`}
                                                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-primary/5 transition-all group"
                                                >
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary/50 to-secondary/20 flex items-center justify-center">
                                                        <Utensils className="w-5 h-5 text-primary/50" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">{order.rescue_bags?.title}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{order.restaurants?.name}</p>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <p className="text-sm font-semibold text-primary">₹{order.total_price}</p>
                                                        <span className={`text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusColor(order.status)}`}>
                                                            {order.status}
                                                        </span>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-20 flex flex-col items-center justify-center text-center">
                                            <ShoppingBag className="w-6 h-6 text-muted-foreground/30 mb-2" />
                                            <p className="text-xs text-muted-foreground">No rescues yet. Start browsing!</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Search Bar - Floating & Premium */}
                <section className="px-4 sm:px-6 lg:px-12 mb-10 sticky top-20 z-30">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white/80 backdrop-blur-xl border border-primary/10 rounded-2xl shadow-2xl shadow-black/5 p-2 flex items-center gap-2"
                        >
                            <div className="flex-1 flex items-center px-4 py-3 group">
                                <Search className="w-5 h-5 text-muted-foreground/50 mr-3 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search restaurants, cuisines..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-transparent border-none focus:ring-0 focus:outline-none w-full text-sm placeholder:text-muted-foreground/40"
                                />
                            </div>
                            <div className="hidden md:flex items-center gap-3 pr-2">
                                <div className="h-8 w-px bg-primary/10" />
                                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-orange-500/10 rounded-xl">
                                    <Flame className="w-4 h-4 text-orange-500" />
                                    <span className="text-xs font-medium text-foreground">{filteredRestaurants.length} Available</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Restaurant Grid */}
                <section className="px-4 sm:px-6 lg:px-12">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="flex items-center gap-4 mb-8"
                        >
                            <h2 className="text-xl font-serif">Nearby Restaurants</h2>
                            <div className="h-px flex-1 bg-gradient-to-r from-primary/20 via-orange-500/10 to-transparent" />
                        </motion.div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-32 space-y-6">
                                <div className="relative w-20 h-20">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                        className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary"
                                    />
                                    <div className="absolute inset-3 rounded-full bg-gradient-to-br from-primary/20 to-orange-500/20 flex items-center justify-center">
                                        <Utensils className="w-6 h-6 text-primary" />
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground font-light animate-pulse">Finding delicious rescues nearby...</p>
                            </div>
                        ) : filteredRestaurants.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-24 bg-gradient-to-br from-white/50 to-secondary/20 rounded-3xl border border-dashed border-primary/20"
                            >
                                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/10 to-orange-500/10 flex items-center justify-center">
                                    <MapPin className="w-8 h-8 text-primary/40" />
                                </div>
                                <h3 className="text-2xl font-serif mb-3">No rescues available</h3>
                                <p className="text-muted-foreground font-light mb-8 max-w-md mx-auto px-4">
                                    We couldn't find any available rescue bags within 7km. Try expanding your search area.
                                </p>
                                <button
                                    onClick={() => setShowLocationModal(true)}
                                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-orange-500 text-white text-xs uppercase tracking-[0.2em] font-medium rounded-full hover:shadow-xl hover:shadow-primary/30 transition-all"
                                >
                                    <MapPin className="w-4 h-4" />
                                    Change Location
                                </button>
                            </motion.div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredRestaurants.map((restaurant, index) => (
                                    <motion.div
                                        key={restaurant.id}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 * (index % 6), duration: 0.6 }}
                                    >
                                        <Link
                                            href={`/restaurant/${restaurant.id}`}
                                            className="group block bg-white rounded-2xl border border-primary/5 hover:border-primary/20 transition-all duration-500 overflow-hidden hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1"
                                        >
                                            {/* Card Image */}
                                            <div className="aspect-[16/10] relative overflow-hidden bg-gradient-to-br from-secondary/30 to-secondary/10">
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
                                                
                                                {/* Badges */}
                                                <div className="absolute top-4 left-4 z-20 flex gap-2">
                                                    <div className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] uppercase tracking-wider font-bold rounded-full shadow-lg">
                                                        50% OFF
                                                    </div>
                                                </div>
                                                <div className="absolute top-4 right-4 z-20">
                                                    <div className="px-3 py-1.5 bg-white/90 backdrop-blur-sm text-[10px] uppercase tracking-wider font-medium rounded-full shadow-lg flex items-center gap-1.5">
                                                        <MapPin className="w-3 h-3 text-primary" />
                                                        {formatDistance(restaurant.distance_km)}
                                                    </div>
                                                </div>

                                                {/* Restaurant Name on Image */}
                                                <div className="absolute bottom-4 left-5 right-5 z-20">
                                                    <h3 className="text-xl font-serif text-white mb-1 group-hover:translate-x-1 transition-transform duration-300">
                                                        {restaurant.name}
                                                    </h3>
                                                    <p className="text-xs text-white/70 font-light italic">
                                                        {restaurant.cuisine_types?.slice(0, 3).join(" • ") || "Multi-cuisine"}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Card Content */}
                                            <div className="p-5">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 rounded-lg">
                                                            <Clock className="w-3 h-3 text-amber-600" />
                                                            <span className="text-[10px] font-medium text-amber-700">
                                                                {restaurant.rescue_bags[0] && formatPickupTime(restaurant.rescue_bags[0].pickup_start_time, restaurant.rescue_bags[0].pickup_end_time)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-right">
                                                            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Available</p>
                                                            <p className="text-sm font-bold text-primary">{restaurant.rescue_bags.length} Bag{restaurant.rescue_bags.length !== 1 ? 's' : ''}</p>
                                                        </div>
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-primary/30">
                                                            <ArrowRight className="w-4 h-4 text-white" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </main>

            {/* Location Modal */}
            <AnimatePresence>
                {showLocationModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/50 backdrop-blur-md"
                            onClick={() => setShowLocationModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl overflow-hidden"
                        >
                            {/* Decorative gradient */}
                            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary via-orange-500 to-amber-500" />
                            
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h3 className="text-2xl font-serif mb-1">Set Location</h3>
                                    <p className="text-sm text-muted-foreground font-light">Find rescue bags near you</p>
                                </div>
                                <button
                                    onClick={() => setShowLocationModal(false)}
                                    className="w-10 h-10 rounded-full bg-secondary/50 hover:bg-secondary flex items-center justify-center transition-colors"
                                >
                                    <X className="w-5 h-5 text-muted-foreground" />
                                </button>
                            </div>

                            {locationError && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 text-sm font-light rounded-xl">
                                    {locationError}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        placeholder="Search for your area..."
                                        className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-transparent focus:border-primary/20 rounded-xl focus:outline-none transition-all text-sm"
                                    />
                                </div>

                                <div className="relative py-3">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-secondary"></div>
                                    </div>
                                    <div className="relative flex justify-center">
                                        <span className="bg-white px-4 text-xs text-muted-foreground">or</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleRefreshLocation}
                                    disabled={locationLoading}
                                    className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-primary to-orange-500 text-white font-medium rounded-xl hover:shadow-xl hover:shadow-primary/30 transition-all disabled:opacity-50"
                                >
                                    {locationLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Navigation className="w-5 h-5" />
                                    )}
                                    <span>Use Current Location</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Footer */}
            <footer className="py-8 px-6 border-t border-primary/5 bg-white/50">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-muted-foreground font-light">Latebites • Coimbatore, India</p>
                    <p className="text-xs text-muted-foreground/60">© 2024 All rights reserved</p>
                </div>
            </footer>
        </div>
    );
}
