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
    dietary_info?: string[];
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
        // Only redirect if auth is done loading AND user is not authenticated
        // This prevents redirect loop during OAuth callback
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
        <div className="relative min-h-screen bg-[#FAFAFA] selection:bg-emerald-700 selection:text-white overflow-x-hidden">
            <Toaster />
            <Header />

            <main className="pt-20 md:pt-28 pb-28 relative">
                {/* Hero Section */}
                <section className="px-4 sm:px-6 lg:px-12 mb-6 relative z-40">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B1E0F] via-[#142318] to-[#1a2e1f] p-6 md:p-12 text-white shadow-2xl shadow-[#0B1E0F]/30"
                        >
                            {/* Animated Decorative Orbs */}
                            <motion.div
                                animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [0.05, 0.1, 0.05]
                                }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"
                            />
                            <motion.div
                                animate={{
                                    scale: [1, 1.3, 1],
                                    opacity: [0.1, 0.15, 0.1]
                                }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"
                            />

                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="space-y-4 max-w-xl text-center md:text-left">
                                    <motion.h1
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2, duration: 0.6 }}
                                        className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1]"
                                    >
                                        Hey, <span className="text-emerald-300">{customer?.name?.split(" ")[0] || "there"}!</span>
                                        <motion.span
                                            animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                                            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
                                            className="inline-block ml-2 origin-bottom-right"
                                        >
                                            👋
                                        </motion.span>
                                    </motion.h1>
                                    <motion.p
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4, duration: 0.6 }}
                                        className="text-base sm:text-xl md:text-2xl text-white/80 font-light max-w-md"
                                    >
                                        Discover <span className="font-semibold text-white">Mystery Bags</span> from premium restaurants near you
                                    </motion.p>

                                    <motion.button
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.6, duration: 0.6 }}
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setShowLocationModal(true)}
                                        className="group inline-flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 bg-white text-gray-900 rounded-2xl hover:shadow-xl transition-all duration-300"
                                    >
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] sm:text-xs uppercase tracking-wider text-gray-500 leading-none mb-1">Your Location</p>
                                            <p className="text-sm sm:text-base font-semibold truncate max-w-[160px] sm:max-w-[200px]">
                                                {locationName || "Set your location"}
                                            </p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                                    </motion.button>
                                </div>

                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.4, duration: 0.6 }}
                                    className="hidden lg:flex items-center gap-6"
                                >
                                    <motion.div
                                        whileHover={{ scale: 1.05, y: -4 }}
                                        className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10 cursor-default"
                                    >
                                        <motion.p
                                            key={filteredRestaurants.length}
                                            initial={{ scale: 1.3, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="text-4xl font-bold"
                                        >
                                            {filteredRestaurants.length}
                                        </motion.p>
                                        <p className="text-sm text-white/70">Available</p>
                                    </motion.div>
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Search + Filter Row */}
                <section className="px-4 sm:px-6 lg:px-12 mb-6 relative z-40">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex gap-2">
                            <div className="flex-1 relative bg-white border border-gray-200 rounded-2xl shadow-sm flex items-center px-4 py-3">
                                <Search className="w-4 h-4 text-gray-400 mr-2.5 flex-shrink-0" />
                                <input
                                    type="text"
                                    placeholder="Search restaurants or cuisines..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-transparent border-none focus:ring-0 focus:outline-none w-full text-sm placeholder:text-gray-400"
                                />
                            </div>
                            <button className="flex-shrink-0 h-12 px-4 bg-gray-900 text-white rounded-2xl flex items-center gap-1.5 hover:bg-gray-800 transition-colors shadow-sm">
                                <Filter className="w-4 h-4" />
                                <span className="text-sm font-medium">Filters</span>
                            </button>
                        </div>
                    </div>
                </section>

                {/* Main Content Grid */}
                <section className="px-4 sm:px-6 lg:px-12">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2.5">
                                <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
                                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 whitespace-nowrap">Nearby Mystery Bags</h2>
                            </div>
                            <div className="flex gap-1.5 flex-shrink-0">
                                <button className="px-3 py-1.5 text-xs font-semibold text-white bg-[#0B1E0F] rounded-full whitespace-nowrap">Nearest</button>
                                <button className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap">Best Value</button>
                            </div>
                        </div>

                        {loading ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="py-32 flex flex-col items-center justify-center"
                            >
                                <div className="relative mb-8">
                                    {/* Outer pulsing ring */}
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="absolute inset-0 w-20 h-20 rounded-full bg-emerald-500"
                                    />
                                    {/* Spinning ring */}
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                        className="w-20 h-20 rounded-full border-4 border-gray-200 border-t-emerald-600"
                                    />
                                    {/* Center icon */}
                                    <motion.div
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                        className="absolute inset-0 flex items-center justify-center"
                                    >
                                        <ShoppingBag className="w-8 h-8 text-emerald-600" />
                                    </motion.div>
                                </div>
                                <motion.h3
                                    animate={{ opacity: [1, 0.7, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className="text-xl font-semibold text-gray-900 mb-2"
                                >
                                    Finding Mystery Bags...
                                </motion.h3>
                                <p className="text-gray-500">Searching restaurants near you</p>
                            </motion.div>
                        ) : filteredRestaurants.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className="py-20 text-center bg-white rounded-3xl border border-gray-100 shadow-sm"
                            >
                                <motion.div
                                    animate={{
                                        y: [0, -8, 0],
                                        rotate: [0, -5, 5, 0]
                                    }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                    className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center"
                                >
                                    <Map className="w-10 h-10 text-emerald-600" />
                                </motion.div>
                                <motion.h3
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-2xl font-bold text-gray-900 mb-3"
                                >
                                    No Mystery Bags nearby
                                </motion.h3>
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-gray-500 mb-8 max-w-md mx-auto"
                                >
                                    We couldn't find any available bags within 7km. Try changing your location.
                                </motion.p>
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="flex flex-col sm:flex-row gap-4 justify-center"
                                >
                                    <motion.button
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setShowLocationModal(true)}
                                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#0B1E0F] text-white font-medium rounded-xl hover:bg-[#142318] transition-colors"
                                    >
                                        <MapPin className="w-5 h-5" />
                                        Change Location
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleRefreshLocation}
                                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                                    >
                                        <Navigation className="w-5 h-5" />
                                        Refresh
                                    </motion.button>
                                </motion.div>
                            </motion.div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredRestaurants.map((restaurant, index) => (
                                    <Link
                                        key={restaurant.id}
                                        href={`/restaurant/${restaurant.id}`}
                                        className="block cursor-pointer group bg-white rounded-2xl border border-gray-100 hover:border-emerald-200 transition-all duration-300 overflow-hidden hover:shadow-2xl hover:-translate-y-2"
                                    >
                                        <div className="aspect-[16/10] relative overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
                                            <img
                                                src={restaurant.cover_image_url || "/images/hero-indian-food.png"}
                                                alt={restaurant.name}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                            {/* Distance Badge */}
                                            <div className="absolute top-3 right-3 z-20">
                                                <div className="px-3 py-1.5 bg-white/95 backdrop-blur-sm text-gray-900 text-xs font-semibold rounded-lg shadow-lg flex items-center gap-1.5">
                                                    <Navigation className="w-3.5 h-3.5" />
                                                    {formatDistance(restaurant.distance_km)}
                                                </div>
                                            </div>
                                            {/* Restaurant Name Overlay */}
                                            <div className="absolute bottom-3 left-3 right-3 z-20">
                                                <h3 className="text-xl font-bold text-white mb-1 group-hover:translate-x-1 transition-transform">
                                                    {restaurant.name}
                                                </h3>
                                                <p className="text-white/80 text-sm">
                                                    {restaurant.cuisine_types?.slice(0, 2).join(" • ") || "Multi-cuisine"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg">
                                                        <Clock className="w-4 h-4 text-emerald-700" />
                                                        <span className="text-sm font-medium text-emerald-800">
                                                            {restaurant.rescue_bags[0] && formatPickupTime(restaurant.rescue_bags[0].pickup_start_time, restaurant.rescue_bags[0].pickup_end_time)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-gray-500">
                                                        <ShoppingBag className="w-4 h-4" />
                                                        <span className="text-sm">{restaurant.rescue_bags.length} bag{restaurant.rescue_bags.length !== 1 ? 's' : ''}</span>
                                                    </div>
                                                </div>
                                                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center group-hover:bg-[#0B1E0F] group-hover:text-white transition-all">
                                                    <ArrowRight className="w-5 h-5" />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </section >
            </main >

            {/* Location Modal - Clean Design */}
            <AnimatePresence>
                {
                    showLocationModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                                onClick={() => setShowLocationModal(false)}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl"
                            >
                                <button
                                    onClick={() => setShowLocationModal(false)}
                                    className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>

                                <div className="mb-6">
                                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
                                        <MapPin className="w-7 h-7 text-emerald-700" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Set Your Location</h3>
                                    <p className="text-gray-500">Find Mystery Bags available near you</p>
                                </div>

                                {locationError && (
                                    <div className="mb-4 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex gap-3 items-center">
                                        <div className="w-2 h-2 rounded-full bg-red-500" />
                                        {locationError}
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            ref={searchInputRef}
                                            type="text"
                                            placeholder="Search for a location..."
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 focus:outline-none transition-all text-base placeholder:text-gray-400"
                                        />
                                    </div>

                                    <div className="flex items-center gap-4 py-2">
                                        <div className="flex-1 h-px bg-gray-200"></div>
                                        <span className="text-sm text-gray-400">or</span>
                                        <div className="flex-1 h-px bg-gray-200"></div>
                                    </div>

                                    <button
                                        onClick={handleRefreshLocation}
                                        disabled={locationLoading}
                                        className="w-full flex items-center justify-center gap-3 py-4 bg-[#0B1E0F] text-white font-semibold rounded-xl hover:bg-[#142318] transition-colors disabled:opacity-50"
                                    >
                                        {locationLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Navigation className="w-5 h-5" />
                                        )}
                                        <span>Use My Current Location</span>
                                    </button>

                                    <p className="text-center text-sm text-gray-400">
                                        We'll find bags within 7km of your location
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    )
                }
            </AnimatePresence >

            {/* Footer - Clean Design */}
            < footer className="py-8 px-6 border-t border-gray-200 bg-white" >
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xl font-bold text-[#0B1E0F]">Latebites</p>
                    <div className="flex gap-6">
                        <Link href="/help" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Help</Link>
                        <Link href="/profile" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Privacy</Link>
                    </div>
                    <p className="text-sm text-gray-400">© 2024 Latebites. Save food, save money.</p>
                </div>
            </footer >
        </div >
    );
}
