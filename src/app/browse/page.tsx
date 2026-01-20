"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrentLocation, formatDistance, type Coordinates } from "@/lib/location/geolocation";
import { MapPin, Search, Clock, X, Navigation, Loader2, ArrowRight, ShoppingBag, Timer, ChevronRight, User, Utensils, Flame, Map, Filter, Bell, Heart, History } from "lucide-react";
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

    const searchInputRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const supabase = createClient();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/?auth=customer');
        }
    }, [authLoading, user, router]);

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

        const locationTimeout = setTimeout(() => {
            if (loading && !userLocation) {
                setLoading(false);
                setLocationError("Location request timed out. Please set your location manually.");
                setShowLocationModal(true);
            }
        }, 5000);

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

    return (
        <div className="relative min-h-screen bg-[#F7F4EB] selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
            <Toaster />
            <Header />

            <main className="pt-24 md:pt-32 pb-24 relative">
                {/* Hero Section with Dark Green and Navy */}
                <section className="px-4 sm:px-6 lg:px-12 mb-16 relative z-40">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="relative overflow-hidden rounded-[48px] bg-[#0B1E0F] p-8 md:p-16 text-[#F7F4EB] shadow-2xl shadow-[#001220]/20"
                        >
                            {/* Decorative Pattern Overlay */}
                            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#F7F4EB 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
                            <div className="absolute inset-0 bg-gradient-to-br from-[#001220]/80 via-transparent to-transparent pointer-events-none" />

                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                                <div className="space-y-6 max-w-2xl text-center md:text-left">
                                    <div className="flex items-center justify-center md:justify-start gap-3">
                                        <div className="h-[1px] w-8 bg-[#F7F4EB]/30" />
                                        <p className="text-[10px] uppercase tracking-[0.4em] font-light text-[#F7F4EB]/60">Welcome back, {customer?.name?.split(" ")[0] || "Rescuer"}</p>
                                    </div>
                                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif leading-[1.1]">
                                        What are we <span className="italic text-[#E9E5D9]">rescuing</span> today?
                                    </h1>
                                    <p className="text-lg text-[#F7F4EB]/70 font-light max-w-lg mx-auto md:mx-0">
                                        Mystery bags from nearby kitchens. High quality, zero waste, perfectly premium.
                                    </p>
                                    
                                    <div className="pt-4">
                                        <button
                                            onClick={() => setShowLocationModal(true)}
                                            className="group inline-flex items-center gap-4 px-8 py-4 bg-[#F7F4EB] text-[#0B1E0F] rounded-2xl hover:bg-white transition-all duration-300 shadow-xl shadow-black/20"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-[#0B1E0F]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <MapPin className="w-5 h-5 text-[#0B1E0F]" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[9px] uppercase tracking-widest text-[#0B1E0F]/60 leading-none mb-1">Current Target</p>
                                                <p className="text-base font-medium truncate max-w-[200px]">
                                                    {locationName || "Detecting Location..."}
                                                </p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-[#0B1E0F]/40 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>

                                <div className="hidden lg:block relative">
                                    <div className="w-80 h-80 rounded-[40px] bg-[#001220] border border-[#F7F4EB]/10 flex items-center justify-center relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-[#0B1E0F] to-transparent opacity-50" />
                                        <ShoppingBag className="w-32 h-32 text-[#F7F4EB]/20 animate-pulse" />
                                        <div className="absolute bottom-6 left-6 right-6 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                                            <p className="text-[10px] uppercase tracking-widest text-white/60 mb-1">Live Updates</p>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                                <span className="text-sm font-medium">{filteredRestaurants.length} Mystery Bags Found</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Search Bar Section */}
                <section className="px-4 sm:px-6 lg:px-12 mb-16 relative z-40">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative group">
                                <div className="absolute inset-0 bg-[#0B1E0F]/10 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                                <div className="relative bg-white border border-[#0B1E0F]/10 rounded-3xl shadow-2xl shadow-[#001220]/5 p-2 flex items-center">
                                    <div className="flex-1 flex items-center px-6 py-4">
                                        <Search className="w-6 h-6 text-[#0B1E0F]/20 mr-4 group-focus-within:text-[#0B1E0F] group-focus-within:scale-110 transition-all duration-300" />
                                        <input
                                            type="text"
                                            placeholder="Search restaurants, cuisines..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="bg-transparent border-none focus:ring-0 focus:outline-none w-full text-lg placeholder:text-[#0B1E0F]/30 font-light"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <button className="h-[76px] px-8 bg-[#001220] text-[#F7F4EB] rounded-3xl flex items-center justify-center hover:bg-[#0B1E0F] transition-all duration-300 shadow-xl shadow-[#001220]/10">
                                <Filter className="w-6 h-6 mr-3" />
                                <span className="text-sm font-bold uppercase tracking-widest">Filters</span>
                            </button>
                        </div>
                    </div>
                </section>

                {/* Main Content Grid */}
                <section className="px-4 sm:px-6 lg:px-12">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center justify-between mb-12">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-4"
                            >
                                <div className="w-2 h-10 bg-[#0B1E0F] rounded-full shadow-[0_0_20px_rgba(11,30,15,0.3)]" />
                                <h2 className="text-3xl md:text-4xl font-serif">Curated Collections</h2>
                            </motion.div>
                            <div className="flex gap-4">
                                <button className="px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-[#F7F4EB] bg-[#001220] rounded-full hover:bg-[#0B1E0F] transition-colors">Distance</button>
                                <button className="px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-[#0B1E0F]/60 hover:text-[#0B1E0F] transition-colors">Popularity</button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="py-40 flex flex-col items-center justify-center">
                                <div className="relative mb-12">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                        className="w-32 h-32 rounded-full border-[2px] border-[#0B1E0F]/5 border-t-[#0B1E0F] shadow-2xl"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Utensils className="w-10 h-10 text-[#0B1E0F] animate-pulse" />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-serif mb-3">Assembling your menu...</h3>
                                <p className="text-base text-[#0B1E0F]/50 font-light tracking-wide max-w-xs text-center">
                                    Connecting with premium local kitchens to find the finest mystery bags.
                                </p>
                            </div>
                        ) : filteredRestaurants.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="relative py-32 rounded-[64px] overflow-hidden border border-[#0B1E0F]/10 bg-white shadow-3xl shadow-[#001220]/5"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#0B1E0F]/20 to-transparent" />
                                <div className="relative z-10 text-center px-6">
                                    <div className="w-32 h-32 mx-auto mb-10 relative">
                                        <div className="absolute inset-0 bg-[#0B1E0F]/5 rounded-full animate-ping opacity-20" />
                                        <div className="relative w-full h-full rounded-full bg-gradient-to-br from-[#0B1E0F]/5 to-[#001220]/5 flex items-center justify-center border border-[#0B1E0F]/10">
                                            <Map className="w-12 h-12 text-[#0B1E0F]/30" />
                                        </div>
                                    </div>
                                    <h3 className="text-4xl md:text-5xl font-serif mb-6">A bit quiet here</h3>
                                    <p className="text-[#0B1E0F]/50 font-light mb-12 max-w-lg mx-auto text-xl leading-relaxed">
                                        No active mystery bags within <span className="text-[#0B1E0F] font-medium">7km</span>. Try a different area or re-scan.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-6 justify-center">
                                        <button
                                            onClick={() => setShowLocationModal(true)}
                                            className="inline-flex items-center justify-center gap-4 px-12 py-6 bg-[#001220] text-[#F7F4EB] text-[12px] uppercase tracking-[0.4em] font-bold rounded-2xl hover:bg-[#0B1E0F] transition-all duration-500 active:scale-95 shadow-2xl shadow-[#001220]/20"
                                        >
                                            <MapPin className="w-5 h-5" />
                                            Change Target
                                        </button>
                                        <button
                                            onClick={handleRefreshLocation}
                                            className="inline-flex items-center justify-center gap-4 px-12 py-6 bg-white border border-[#0B1E0F]/10 text-[#0B1E0F] text-[12px] uppercase tracking-[0.4em] font-bold rounded-2xl hover:bg-[#F7F4EB] transition-all duration-500"
                                        >
                                            <Navigation className="w-5 h-5" />
                                            Re-scan
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                {filteredRestaurants.map((restaurant, index) => (
                                    <motion.div
                                        key={restaurant.id}
                                        initial={{ opacity: 0, y: 40 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 * (index % 6), duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                    >
                                        <Link
                                            href={`/restaurant/${restaurant.id}`}
                                            className="group block bg-white rounded-[40px] border border-[#0B1E0F]/5 hover:border-[#0B1E0F]/20 transition-all duration-700 overflow-hidden hover:shadow-[0_50px_100px_-20px_rgba(11,30,15,0.15)] hover:-translate-y-3 relative"
                                        >
                                            <div className="aspect-[14/11] relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1E0F]/90 via-[#0B1E0F]/20 to-transparent z-10" />
                                                <motion.img 
                                                    src={restaurant.cover_image_url || "/images/hero-indian-food.png"} 
                                                    alt={restaurant.name}
                                                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                                />
                                                <div className="absolute top-6 left-6 z-20">
                                                    <div className="px-5 py-2.5 bg-gradient-to-r from-[#0B1E0F] to-[#001220] text-[#F7F4EB] text-[11px] uppercase tracking-[0.3em] font-bold rounded-2xl shadow-2xl border border-white/10">
                                                        Premium Selection
                                                    </div>
                                                </div>
                                                <div className="absolute top-6 right-6 z-20">
                                                    <div className="px-5 py-2.5 bg-white/95 backdrop-blur-md text-[#0B1E0F] text-[12px] font-bold rounded-2xl shadow-2xl flex items-center gap-3">
                                                        <Navigation className="w-4 h-4 text-[#0B1E0F]" />
                                                        {formatDistance(restaurant.distance_km)}
                                                    </div>
                                                </div>
                                                <div className="absolute bottom-8 left-8 right-8 z-20">
                                                    <h3 className="text-3xl md:text-4xl font-serif text-[#F7F4EB] mb-3 leading-tight group-hover:translate-x-2 transition-transform duration-500">
                                                        {restaurant.name}
                                                    </h3>
                                                    <div className="flex items-center gap-3 text-[#F7F4EB]/70">
                                                        <Utensils className="w-4 h-4" />
                                                        <p className="text-sm font-light tracking-widest italic">
                                                            {restaurant.cuisine_types?.slice(0, 2).join(" • ") || "Artisanal Kitchen"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-8">
                                                <div className="flex items-center justify-between">
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-3 px-4 py-2 bg-[#F7F4EB] border border-[#0B1E0F]/5 rounded-2xl w-fit">
                                                            <Clock className="w-4 h-4 text-[#0B1E0F]" />
                                                            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0B1E0F]">
                                                                {restaurant.rescue_bags[0] && formatPickupTime(restaurant.rescue_bags[0].pickup_start_time, restaurant.rescue_bags[0].pickup_end_time)}
                                                            </span>
                                                        </div>
                                                        <div className="flex -space-x-3">
                                                            {[1, 2, 3].map(i => (
                                                                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-[#E9E5D9] flex items-center justify-center">
                                                                    <User className="w-4 h-4 text-[#0B1E0F]/40" />
                                                                </div>
                                                            ))}
                                                            <span className="ml-5 text-[11px] text-[#0B1E0F]/40 font-medium self-center">+24 people rescued here</span>
                                                        </div>
                                                    </div>
                                                    <div className="relative group/btn">
                                                        <div className="absolute inset-0 bg-[#0B1E0F]/20 blur-2xl group-hover/btn:opacity-100 opacity-0 transition-opacity duration-500" />
                                                        <div className="relative w-16 h-16 rounded-[24px] bg-[#001220] text-[#F7F4EB] flex items-center justify-center group-hover:bg-[#0B1E0F] transition-all duration-500 shadow-xl shadow-[#001220]/20">
                                                            <ArrowRight className="w-7 h-7 group-hover:translate-x-1 transition-transform" />
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

            {/* Location Modal - Redesigned with Navy/Green */}
            <AnimatePresence>
                {showLocationModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-[#001220]/80 backdrop-blur-2xl"
                            onClick={() => setShowLocationModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 40 }}
                            transition={{ type: "spring", damping: 30, stiffness: 400 }}
                            className="relative w-full max-w-xl bg-[#F7F4EB] rounded-[56px] p-12 shadow-[0_100px_150px_-30px_rgba(0,0,0,0.5)] overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-[#0B1E0F] via-[#001220] to-[#0B1E0F]" />
                            
                            <div className="flex justify-between items-start mb-12">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="w-10 h-10 rounded-2xl bg-[#0B1E0F]/10 flex items-center justify-center">
                                            <MapPin className="w-5 h-5 text-[#0B1E0F]" />
                                        </div>
                                        <h3 className="text-4xl font-serif text-[#0B1E0F]">Deployment Area</h3>
                                    </div>
                                    <p className="text-[#0B1E0F]/60 font-light text-lg tracking-wide">Enter coordinates to find active mystery bags.</p>
                                </div>
                                <button
                                    onClick={() => setShowLocationModal(false)}
                                    className="w-14 h-14 rounded-[24px] bg-[#E9E5D9] hover:bg-[#001220] hover:text-[#F7F4EB] flex items-center justify-center transition-all duration-300 shadow-inner"
                                >
                                    <X className="w-7 h-7" />
                                </button>
                            </div>

                            {locationError && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mb-10 p-6 bg-red-500/5 border border-red-500/10 text-red-700 text-sm font-medium rounded-3xl flex gap-4 items-center"
                                >
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                                    {locationError}
                                </motion.div>
                            )}

                            <div className="space-y-8">
                                <div className="relative group">
                                    <div className="absolute -inset-1.5 bg-[#0B1E0F]/10 rounded-[32px] blur-xl opacity-0 group-focus-within:opacity-100 transition duration-700" />
                                    <div className="relative">
                                        <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-7 h-7 text-[#0B1E0F]/20 group-focus-within:text-[#0B1E0F] transition-colors" />
                                        <input
                                            ref={searchInputRef}
                                            type="text"
                                            placeholder="Where should we look?"
                                            className="w-full pl-18 pr-8 py-7 bg-white border border-[#0B1E0F]/5 rounded-[30px] focus:ring-0 focus:outline-none transition-all text-lg placeholder:text-[#0B1E0F]/20 font-light shadow-inner"
                                        />
                                    </div>
                                </div>

                                <div className="relative py-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-[#0B1E0F]/5"></div>
                                    </div>
                                    <div className="relative flex justify-center">
                                        <span className="bg-[#F7F4EB] px-8 text-[11px] uppercase tracking-[0.5em] text-[#0B1E0F]/40 font-black">Sync Protocol</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleRefreshLocation}
                                    disabled={locationLoading}
                                    className="w-full flex items-center justify-center gap-5 py-7 bg-[#001220] text-[#F7F4EB] text-[12px] uppercase tracking-[0.5em] font-black rounded-[30px] hover:bg-[#0B1E0F] hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] transition-all duration-500 disabled:opacity-50 relative group overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                    {locationLoading ? (
                                        <Loader2 className="w-7 h-7 animate-spin" />
                                    ) : (
                                        <Navigation className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                                    )}
                                    <span>Sync GPS Location</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-[#0B1E0F]/10 bg-[#F7F4EB]">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-sm font-serif italic text-[#0B1E0F]">Latebites</p>
                    <div className="flex gap-8">
                        <Link href="/help" className="text-xs text-[#0B1E0F]/50 hover:text-[#0B1E0F] transition-colors">Help</Link>
                        <Link href="/profile" className="text-xs text-[#0B1E0F]/50 hover:text-[#0B1E0F] transition-colors">Privacy</Link>
                    </div>
                    <p className="text-xs text-[#0B1E0F]/40">© 2024 Latebites</p>
                </div>
            </footer>
        </div>
    );
}
