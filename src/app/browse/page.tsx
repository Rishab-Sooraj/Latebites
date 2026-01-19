"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrentLocation, formatDistance, type Coordinates } from "@/lib/location/geolocation";
import { MapPin, Search, Clock, X, Navigation, Loader2, ChevronRight, Map, ChevronDown, Sparkles } from "lucide-react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";

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
    const [locationFetched, setLocationFetched] = useState(false);

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
                const addressComponents = data.results[0].address_components;
                let locality = '';
                let city = '';
                let state = '';
                
                for (const component of addressComponents) {
                    if (component.types.includes('sublocality_level_1') || component.types.includes('sublocality')) {
                        locality = component.long_name;
                    }
                    if (component.types.includes('locality')) {
                        city = component.long_name;
                    }
                    if (component.types.includes('administrative_area_level_1')) {
                        state = component.short_name;
                    }
                }
                
                const locationParts = [locality, city, state].filter(Boolean);
                setLocationName(locationParts.slice(0, 2).join(', '));
            }
        } catch (error) {
            console.error("Reverse geocode error:", error);
        }
    };

    useEffect(() => {
        if (!user || authLoading || locationFetched) return;

        setLocationFetched(true);

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
    }, [user, authLoading, fetchNearbyRestaurants, locationFetched]);

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
        <div className="min-h-screen bg-gradient-to-b from-orange-50/50 via-white to-amber-50/30">
            <Toaster position="top-center" toastOptions={{ className: 'text-sm font-medium' }} />
            <Header />

            <main className="pt-16">
                {/* Hero Section - Vibrant & Premium */}
                <section className="relative min-h-[65vh] flex items-center justify-center overflow-hidden">
                    {/* Warm gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-amber-500 to-yellow-500" />
                    
                    {/* Decorative blobs */}
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
                        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-red-500/20 rounded-full blur-3xl" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-300/20 rounded-full blur-[100px]" />
                    </div>

                    {/* Subtle pattern */}
                    <div className="absolute inset-0 opacity-10" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }} />

                    {/* Content */}
                    <div className="relative z-10 w-full max-w-4xl mx-auto px-6 py-16 text-center">
                        {/* Location pill - auto detected */}
                        <motion.button
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            onClick={() => setShowLocationModal(true)}
                            className="inline-flex items-center gap-2.5 px-5 py-2.5 mb-8 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 rounded-full transition-all group shadow-lg"
                        >
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                            <MapPin className="w-4 h-4 text-white" />
                            <span className="text-sm font-medium text-white">
                                {locationName || "Detecting location..."}
                            </span>
                            <ChevronDown className="w-4 h-4 text-white/70 group-hover:translate-y-0.5 transition-transform" />
                        </motion.button>

                        {/* Main headline */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.1 }}
                            className="mb-6"
                        >
                            <h1 className="text-[clamp(2.5rem,7vw,4.5rem)] font-bold text-white leading-[1.1] tracking-tight">
                                Good food doesn't
                                <br />
                                <span className="font-serif italic font-normal text-yellow-100">end early.</span>
                            </h1>
                        </motion.div>

                        {/* Subline */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.2 }}
                            className="text-lg md:text-xl text-white/80 font-medium max-w-lg mx-auto mb-10 leading-relaxed"
                        >
                            Mystery bags from nearby restaurants.
                            <br />
                            Pick up before closing.
                        </motion.p>

                        {/* Search Bar */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.3 }}
                            className="max-w-xl mx-auto"
                        >
                            <div className={`relative bg-white rounded-2xl shadow-2xl transition-all duration-300 ${
                                isSearchFocused ? 'shadow-2xl shadow-orange-900/30 scale-[1.02]' : 'shadow-xl'
                            }`}>
                                <div className="flex items-center px-5 py-4">
                                    <Search className="w-5 h-5 text-orange-400 mr-4" />
                                    <input
                                        ref={mainSearchRef}
                                        type="text"
                                        placeholder="Search restaurants or cuisines..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onFocus={() => setIsSearchFocused(true)}
                                        onBlur={() => setIsSearchFocused(false)}
                                        className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-gray-800 placeholder:text-gray-400 text-base font-medium"
                                    />
                                    {searchQuery && (
                                        <button 
                                            onClick={() => setSearchQuery('')}
                                            className="p-1.5 hover:bg-orange-50 rounded-full transition-colors"
                                        >
                                            <X className="w-4 h-4 text-gray-400" />
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
                                transition={{ duration: 0.7, delay: 0.5 }}
                                className="mt-8 inline-flex items-center gap-2.5 px-5 py-2.5 bg-white/20 backdrop-blur-sm rounded-full"
                            >
                                <Sparkles className="w-4 h-4 text-yellow-200" />
                                <span className="text-sm font-semibold text-white">
                                    {totalBagsAvailable} {totalBagsAvailable === 1 ? 'bag' : 'bags'} available tonight
                                </span>
                            </motion.div>
                        )}
                    </div>

                    {/* Wave divider */}
                    <div className="absolute bottom-0 left-0 right-0">
                        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
                            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="url(#gradient)" />
                            <defs>
                                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop stopColor="#FFF7ED" stopOpacity="0.5" />
                                    <stop offset="1" stopColor="white" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                </section>

                {/* Filters Bar */}
                <section className="sticky top-16 z-30 bg-white/80 backdrop-blur-xl border-b border-orange-100">
                    <div className="max-w-6xl mx-auto px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                {[
                                    { key: 'all', label: 'All', color: 'orange' },
                                    { key: 'nearby', label: 'Nearby', color: 'emerald' },
                                    { key: 'tonight', label: 'Tonight', color: 'purple' },
                                ].map((filter) => (
                                    <button
                                        key={filter.key}
                                        onClick={() => setActiveFilter(filter.key as any)}
                                        className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                                            activeFilter === filter.key
                                                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-200'
                                                : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
                                        }`}
                                    >
                                        {filter.label}
                                    </button>
                                ))}
                            </div>
                            
                            <span className="text-sm font-medium text-gray-400 hidden sm:inline">
                                {sortedRestaurants.length} {sortedRestaurants.length === 1 ? 'result' : 'results'}
                            </span>
                        </div>
                    </div>
                </section>

                {/* Restaurant Grid */}
                <section className="px-6 py-10">
                    <div className="max-w-6xl mx-auto">
                        {loading ? (
                            <div className="py-32 flex flex-col items-center justify-center">
                                <div className="relative w-16 h-16">
                                    <div className="absolute inset-0 border-4 border-orange-100 rounded-full" />
                                    <div className="absolute inset-0 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                                <p className="mt-6 text-gray-500 font-medium">Finding mystery bags near you...</p>
                            </div>
                        ) : sortedRestaurants.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="py-20 text-center"
                            >
                                <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full flex items-center justify-center">
                                    <Map className="w-10 h-10 text-orange-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800 mb-3">Nothing available right now</h3>
                                <p className="text-gray-500 mb-10 max-w-sm mx-auto">
                                    {searchQuery 
                                        ? `No results for "${searchQuery}".`
                                        : "No mystery bags within 7km. Check back closer to closing time."
                                    }
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    {searchQuery ? (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="px-8 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-full hover:shadow-lg hover:shadow-orange-200 transition-all"
                                        >
                                            Clear search
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => setShowLocationModal(true)}
                                                className="px-8 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-full hover:shadow-lg hover:shadow-orange-200 transition-all inline-flex items-center gap-2"
                                            >
                                                <MapPin className="w-4 h-4" />
                                                Change location
                                            </button>
                                            <button
                                                onClick={handleRefreshLocation}
                                                className="px-8 py-3.5 bg-gray-100 text-gray-700 font-semibold rounded-full hover:bg-gray-200 transition-colors"
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
                                            transition={{ delay: index * 0.05, duration: 0.4 }}
                                        >
                                            <Link
                                                href={`/restaurant/${restaurant.id}`}
                                                className="group block bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-orange-100 transition-all duration-500 border border-orange-50"
                                            >
                                                {/* Image Container */}
                                                <div className="relative aspect-[4/3] overflow-hidden">
                                                    <img
                                                        src={restaurant.cover_image_url || "/images/hero-indian-food.png"}
                                                        alt={restaurant.name}
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                    />
                                                    
                                                    {/* Gradient overlay */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                                    
                                                    {/* Mystery Bag Tag */}
                                                    <div className="absolute top-4 left-4">
                                                        <div className="px-3.5 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold tracking-wide rounded-full shadow-lg flex items-center gap-1.5">
                                                            <Sparkles className="w-3 h-3" />
                                                            Mystery Bag
                                                        </div>
                                                    </div>

                                                    {/* Quantity indicator */}
                                                    {totalQuantity <= 3 && (
                                                        <div className="absolute top-4 right-4">
                                                            <div className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
                                                                Only {totalQuantity} left!
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Pickup Time & Distance */}
                                                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2 px-3.5 py-2 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg">
                                                            <Clock className="w-4 h-4 text-orange-500" />
                                                            <span className="text-gray-800 text-sm font-semibold">
                                                                {firstBag && formatPickupTime(firstBag.pickup_start_time, firstBag.pickup_end_time)}
                                                            </span>
                                                        </div>
                                                        <div className="px-3.5 py-2 bg-emerald-500 text-white rounded-xl shadow-lg">
                                                            <span className="text-sm font-bold">
                                                                {formatDistance(restaurant.distance_km)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <div className="p-5">
                                                    <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-orange-600 transition-colors">
                                                        {restaurant.name}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 mb-4 font-medium">
                                                        {restaurant.cuisine_types?.slice(0, 3).join(" · ") || "Multi-cuisine"}
                                                    </p>

                                                    {/* Price Section */}
                                                    <div className="flex items-end justify-between pt-4 border-t border-orange-50">
                                                        <div>
                                                            <p className="text-xs text-gray-400 font-medium mb-0.5">Worth {formatPrice(firstBag?.original_price || 0)}+</p>
                                                            <p className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                                                                {formatPrice(firstBag?.discounted_price || 0)}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 px-4 py-2 bg-orange-50 text-orange-600 rounded-full group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                                            <span className="text-sm font-semibold">View</span>
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
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={() => setShowLocationModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", duration: 0.5 }}
                            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
                        >
                            {/* Orange gradient header */}
                            <div className="h-2 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500" />
                            
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Set your location</h2>
                                        <p className="text-sm text-gray-500 mt-1">Find mystery bags near you</p>
                                    </div>
                                    <button
                                        onClick={() => setShowLocationModal(false)}
                                        className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                                    >
                                        <X className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>

                                <div className="space-y-5">
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-400" />
                                        <input
                                            ref={searchInputRef}
                                            type="text"
                                            value={manualSearch}
                                            onChange={(e) => handleSearchInputChange(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                                            placeholder="Search for your location..."
                                            autoFocus
                                            className="w-full pl-12 pr-4 py-4 bg-orange-50 border-2 border-transparent focus:border-orange-300 focus:bg-white rounded-2xl text-gray-900 placeholder-gray-400 transition-all font-medium"
                                        />
                                        {locationLoading && (
                                            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-400 animate-spin" />
                                        )}
                                    </div>

                                    {locationError && (
                                        <div className="flex items-center gap-3 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-2xl font-medium">
                                            <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                                            {locationError}
                                        </div>
                                    )}

                                    {placeSuggestions.length > 0 && (
                                        <div className="bg-white border-2 border-orange-100 rounded-2xl shadow-lg max-h-56 overflow-auto">
                                            {placeSuggestions.map((suggestion, i) => (
                                                <button
                                                    key={suggestion.place_id}
                                                    type="button"
                                                    onClick={() => handleSelectSuggestion(suggestion.place_id, suggestion.description)}
                                                    className={`w-full px-4 py-4 text-left hover:bg-orange-50 transition-colors flex items-start gap-3 ${
                                                        i !== placeSuggestions.length - 1 ? 'border-b border-orange-50' : ''
                                                    }`}
                                                >
                                                    <MapPin className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <p className="text-gray-900 font-semibold">{suggestion.structured_formatting.main_text}</p>
                                                        <p className="text-gray-400 text-sm">{suggestion.structured_formatting.secondary_text}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-4 py-2">
                                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-orange-200 to-transparent" />
                                        <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">or</span>
                                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-orange-200 to-transparent" />
                                    </div>

                                    <button
                                        onClick={handleRefreshLocation}
                                        disabled={locationLoading}
                                        className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-2xl transition-all disabled:opacity-50 shadow-lg shadow-orange-200"
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
            <footer className="bg-gradient-to-r from-orange-50 to-amber-50 border-t border-orange-100">
                <div className="max-w-6xl mx-auto px-6 py-10">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Latebites</span>
                        <div className="flex items-center gap-8 text-sm text-gray-500 font-medium">
                            <Link href="/help" className="hover:text-orange-600 transition-colors">Help</Link>
                            <Link href="/profile" className="hover:text-orange-600 transition-colors">Privacy</Link>
                            <span>© 2024</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
