"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrentLocation, formatDistance, type Coordinates } from "@/lib/location/geolocation";
import { MapPin, Search, Clock, X, Navigation, Loader2, ChevronRight, Map, ChevronDown } from "lucide-react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

import { Header } from "@/components/Header";

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
    const [activeFilter, setActiveFilter] = useState<'all' | 'nearby' | 'tonight'>('all');
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
                    toast.success("Location updated");
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
                toast.success("Location updated");
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
            toast.success("Location updated");
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

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    return (
        <div className="min-h-screen bg-[#F8F7F4]">
            <Toaster position="top-center" toastOptions={{ className: 'text-sm font-medium' }} />
            <Header />

            <main className="pt-16">
                {/* Hero Section - Ultra Premium */}
                <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
                    {/* Background with subtle texture */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#1C1917] via-[#1C1917] to-[#292524]" />
                    
                    {/* Elegant grain overlay */}
                    <div className="absolute inset-0 opacity-[0.4]" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                    }} />

                    {/* Soft radial glow */}
                    <div className="absolute inset-0">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-900/20 rounded-full blur-[120px]" />
                    </div>

                    {/* Content */}
                    <div className="relative z-10 w-full max-w-5xl mx-auto px-6 py-20 text-center">
                        {/* Location pill */}
                        <motion.button
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            onClick={() => setShowLocationModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 mb-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all group"
                        >
                            <MapPin className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-sm text-white/70 group-hover:text-white/90 transition-colors">
                                {locationName || "Set location"}
                            </span>
                            <ChevronDown className="w-3.5 h-3.5 text-white/40" />
                        </motion.button>

                        {/* Main headline */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            className="mb-8"
                        >
                            <h1 className="text-[clamp(2.5rem,8vw,5.5rem)] font-light text-white leading-[1.05] tracking-[-0.03em]">
                                Good food doesn't
                                <br />
                                <span className="font-serif italic text-amber-100/90">end early.</span>
                            </h1>
                        </motion.div>

                        {/* Subline */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.5 }}
                            className="text-lg md:text-xl text-white/50 font-light max-w-md mx-auto mb-12 leading-relaxed"
                        >
                            Mystery bags from nearby restaurants.
                            <br />
                            Pick up before closing.
                        </motion.p>

                        {/* Search Bar - Premium */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.6 }}
                            className="max-w-lg mx-auto"
                        >
                            <div className={`relative bg-white/[0.08] backdrop-blur-xl rounded-2xl border transition-all duration-500 ${
                                isSearchFocused 
                                    ? 'border-white/30 shadow-2xl shadow-black/20' 
                                    : 'border-white/10 hover:border-white/20'
                            }`}>
                                <div className="flex items-center px-5 py-4">
                                    <Search className="w-5 h-5 text-white/40 mr-4" />
                                    <input
                                        ref={mainSearchRef}
                                        type="text"
                                        placeholder="Search restaurants or cuisines..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onFocus={() => setIsSearchFocused(true)}
                                        onBlur={() => setIsSearchFocused(false)}
                                        className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-white placeholder:text-white/30 text-base font-light"
                                    />
                                    {searchQuery && (
                                        <button 
                                            onClick={() => setSearchQuery('')}
                                            className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                                        >
                                            <X className="w-4 h-4 text-white/40" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>

                        {/* Availability indicator */}
                        {totalBagsAvailable > 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.8, delay: 0.8 }}
                                className="mt-8 flex items-center justify-center gap-2"
                            >
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                <span className="text-sm text-white/40 font-light">
                                    {totalBagsAvailable} {totalBagsAvailable === 1 ? 'bag' : 'bags'} available tonight
                                </span>
                            </motion.div>
                        )}
                    </div>

                    {/* Bottom fade */}
                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#F8F7F4] to-transparent" />
                </section>

                {/* Filters Bar */}
                <section className="sticky top-16 z-30 bg-[#F8F7F4]/95 backdrop-blur-lg border-b border-stone-200/60">
                    <div className="max-w-6xl mx-auto px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {[
                                    { key: 'all', label: 'All' },
                                    { key: 'nearby', label: 'Nearby' },
                                    { key: 'tonight', label: 'Tonight' },
                                ].map((filter) => (
                                    <button
                                        key={filter.key}
                                        onClick={() => setActiveFilter(filter.key as any)}
                                        className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                                            activeFilter === filter.key
                                                ? 'bg-stone-900 text-white'
                                                : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
                                        }`}
                                    >
                                        {filter.label}
                                    </button>
                                ))}
                            </div>
                            
                            <span className="text-sm text-stone-400">
                                {sortedRestaurants.length} {sortedRestaurants.length === 1 ? 'result' : 'results'}
                            </span>
                        </div>
                    </div>
                </section>

                {/* Restaurant Grid */}
                <section className="px-6 py-12">
                    <div className="max-w-6xl mx-auto">
                        {loading ? (
                            <div className="py-32 flex flex-col items-center justify-center">
                                <div className="relative w-12 h-12">
                                    <div className="absolute inset-0 border-2 border-stone-200 rounded-full" />
                                    <div className="absolute inset-0 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
                                </div>
                                <p className="mt-6 text-stone-400 text-sm font-light">Finding mystery bags near you...</p>
                            </div>
                        ) : sortedRestaurants.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="py-24 text-center"
                            >
                                <div className="w-20 h-20 mx-auto mb-8 bg-stone-100 rounded-full flex items-center justify-center">
                                    <Map className="w-8 h-8 text-stone-300" />
                                </div>
                                <h3 className="text-xl font-medium text-stone-800 mb-3">Nothing available right now</h3>
                                <p className="text-stone-400 mb-10 max-w-sm mx-auto font-light">
                                    {searchQuery 
                                        ? `No results for "${searchQuery}".`
                                        : "No mystery bags within 7km. Check back closer to closing time."
                                    }
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    {searchQuery ? (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="px-6 py-3 bg-stone-900 text-white text-sm font-medium rounded-full hover:bg-stone-800 transition-colors"
                                        >
                                            Clear search
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => setShowLocationModal(true)}
                                                className="px-6 py-3 bg-stone-900 text-white text-sm font-medium rounded-full hover:bg-stone-800 transition-colors inline-flex items-center gap-2"
                                            >
                                                <MapPin className="w-4 h-4" />
                                                Change location
                                            </button>
                                            <button
                                                onClick={handleRefreshLocation}
                                                className="px-6 py-3 bg-stone-100 text-stone-700 text-sm font-medium rounded-full hover:bg-stone-200 transition-colors"
                                            >
                                                Refresh
                                            </button>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {sortedRestaurants.map((restaurant, index) => {
                                    const totalQuantity = restaurant.rescue_bags.reduce((sum, bag) => sum + bag.quantity_available, 0);
                                    const firstBag = restaurant.rescue_bags[0];
                                    
                                    return (
                                        <motion.div
                                            key={restaurant.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.06, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                                        >
                                            <Link
                                                href={`/restaurant/${restaurant.id}`}
                                                className="group block bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500"
                                            >
                                                {/* Image Container */}
                                                <div className="relative aspect-[4/3] overflow-hidden">
                                                    <img
                                                        src={restaurant.cover_image_url || "/images/hero-indian-food.png"}
                                                        alt={restaurant.name}
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                    />
                                                    
                                                    {/* Gradient overlay */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
                                                    
                                                    {/* Mystery Bag Tag */}
                                                    <div className="absolute top-4 left-4">
                                                        <div className="px-3 py-1.5 bg-white text-stone-900 text-xs font-semibold tracking-wide rounded-full shadow-lg">
                                                            Mystery Bag
                                                        </div>
                                                    </div>

                                                    {/* Quantity indicator */}
                                                    {totalQuantity <= 3 && (
                                                        <div className="absolute top-4 right-4">
                                                            <div className="px-3 py-1.5 bg-amber-500 text-white text-xs font-semibold rounded-full shadow-lg">
                                                                {totalQuantity} left
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Pickup Time - Bottom of image */}
                                                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                                                        <div className="flex items-center gap-2 px-3 py-2 bg-black/70 backdrop-blur-sm rounded-xl">
                                                            <Clock className="w-4 h-4 text-amber-400" />
                                                            <span className="text-white text-sm font-medium">
                                                                {firstBag && formatPickupTime(firstBag.pickup_start_time, firstBag.pickup_end_time)}
                                                            </span>
                                                        </div>
                                                        <div className="px-3 py-2 bg-white/90 backdrop-blur-sm rounded-xl">
                                                            <span className="text-stone-700 text-sm font-medium">
                                                                {formatDistance(restaurant.distance_km)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <div className="p-5">
                                                    <h3 className="text-lg font-semibold text-stone-900 mb-1 group-hover:text-stone-700 transition-colors">
                                                        {restaurant.name}
                                                    </h3>
                                                    <p className="text-sm text-stone-400 mb-4">
                                                        {restaurant.cuisine_types?.slice(0, 3).join(" · ") || "Multi-cuisine"}
                                                    </p>

                                                    {/* Price Section */}
                                                    <div className="flex items-end justify-between pt-4 border-t border-stone-100">
                                                        <div>
                                                            <p className="text-xs text-stone-400 mb-0.5">Worth {formatPrice(firstBag?.original_price || 0)}+</p>
                                                            <p className="text-xl font-semibold text-stone-900">
                                                                {formatPrice(firstBag?.discounted_price || 0)}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-stone-400 group-hover:text-stone-600 transition-colors">
                                                            <span className="text-sm font-medium">View</span>
                                                            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        </motion.div>
                                    );
                                })}
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
                            transition={{ type: "spring", duration: 0.5 }}
                            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-xl font-semibold text-stone-900">Set location</h2>
                                        <p className="text-sm text-stone-400 mt-1">Find mystery bags near you</p>
                                    </div>
                                    <button
                                        onClick={() => setShowLocationModal(false)}
                                        className="w-10 h-10 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors"
                                    >
                                        <X className="w-5 h-5 text-stone-500" />
                                    </button>
                                </div>

                                <div className="space-y-5">
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                                        <input
                                            ref={searchInputRef}
                                            type="text"
                                            value={manualSearch}
                                            onChange={(e) => handleSearchInputChange(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                                            placeholder="Search for your location..."
                                            autoFocus
                                            className="w-full pl-12 pr-4 py-4 bg-stone-50 border-0 focus:ring-2 focus:ring-stone-200 rounded-2xl text-stone-900 placeholder-stone-400 transition-all"
                                        />
                                        {locationLoading && (
                                            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 animate-spin" />
                                        )}
                                    </div>

                                    {locationError && (
                                        <div className="flex items-center gap-3 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-2xl">
                                            <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                                            {locationError}
                                        </div>
                                    )}

                                    {placeSuggestions.length > 0 && (
                                        <div className="bg-white border border-stone-200 rounded-2xl shadow-lg max-h-56 overflow-auto">
                                            {placeSuggestions.map((suggestion, i) => (
                                                <button
                                                    key={suggestion.place_id}
                                                    type="button"
                                                    onClick={() => handleSelectSuggestion(suggestion.place_id, suggestion.description)}
                                                    className={`w-full px-4 py-4 text-left hover:bg-stone-50 transition-colors flex items-start gap-3 ${
                                                        i !== placeSuggestions.length - 1 ? 'border-b border-stone-100' : ''
                                                    }`}
                                                >
                                                    <MapPin className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <p className="text-stone-900 font-medium">{suggestion.structured_formatting.main_text}</p>
                                                        <p className="text-stone-400 text-sm">{suggestion.structured_formatting.secondary_text}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-4 py-2">
                                        <div className="flex-1 h-px bg-stone-200" />
                                        <span className="text-xs text-stone-400 uppercase tracking-wider">or</span>
                                        <div className="flex-1 h-px bg-stone-200" />
                                    </div>

                                    <button
                                        onClick={handleRefreshLocation}
                                        disabled={locationLoading}
                                        className="w-full flex items-center justify-center gap-3 py-4 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-2xl transition-all disabled:opacity-50"
                                    >
                                        {locationLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Navigation className="w-5 h-5" />
                                        )}
                                        Use current location
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Footer */}
            <footer className="bg-white border-t border-stone-200/60">
                <div className="max-w-6xl mx-auto px-6 py-10">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <span className="text-lg font-light text-stone-800 tracking-tight">Latebites</span>
                        <div className="flex items-center gap-8 text-sm text-stone-400">
                            <Link href="/help" className="hover:text-stone-600 transition-colors">Help</Link>
                            <Link href="/profile" className="hover:text-stone-600 transition-colors">Privacy</Link>
                            <span>© 2024</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
