"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrentLocation, formatDistance, type Coordinates } from "@/lib/location/geolocation";
import { MapPin, Search, Clock, X, Navigation, Loader2, ArrowRight, ShoppingBag, Timer, ChevronRight, User, Utensils, Star, Flame, Map, Filter, Bell, Heart, History } from "lucide-react";
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

    const fetchOrders = useCallback(async () => {
        if (!customer?.id) {
            setOrdersLoading(false);
            return;
        }
        try {
            const { data, error } = await supabase
                .from("orders")
                .select(`*, rescue_bags (*), restaurants (*)`)
                .eq("customer_id", customer.id)
                .order("created_at", { ascending: false })
                .limit(3);

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setOrdersLoading(false);
        }
    }, [customer?.id, supabase]);

    useEffect(() => {
        if (customer) {
            fetchOrders();
        } else if (!authLoading && !user) {
            setOrdersLoading(false);
        }
    }, [customer, user, authLoading, fetchOrders]);

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
            // Don't toast error if it's just no restaurants found
            if (!error.message.includes("Failed to fetch")) {
                toast.error(error.message || "Failed to load restaurants");
            }
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
        if (!user || authLoading) return;

        // Set a maximum wait time for location
        const locationTimeout = setTimeout(() => {
            if (loading && !userLocation) {
                setLoading(false);
                setLocationError("Location request timed out. Please set your location manually.");
                setShowLocationModal(true);
            }
        }, 8000);

        getCurrentLocation()
            .then((coords) => {
                clearTimeout(locationTimeout);
                setUserLocation(coords);
                fetchNearbyRestaurants(coords);
                reverseGeocode(coords);
            })
            .catch((error) => {
                clearTimeout(locationTimeout);
                console.error("Location error:", error);
                setLocationError(error.message);
                setLoading(false);
                // If it's the initial load and location fails, show modal
                if (!userLocation) {
                    setShowLocationModal(true);
                }
            });

        return () => clearTimeout(locationTimeout);
    }, [user, authLoading, fetchNearbyRestaurants]);

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
        <div className="relative min-h-screen bg-[#FEFCF9] selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
            <Toaster />
            <Header />

            {/* Premium Dynamic Background */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{ 
                        scale: [1, 1.3, 1], 
                        x: [0, 50, 0], 
                        y: [0, 30, 0],
                        opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-primary/15 via-orange-400/10 to-transparent blur-[120px]"
                />
                <motion.div
                    animate={{ 
                        scale: [1.2, 1, 1.2], 
                        x: [0, -60, 0], 
                        y: [0, -40, 0],
                        opacity: [0.2, 0.4, 0.2]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tl from-emerald-500/10 via-teal-400/8 to-transparent blur-[120px]"
                />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay" />
            </div>

            <main className="pt-24 md:pt-32 pb-24 relative">
                {/* Dashboard Header */}
                <section className="px-4 sm:px-6 lg:px-12 mb-10">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            {/* Left: Identity & Location */}
                            <div className="lg:col-span-7 space-y-8">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-5"
                                >
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-orange-500 to-amber-500 flex items-center justify-center text-white font-serif text-2xl shadow-2xl shadow-primary/20 transform rotate-3">
                                            {customer?.name?.charAt(0).toUpperCase() || 'R'}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[11px] uppercase tracking-[0.4em] text-muted-foreground font-medium mb-1">Authenticated Rescuer</p>
                                        <h1 className="text-3xl md:text-4xl font-serif font-light tracking-tight">
                                            Bonjour, <span className="italic">{customer?.name?.split(" ")[0] || "Rescuer"}</span>
                                        </h1>
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="flex flex-wrap gap-3"
                                >
                                    <button
                                        onClick={() => setShowLocationModal(true)}
                                        className="group flex items-center gap-3 px-6 py-3 bg-white border border-primary/10 rounded-2xl hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
                                    >
                                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <MapPin className="w-4 h-4 text-primary" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[9px] uppercase tracking-widest text-muted-foreground leading-none mb-1">Current Location</p>
                                            <p className="text-sm font-medium truncate max-w-[180px]">
                                                {locationName || "Detecting location..."}
                                            </p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                    </button>

                                    <div className="flex items-center gap-3 px-6 py-3 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-xs font-medium text-emerald-700 tracking-wide">Live Updates Enabled</span>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Right: Quick Stats/Orders Glass Card */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 }}
                                className="lg:col-span-5"
                            >
                                <div className="bg-white/40 backdrop-blur-2xl border border-white/40 rounded-[32px] p-6 shadow-2xl shadow-black/[0.03] relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 transform translate-x-4 -translate-y-4">
                                        <ShoppingBag className="w-32 h-32" />
                                    </div>
                                    
                                    <div className="flex items-center justify-between mb-6 relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white">
                                                <History className="w-5 h-5" />
                                            </div>
                                            <h3 className="font-serif text-lg">Recent Rescues</h3>
                                        </div>
                                        <Link 
                                            href="/orders" 
                                            className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary hover:tracking-[0.3em] transition-all flex items-center gap-2"
                                        >
                                            View Archive <ArrowRight className="w-3 h-3" />
                                        </Link>
                                    </div>

                                    <div className="space-y-3 relative z-10">
                                        {ordersLoading ? (
                                            <div className="h-24 flex items-center justify-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Loading Activity</p>
                                                </div>
                                            </div>
                                        ) : orders.length > 0 ? (
                                            orders.slice(0, 2).map((order) => (
                                                <Link
                                                    key={order.id}
                                                    href={`/orders/${order.id}`}
                                                    className="flex items-center gap-4 p-3.5 rounded-2xl bg-white/60 hover:bg-white hover:shadow-lg transition-all duration-300 group/item"
                                                >
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary/80 to-secondary/40 flex items-center justify-center overflow-hidden">
                                                        {order.restaurants?.profile_image_url ? (
                                                            <img src={order.restaurants.profile_image_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Utensils className="w-5 h-5 text-primary/40" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold truncate group-hover/item:text-primary transition-colors">{order.rescue_bags?.title}</p>
                                                        <p className="text-[11px] text-muted-foreground truncate">{order.restaurants?.name}</p>
                                                    </div>
                                                    <div className="text-right flex flex-col items-end gap-1">
                                                        <p className="text-sm font-bold">₹{order.total_price}</p>
                                                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getStatusColor(order.status)}`}>
                                                            {order.status}
                                                        </span>
                                                    </div>
                                                </Link>
                                            ))
                                        ) : (
                                            <div className="py-8 flex flex-col items-center justify-center text-center bg-white/30 rounded-2xl border border-dashed border-primary/20">
                                                <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center mb-3">
                                                    <ShoppingBag className="w-6 h-6 text-primary/20" />
                                                </div>
                                                <p className="text-xs text-muted-foreground font-light px-6">
                                                    Your rescue journey hasn't started yet. <br />
                                                    <span className="text-primary font-medium">Bags are waiting nearby!</span>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Search & Filter Bar */}
                <section className="px-4 sm:px-6 lg:px-12 mb-12 sticky top-20 z-40">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="flex flex-col md:flex-row gap-4"
                        >
                            <div className="flex-1 relative group">
                                <div className="absolute inset-0 bg-primary/20 blur-2xl opacity-0 group-focus-within:opacity-30 transition-opacity duration-500" />
                                <div className="relative bg-white border border-primary/10 rounded-2xl shadow-xl shadow-black/5 p-2 flex items-center">
                                    <div className="flex-1 flex items-center px-4 py-3">
                                        <Search className="w-5 h-5 text-muted-foreground/30 mr-4 group-focus-within:text-primary group-focus-within:scale-110 transition-all duration-300" />
                                        <input
                                            type="text"
                                            placeholder="Crave something? Search restaurants or cuisines..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="bg-transparent border-none focus:ring-0 focus:outline-none w-full text-base placeholder:text-muted-foreground/40 font-light"
                                        />
                                    </div>
                                    <div className="hidden md:flex items-center gap-4 pr-3">
                                        <div className="h-10 w-px bg-primary/10" />
                                        <div className="flex items-center gap-3 px-5 py-2.5 bg-gradient-to-r from-primary to-orange-500 rounded-xl shadow-lg shadow-primary/20 text-white">
                                            <Flame className="w-4 h-4" />
                                            <span className="text-xs font-bold uppercase tracking-wider">{filteredRestaurants.length} Active Rescues</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <button className="md:w-14 h-14 bg-white border border-primary/10 rounded-2xl flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-300 shadow-lg shadow-black/5">
                                <Filter className="w-5 h-5" />
                            </button>
                        </motion.div>
                    </div>
                </section>

                {/* Main Content Grid */}
                <section className="px-4 sm:px-6 lg:px-12">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center justify-between mb-10">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-4"
                            >
                                <div className="w-1.5 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" />
                                <h2 className="text-2xl md:text-3xl font-serif">Curated Collections</h2>
                            </motion.div>
                            <div className="flex gap-2">
                                <button className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary bg-primary/5 rounded-full hover:bg-primary/10 transition-colors">Distance</button>
                                <button className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Popularity</button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="py-32 flex flex-col items-center justify-center">
                                <div className="relative mb-10">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                        className="w-24 h-24 rounded-full border-[3px] border-primary/10 border-t-primary shadow-2xl"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Utensils className="w-8 h-8 text-primary animate-bounce" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-serif mb-2">Assembling your menu...</h3>
                                <p className="text-sm text-muted-foreground font-light tracking-wide max-w-xs text-center">
                                    We're connecting with local kitchens to find the freshest surplus available for you.
                                </p>
                            </div>
                        ) : filteredRestaurants.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="relative py-24 rounded-[48px] overflow-hidden border border-primary/10 bg-white shadow-2xl shadow-black/[0.02]"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                                <div className="relative z-10 text-center px-6">
                                    <div className="w-28 h-28 mx-auto mb-10 relative">
                                        <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping opacity-20" />
                                        <div className="relative w-full h-full rounded-full bg-gradient-to-br from-primary/5 to-orange-500/5 flex items-center justify-center border border-primary/10">
                                            <Map className="w-10 h-10 text-primary/40" />
                                        </div>
                                    </div>
                                    <h3 className="text-3xl md:text-4xl font-serif mb-4">A bit quiet in this area</h3>
                                    <p className="text-muted-foreground font-light mb-12 max-w-lg mx-auto text-lg leading-relaxed">
                                        We couldn't find any active rescue bags within <span className="text-primary font-medium">7 kilometers</span> of your current location. Let's try another spot?
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                        <button
                                            onClick={() => setShowLocationModal(true)}
                                            className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-black text-white text-[11px] uppercase tracking-[0.3em] font-bold rounded-2xl hover:bg-primary hover:shadow-2xl hover:shadow-primary/30 transition-all duration-500 active:scale-95"
                                        >
                                            <MapPin className="w-4 h-4" />
                                            Change Target Area
                                        </button>
                                        <button
                                            onClick={handleRefreshLocation}
                                            className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-white border border-black/10 text-black text-[11px] uppercase tracking-[0.3em] font-bold rounded-2xl hover:bg-secondary transition-all duration-500"
                                        >
                                            <Navigation className="w-4 h-4" />
                                            Re-scan Current
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredRestaurants.map((restaurant, index) => (
                                    <motion.div
                                        key={restaurant.id}
                                        initial={{ opacity: 0, y: 40 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 * (index % 6), duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                                    >
                                        <Link
                                            href={`/restaurant/${restaurant.id}`}
                                            className="group block bg-white rounded-[32px] border border-primary/5 hover:border-primary/20 transition-all duration-700 overflow-hidden hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] hover:-translate-y-2 relative"
                                        >
                                            {/* Card Image Wrapper */}
                                            <div className="aspect-[14/10] relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                                                
                                                {/* Hover Zoom Image */}
                                                <motion.img 
                                                    src={restaurant.cover_image_url || "/images/hero-indian-food.png"} 
                                                    alt={restaurant.name}
                                                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                                />

                                                {/* Top Badges */}
                                                <div className="absolute top-5 left-5 z-20 flex flex-col gap-2">
                                                    <div className="px-4 py-2 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-500 text-white text-[10px] uppercase tracking-[0.2em] font-black rounded-xl shadow-2xl">
                                                        50% OFF MIN.
                                                    </div>
                                                </div>
                                                
                                                <div className="absolute top-5 right-5 z-20">
                                                    <div className="px-4 py-2 bg-white/95 backdrop-blur-md text-[11px] font-bold rounded-xl shadow-2xl flex items-center gap-2">
                                                        <Navigation className="w-3.5 h-3.5 text-primary" />
                                                        {formatDistance(restaurant.distance_km)}
                                                    </div>
                                                </div>

                                                {/* Restaurant Title Info Overlay */}
                                                <div className="absolute bottom-6 left-6 right-6 z-20">
                                                    <h3 className="text-2xl md:text-3xl font-serif text-white mb-2 leading-tight group-hover:translate-x-2 transition-transform duration-500">
                                                        {restaurant.name}
                                                    </h3>
                                                    <div className="flex items-center gap-2 text-white/80">
                                                        <Utensils className="w-3.5 h-3.5" />
                                                        <p className="text-xs font-light tracking-wide italic">
                                                            {restaurant.cuisine_types?.slice(0, 2).join(" • ") || "Artisanal Kitchen"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Footer Content */}
                                            <div className="p-7">
                                                <div className="flex items-center justify-between">
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 rounded-xl w-fit">
                                                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">
                                                                {restaurant.rescue_bags[0] && formatPickupTime(restaurant.rescue_bags[0].pickup_start_time, restaurant.rescue_bags[0].pickup_end_time)}
                                                            </span>
                                                        </div>
                                                        <div className="flex -space-x-2">
                                                            {[1, 2, 3].map(i => (
                                                                <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-secondary flex items-center justify-center">
                                                                    <User className="w-3 h-3 text-muted-foreground" />
                                                                </div>
                                                            ))}
                                                            <span className="ml-4 text-[10px] text-muted-foreground font-medium self-center">+12 others rescued here today</span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="relative">
                                                        <div className="absolute inset-0 bg-primary/20 blur-xl group-hover:opacity-100 opacity-0 transition-opacity duration-500" />
                                                        <div className="relative w-14 h-14 rounded-[20px] bg-black text-white flex items-center justify-center group-hover:bg-primary transition-all duration-500 group-hover:rotate-6">
                                                            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
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

            {/* Location Modal - Premium Redesign */}
            <AnimatePresence>
                {showLocationModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-xl"
                            onClick={() => setShowLocationModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 40 }}
                            transition={{ type: "spring", damping: 30, stiffness: 400 }}
                            className="relative w-full max-w-lg bg-white rounded-[40px] p-10 shadow-2xl overflow-hidden"
                        >
                            {/* Decorative element */}
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-orange-500 to-emerald-500" />
                            
                            <div className="flex justify-between items-start mb-10">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <MapPin className="w-4 h-4 text-primary" />
                                        </div>
                                        <h3 className="text-3xl font-serif">Deployment Area</h3>
                                    </div>
                                    <p className="text-muted-foreground font-light text-base tracking-wide">Enter your coordinates to find active rescues.</p>
                                </div>
                                <button
                                    onClick={() => setShowLocationModal(false)}
                                    className="w-12 h-12 rounded-2xl bg-secondary/50 hover:bg-black hover:text-white flex items-center justify-center transition-all duration-300"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {locationError && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mb-8 p-5 bg-red-500/5 border border-red-500/20 text-red-600 text-sm font-medium rounded-2xl flex gap-3 items-center"
                                >
                                    <div className="w-2 h-2 rounded-full bg-red-500" />
                                    {locationError}
                                </motion.div>
                            )}

                            <div className="space-y-6">
                                <div className="relative group">
                                    <div className="absolute -inset-1 bg-primary/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
                                    <div className="relative">
                                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                                        <input
                                            ref={searchInputRef}
                                            type="text"
                                            placeholder="Where should we look?"
                                            className="w-full pl-14 pr-6 py-5 bg-secondary/30 border-none rounded-2xl focus:ring-0 focus:outline-none transition-all text-base placeholder:text-muted-foreground/40 font-light"
                                        />
                                    </div>
                                </div>

                                <div className="relative py-4">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-secondary"></div>
                                    </div>
                                    <div className="relative flex justify-center">
                                        <span className="bg-white px-6 text-[10px] uppercase tracking-[0.4em] text-muted-foreground font-black">Scanning Frequency</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleRefreshLocation}
                                    disabled={locationLoading}
                                    className="w-full flex items-center justify-center gap-4 py-6 bg-black text-white text-[11px] uppercase tracking-[0.4em] font-black rounded-2xl hover:bg-primary hover:shadow-2xl hover:shadow-primary/40 transition-all duration-500 disabled:opacity-50 relative group overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                    {locationLoading ? (
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    ) : (
                                        <Navigation className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                    )}
                                    <span>Sync Current Location</span>
                                </button>
                                
                                <p className="text-[10px] text-center text-muted-foreground/60 uppercase tracking-widest leading-relaxed">
                                    We use your location only to surface the most relevant rescues within a 7km radius. Your privacy is paramount.
                                </p>
                            </div>
                        </motion.div>
                    </div>
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
