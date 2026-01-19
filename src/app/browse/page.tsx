"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrentLocation, formatDistance, type Coordinates } from "@/lib/location/geolocation";
import { MapPin, Search, Clock, X, Navigation, Loader2, ArrowRight, ShoppingBag, ChevronRight, User, Utensils, Flame, Map, SlidersHorizontal, Sparkles, TrendingUp, Zap, Heart, Star } from "lucide-react";
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
    const [manualSearch, setManualSearch] = useState("");
    const [placeSuggestions, setPlaceSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
    const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'all' | 'nearby' | 'popular'>('all');
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const searchInputRef = useRef<HTMLInputElement>(null);
    const mainSearchRef = useRef<HTMLInputElement>(null);
    const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
    const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
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
        if (typeof window !== 'undefined' && !window.google) {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
            script.async = true;
            script.defer = true;
            script.onload = () => setGoogleMapsLoaded(true);
            document.head.appendChild(script);
        } else if (window.google) {
            setGoogleMapsLoaded(true);
        }
    }, []);

    useEffect(() => {
        if (googleMapsLoaded && !autocompleteServiceRef.current) {
            autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
            const dummyDiv = document.createElement('div');
            placesServiceRef.current = new google.maps.places.PlacesService(dummyDiv);
        }
    }, [googleMapsLoaded]);

    const handleSearchInputChange = (value: string) => {
        setManualSearch(value);

        if (!value.trim() || !autocompleteServiceRef.current) {
            setPlaceSuggestions([]);
            return;
        }

        autocompleteServiceRef.current.getPlacePredictions(
            {
                input: value + ", Coimbatore",
                componentRestrictions: { country: "in" },
                types: ["geocode", "establishment"],
                locationBias: {
                    center: { lat: 11.0168, lng: 76.9558 },
                    radius: 30000,
                },
            },
            (predictions, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                    setPlaceSuggestions(predictions.slice(0, 5));
                } else {
                    setPlaceSuggestions([]);
                }
            }
        );
    };

    const handleSelectSuggestion = (placeId: string, description: string) => {
        if (!placesServiceRef.current) return;

        setLocationLoading(true);
        setPlaceSuggestions([]);

        placesServiceRef.current.getDetails(
            { placeId, fields: ["geometry", "formatted_address", "name"] },
            (place, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
                    const coords: Coordinates = {
                        latitude: place.geometry.location.lat(),
                        longitude: place.geometry.location.lng(),
                    };
                    setUserLocation(coords);
                    setLocationName(place.formatted_address || place.name || description);
                    setLocationError("");
                    fetchNearbyRestaurants(coords);
                    setShowLocationModal(false);
                    setManualSearch("");
                    toast.success("Location updated!");
                } else {
                    setLocationError("Could not get location details. Try again.");
                }
                setLocationLoading(false);
            }
        );
    };

    const handleManualSearch = async () => {
        if (!manualSearch.trim() || !googleMapsLoaded) return;

        setLocationLoading(true);
        setPlaceSuggestions([]);
        try {
            const geocoder = new google.maps.Geocoder();
            const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
                geocoder.geocode({ address: manualSearch + ", India" }, (results, status) => {
                    if (status === "OK" && results) {
                        resolve(results);
                    } else {
                        reject(new Error("Location not found"));
                    }
                });
            });

            if (result[0]?.geometry?.location) {
                const coords: Coordinates = {
                    latitude: result[0].geometry.location.lat(),
                    longitude: result[0].geometry.location.lng(),
                };
                setUserLocation(coords);
                setLocationName(result[0].formatted_address || manualSearch);
                setLocationError("");
                await fetchNearbyRestaurants(coords);
                setShowLocationModal(false);
                setManualSearch("");
                toast.success("Location updated!");
            }
        } catch (error) {
            setLocationError("Could not find that location. Try a different search.");
        } finally {
            setLocationLoading(false);
        }
    };

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

    const filteredRestaurants = restaurants.filter((restaurant) => {
        const matchesSearch = restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            restaurant.cuisine_types?.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
        
        if (activeFilter === 'nearby') {
            return matchesSearch && restaurant.distance_km <= 3;
        }
        return matchesSearch;
    });

    const sortedRestaurants = [...filteredRestaurants].sort((a, b) => {
        if (activeFilter === 'nearby') return a.distance_km - b.distance_km;
        return 0;
    });

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

    const totalBagsAvailable = restaurants.reduce((acc, r) => 
        acc + r.rescue_bags.reduce((sum, bag) => sum + bag.quantity_available, 0), 0
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-orange-50/30 via-white to-orange-50/20">
            <Toaster position="top-center" toastOptions={{ className: 'text-sm' }} />
            <Header />

            <main className="pt-20 pb-24">
                {/* Hero Search Section */}
                <section className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-orange-600 to-red-600" />
                    <div className="absolute inset-0 bg-[url('/images/hero-indian-food.png')] bg-cover bg-center opacity-20 mix-blend-overlay" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
                    
                    <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-12 md:py-20">
                        <div className="max-w-4xl mx-auto text-center space-y-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-3"
                            >
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white/90 text-sm font-medium">
                                    <Sparkles className="w-4 h-4" />
                                    <span>{totalBagsAvailable} rescue bags available near you</span>
                                </div>
                                <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
                                    Rescue delicious food
                                    <br />
                                    <span className="text-orange-200">at 50% off</span>
                                </h1>
                                <p className="text-lg text-white/80 max-w-xl mx-auto">
                                    Find surplus meals from top restaurants in your area before they go to waste
                                </p>
                            </motion.div>

                            {/* Main Search Bar */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="max-w-2xl mx-auto"
                            >
                                <div className={`relative bg-white rounded-2xl shadow-2xl shadow-black/20 transition-all duration-300 ${isSearchFocused ? 'ring-4 ring-orange-300/50' : ''}`}>
                                    <div className="flex items-center">
                                        <div className="flex-1 flex items-center px-5 py-4">
                                            <Search className="w-5 h-5 text-gray-400 mr-3" />
                                            <input
                                                ref={mainSearchRef}
                                                type="text"
                                                placeholder="Search restaurants or cuisines..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                onFocus={() => setIsSearchFocused(true)}
                                                onBlur={() => setIsSearchFocused(false)}
                                                className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-gray-900 placeholder:text-gray-400 text-base"
                                            />
                                            {searchQuery && (
                                                <button 
                                                    onClick={() => setSearchQuery('')}
                                                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                                >
                                                    <X className="w-4 h-4 text-gray-400" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="pr-2">
                                            <button className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors flex items-center gap-2">
                                                <Search className="w-4 h-4" />
                                                <span className="hidden sm:inline">Search</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Location Pill */}
                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                onClick={() => setShowLocationModal(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all group"
                            >
                                <MapPin className="w-4 h-4 text-orange-200" />
                                <span className="text-sm font-medium truncate max-w-[200px]">
                                    {locationName || "Set your location"}
                                </span>
                                <ChevronRight className="w-4 h-4 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                            </motion.button>
                        </div>
                    </div>

                    {/* Wave Decoration */}
                    <div className="absolute bottom-0 left-0 right-0">
                        <svg viewBox="0 0 1440 120" fill="none" className="w-full h-auto">
                            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V120Z" fill="white" fillOpacity="0.1"/>
                            <path d="M0 120L60 115C120 110 240 100 360 95C480 90 600 90 720 92C840 94 960 98 1080 100C1200 102 1320 102 1380 102L1440 102V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V120Z" className="fill-orange-50/30"/>
                        </svg>
                    </div>
                </section>

                {/* Quick Filters */}
                <section className="px-4 sm:px-6 lg:px-8 py-6 bg-white border-b border-gray-100 sticky top-16 z-30">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                {[
                                    { key: 'all', label: 'All Restaurants', icon: Flame },
                                    { key: 'nearby', label: 'Nearby', icon: MapPin },
                                    { key: 'popular', label: 'Popular', icon: TrendingUp },
                                ].map((filter) => (
                                    <button
                                        key={filter.key}
                                        onClick={() => setActiveFilter(filter.key as any)}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                                            activeFilter === filter.key
                                                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        <filter.icon className="w-4 h-4" />
                                        {filter.label}
                                    </button>
                                ))}
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-full">
                                    <Zap className="w-4 h-4 text-orange-500" />
                                    <span className="text-sm font-semibold text-orange-600">{sortedRestaurants.length} results</span>
                                </div>
                                <button className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                                    <SlidersHorizontal className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Restaurant Grid */}
                <section className="px-4 sm:px-6 lg:px-8 py-8">
                    <div className="max-w-7xl mx-auto">
                        {loading ? (
                            <div className="py-20 flex flex-col items-center justify-center">
                                <div className="relative">
                                    <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Utensils className="w-6 h-6 text-orange-500" />
                                    </div>
                                </div>
                                <p className="mt-6 text-gray-500 font-medium">Finding rescue bags near you...</p>
                            </div>
                        ) : sortedRestaurants.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="py-16 text-center"
                            >
                                <div className="w-24 h-24 mx-auto mb-6 bg-orange-100 rounded-full flex items-center justify-center">
                                    <Map className="w-10 h-10 text-orange-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">No restaurants found</h3>
                                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                                    {searchQuery 
                                        ? `No results for "${searchQuery}". Try a different search.`
                                        : "We couldn't find any active rescue bags within 7km of your location."
                                    }
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    {searchQuery ? (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors"
                                        >
                                            Clear Search
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => setShowLocationModal(true)}
                                                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                                            >
                                                <MapPin className="w-4 h-4" />
                                                Change Location
                                            </button>
                                            <button
                                                onClick={handleRefreshLocation}
                                                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Navigation className="w-4 h-4" />
                                                Refresh Location
                                            </button>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {sortedRestaurants.map((restaurant, index) => (
                                    <motion.div
                                        key={restaurant.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05, duration: 0.4 }}
                                    >
                                        <Link
                                            href={`/restaurant/${restaurant.id}`}
                                            className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-orange-200"
                                        >
                                            {/* Image Container */}
                                            <div className="relative aspect-[4/3] overflow-hidden">
                                                <img
                                                    src={restaurant.cover_image_url || "/images/hero-indian-food.png"}
                                                    alt={restaurant.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                                
                                                {/* Top Badges */}
                                                <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                                                    <div className="px-2.5 py-1 bg-green-500 text-white text-xs font-bold rounded-lg shadow-lg">
                                                        50% OFF
                                                    </div>
                                                    <button className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                                                        <Heart className="w-4 h-4 text-gray-400 hover:text-red-500 transition-colors" />
                                                    </button>
                                                </div>

                                                {/* Distance Badge */}
                                                <div className="absolute bottom-3 left-3">
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/95 backdrop-blur-sm rounded-lg text-xs font-semibold text-gray-700 shadow-lg">
                                                        <Navigation className="w-3 h-3 text-orange-500" />
                                                        {formatDistance(restaurant.distance_km)}
                                                    </div>
                                                </div>

                                                {/* Bags Count */}
                                                <div className="absolute bottom-3 right-3">
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-500 text-white rounded-lg text-xs font-semibold shadow-lg">
                                                        <ShoppingBag className="w-3 h-3" />
                                                        {restaurant.rescue_bags.reduce((sum, bag) => sum + bag.quantity_available, 0)} left
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-4">
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <h3 className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                                                        {restaurant.name}
                                                    </h3>
                                                    <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-50 rounded text-xs font-semibold text-orange-600">
                                                        <Star className="w-3 h-3 fill-orange-400 text-orange-400" />
                                                        4.5
                                                    </div>
                                                </div>
                                                
                                                <p className="text-sm text-gray-500 mb-3 line-clamp-1">
                                                    {restaurant.cuisine_types?.slice(0, 3).join(" • ") || "Multi-cuisine"}
                                                </p>

                                                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                        <Clock className="w-4 h-4 text-orange-400" />
                                                        <span className="font-medium">
                                                            {restaurant.rescue_bags[0] && formatPickupTime(restaurant.rescue_bags[0].pickup_start_time, restaurant.rescue_bags[0].pickup_end_time)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-orange-500 font-semibold text-sm group-hover:gap-2 transition-all">
                                                        View
                                                        <ArrowRight className="w-4 h-4" />
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
                            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Set your location</h2>
                                        <p className="text-sm text-gray-500 mt-1">Find rescue bags near you</p>
                                    </div>
                                    <button
                                        onClick={() => setShowLocationModal(false)}
                                        className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                                    >
                                        <X className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500" />
                                        <input
                                            ref={searchInputRef}
                                            type="text"
                                            value={manualSearch}
                                            onChange={(e) => handleSearchInputChange(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                                            placeholder="Search for your location..."
                                            autoFocus
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 focus:border-orange-300 focus:ring-4 focus:ring-orange-100 rounded-xl text-gray-900 placeholder-gray-400 transition-all"
                                        />
                                        {locationLoading && (
                                            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500 animate-spin" />
                                        )}
                                    </div>

                                    {locationError && (
                                        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl">
                                            <div className="w-2 h-2 rounded-full bg-red-500" />
                                            {locationError}
                                        </div>
                                    )}

                                    {placeSuggestions.length > 0 && (
                                        <div className="bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                                            {placeSuggestions.map((suggestion) => (
                                                <button
                                                    key={suggestion.place_id}
                                                    type="button"
                                                    onClick={() => handleSelectSuggestion(suggestion.place_id, suggestion.description)}
                                                    className="w-full px-4 py-3 text-left hover:bg-orange-50 transition-colors flex items-start gap-3 border-b border-gray-100 last:border-b-0"
                                                >
                                                    <MapPin className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <p className="text-gray-900 text-sm font-medium">{suggestion.structured_formatting.main_text}</p>
                                                        <p className="text-gray-500 text-xs">{suggestion.structured_formatting.secondary_text}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-4">
                                        <div className="flex-1 h-px bg-gray-200" />
                                        <span className="text-xs text-gray-400 uppercase">or</span>
                                        <div className="flex-1 h-px bg-gray-200" />
                                    </div>

                                    <button
                                        onClick={handleRefreshLocation}
                                        disabled={locationLoading}
                                        className="w-full flex items-center justify-center gap-3 py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
                                    >
                                        {locationLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Navigation className="w-5 h-5" />
                                        )}
                                        Use Current Location
                                    </button>
                                </div>

                                <p className="text-center text-gray-400 text-xs mt-4">
                                    We'll show rescue bags within 7km of your location
                                </p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Footer */}
            <footer className="bg-gray-50 border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">L</span>
                            </div>
                            <span className="font-semibold text-gray-900">Latebites</span>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                            <Link href="/help" className="hover:text-orange-500 transition-colors">Help</Link>
                            <Link href="/profile" className="hover:text-orange-500 transition-colors">Privacy</Link>
                            <span>© 2024 Latebites</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
