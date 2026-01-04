"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrentLocation, formatDistance, type Coordinates } from "@/lib/location/geolocation";
import { MapPin, Search, Clock, X, Navigation, Loader2 } from "lucide-react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";

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

    // Auth protection - redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/?auth=customer');
        }
    }, [authLoading, user, router]);

    // Fetch restaurants from server-side API
    const fetchNearbyRestaurants = useCallback(async (coords: Coordinates) => {
        setLoading(true);

        try {
            const response = await fetch('/api/restaurants/nearby', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                    radius: 7, // 7km radius
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

    // Reverse geocode coordinates to get address name
    const reverseGeocode = async (coords: Coordinates) => {
        try {
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.latitude},${coords.longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
            );
            const data = await response.json();
            if (data.results && data.results[0]) {
                setLocationName(data.results[0].formatted_address);
            }
        } catch (error) {
            console.error("Reverse geocode error:", error);
        }
    };

    // Initial location fetch
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
                // Show location modal if permission denied
                setShowLocationModal(true);
            });
    }, [user, fetchNearbyRestaurants]);

    // Initialize Google Maps Autocomplete
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
            console.log("📍 Requesting location permission...");
            const coords = await getCurrentLocation();
            console.log("✅ Location received:", coords);

            setUserLocation(coords);
            await fetchNearbyRestaurants(coords);
            await reverseGeocode(coords);

            // Success! Close modal
            setShowLocationModal(false);

            toast.success("Location fetched successfully!", {
                duration: 3000,
                position: "top-center",
            });
        } catch (error: any) {
            console.error("❌ Location error:", error);

            let errorMessage = error.message || "Failed to get location";

            if (error.code === 1) {
                errorMessage = "Location permission denied. Please enable location access in your browser settings.";
            } else if (error.code === 2) {
                errorMessage = "Location unavailable. Please check your device settings.";
            } else if (error.code === 3) {
                errorMessage = "Location request timed out. Please try again.";
            }

            setLocationError(errorMessage);
        } finally {
            setLocationLoading(false);
        }
    };

    const filteredRestaurants = restaurants.filter((restaurant) =>
        restaurant.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Format pickup time for display
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
        <>
            <Toaster />
            <main className="min-h-screen bg-background">
                {/* Hero Section - Minimalist */}
                <section className="border-b border-border">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="max-w-3xl"
                        >
                            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-6">
                                Browse Rescue Bags
                            </p>
                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-light leading-tight mb-6">
                                Rescue food, <span className="italic">save the planet.</span>
                            </h1>
                            <p className="text-lg md:text-xl text-muted-foreground font-light leading-relaxed">
                                {customer?.name ? `Welcome back, ${customer.name.split(" ")[0]}. ` : ""}
                                Discover surplus food from restaurants near you at 50% off or more.
                            </p>
                        </motion.div>
                    </div>
                </section>

                {/* Location & Search Bar */}
                <div className="border-b border-border">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Location Selector */}
                            <motion.button
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                onClick={() => setShowLocationModal(true)}
                                className="flex items-center gap-3 px-6 py-4 border border-border hover:border-foreground/20 transition-colors"
                            >
                                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                <div className="flex-1 text-left">
                                    {userLocation ? (
                                        <>
                                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                                Current Location
                                            </p>
                                            <p className="text-sm font-light truncate">
                                                {locationName || "Within 7km radius"}
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-sm font-light">Set your location</p>
                                    )}
                                </div>
                            </motion.button>

                            {/* Search Bar */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                                className="flex-1 relative"
                            >
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search restaurants..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 border border-border focus:outline-none focus:border-foreground/20 transition-colors bg-background"
                                />
                            </motion.div>
                        </div>

                        {/* Results Count */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-6"
                        >
                            {filteredRestaurants.length} {filteredRestaurants.length === 1 ? "Restaurant" : "Restaurants"} Found
                            {userLocation && " within 7km"}
                        </motion.p>
                    </div>
                </div>

                {/* Restaurants List */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    {loading ? (
                        <div className="text-center py-24">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                            <p className="text-sm text-muted-foreground mt-4 uppercase tracking-[0.2em]">
                                Finding restaurants near you...
                            </p>
                        </div>
                    ) : !userLocation ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-24"
                        >
                            <Navigation className="w-12 h-12 text-muted-foreground mx-auto mb-6" />
                            <h3 className="text-2xl font-serif font-light mb-3">
                                Location needed
                            </h3>
                            <p className="text-muted-foreground font-light mb-8 max-w-md mx-auto">
                                We need your location to show restaurants within 7km of you.
                            </p>
                            <button
                                onClick={() => setShowLocationModal(true)}
                                className="inline-block px-6 py-3 border border-border hover:border-foreground/20 transition-colors text-sm uppercase tracking-[0.2em]"
                            >
                                Set Location
                            </button>
                        </motion.div>
                    ) : filteredRestaurants.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-24"
                        >
                            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-6" />
                            <h3 className="text-2xl font-serif font-light mb-3">
                                No restaurants nearby
                            </h3>
                            <p className="text-muted-foreground font-light mb-8">
                                No restaurants with available rescue bags within 7km. Try a different location.
                            </p>
                            <button
                                onClick={() => setShowLocationModal(true)}
                                className="inline-block px-6 py-3 border border-border hover:border-foreground/20 transition-colors text-sm uppercase tracking-[0.2em]"
                            >
                                Change Location
                            </button>
                        </motion.div>
                    ) : (
                        <div className="space-y-8">
                            {filteredRestaurants.map((restaurant, index) => (
                                <motion.div
                                    key={restaurant.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="border-b border-border pb-8 last:border-0"
                                >
                                    <Link
                                        href={`/restaurant/${restaurant.id}`}
                                        className="block group"
                                    >
                                        <div className="flex items-start justify-between gap-6">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-2xl md:text-3xl font-serif font-light group-hover:opacity-70 transition-opacity">
                                                        {restaurant.name}
                                                    </h3>
                                                    <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                                        {formatDistance(restaurant.distance_km)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground font-light mb-4">
                                                    {restaurant.cuisine_types?.join(", ")}
                                                </p>
                                                <div className="flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-3 h-3" />
                                                        <span>
                                                            {restaurant.rescue_bags[0] &&
                                                                formatPickupTime(
                                                                    restaurant.rescue_bags[0].pickup_start_time,
                                                                    restaurant.rescue_bags[0].pickup_end_time
                                                                )
                                                            }
                                                        </span>
                                                    </div>
                                                    <div>
                                                        {restaurant.rescue_bags.length} {restaurant.rescue_bags.length === 1 ? "Bag" : "Bags"} Available
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

                {/* Location Modal */}
                <AnimatePresence>
                    {showLocationModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => setShowLocationModal(false)}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-background border border-border max-w-md w-full p-8"
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div>
                                        <h3 className="text-2xl font-serif font-light mb-2">
                                            Your Location
                                        </h3>
                                        <p className="text-sm text-muted-foreground font-light">
                                            Search for a location or use your current location
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowLocationModal(false)}
                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {locationError && (
                                    <div className="mb-6 p-4 border border-red-200 bg-red-50">
                                        <p className="text-sm text-red-800 font-light">{locationError}</p>
                                    </div>
                                )}

                                {/* Search Input with Google Autocomplete */}
                                <div className="mb-4">
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        placeholder="Search for a location..."
                                        className="w-full px-4 py-3 border border-border focus:outline-none focus:border-foreground/20 transition-colors bg-background text-sm"
                                    />
                                </div>

                                <div className="relative mb-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-border"></div>
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase tracking-[0.2em]">
                                        <span className="bg-background px-2 text-muted-foreground">Or</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleRefreshLocation}
                                    disabled={locationLoading}
                                    className="w-full flex items-center justify-center gap-3 px-6 py-4 border border-border hover:border-foreground/20 transition-colors disabled:opacity-50"
                                >
                                    {locationLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Navigation className="w-4 h-4" />
                                    )}
                                    <span className="text-sm uppercase tracking-[0.2em]">
                                        {locationLoading ? "Getting Location..." : "Use Current Location"}
                                    </span>
                                </button>

                                <p className="text-xs text-muted-foreground text-center mt-6 font-light">
                                    We only use your location to show restaurants within 7km
                                </p>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </>
    );
}
