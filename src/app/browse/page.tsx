"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrentLocation, formatDistance, type Coordinates } from "@/lib/location/geolocation";
import { MapPin, Search, Clock, X, Navigation, Loader2, ArrowRight, ShoppingBag, Leaf, TrendingUp, Sparkles } from "lucide-react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";

import { Header } from "@/components/Header";
import { LiveBackground } from "@/components/LiveBackground";
import { RevealText } from "@/components/cinematic/RevealText";
import { ImpactPartners } from "@/components/ImpactPartners";
import { MyActivity } from "@/components/MyActivity";
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

    // Auth protection
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
                setLocationName(data.results[0].formatted_address);
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

    const statsSummary = [
        { label: "Bags Rescued", value: "0", icon: ShoppingBag },
        { label: "Total Savings", value: "₹0", icon: TrendingUp },
        { label: "CO₂ Saved", value: "0 kg", icon: Leaf },
    ];

    return (
        <div className="relative min-h-screen selection:bg-primary selection:text-primary-foreground">
            <Toaster />
            <Header />
            <LiveBackground />

            <main className="pt-24 md:pt-32">
                {/* 1. HERO & QUICK STATS */}
                <section id="hero" className="px-4 sm:px-6 lg:px-12 mb-16">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                            className="flex flex-col md:flex-row justify-between items-end gap-12"
                        >
                            <div className="max-w-3xl">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="flex items-center gap-2 mb-6"
                                >
                                    <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                                    <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Premium Rescue Hub</span>
                                </motion.div>
                                <RevealText
                                    text={`Welcome back, ${customer?.name?.split(" ")[0] || "Rescuer"}.`}
                                    tag="h1"
                                    className="text-4xl md:text-6xl lg:text-7xl font-serif font-light mb-6"
                                />
                                <p className="text-xl text-muted-foreground font-light leading-relaxed max-w-xl">
                                    Your next meal is waiting to be rescued. Premium surplus from the best kitchens in {userLocation ? 'your area' : 'Coimbatore'}.
                                </p>
                            </div>

                            {/* Dashboard Shortcut Stats */}
                            <div className="grid grid-cols-3 gap-8 md:gap-12 pb-2">
                                {statsSummary.map((stat, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.8 + (i * 0.1) }}
                                        className="space-y-2"
                                    >
                                        <p className="text-2xl md:text-3xl font-serif font-light">{stat.value}</p>
                                        <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* 2. SEARCH & DISCOVERY BAR - STICKY-ish */}
                <section className="px-4 sm:px-6 lg:px-12 mb-16 sticky top-24 z-30">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="bg-background/40 backdrop-blur-xl border border-primary/10 p-2 rounded-sm shadow-2xl flex flex-col md:flex-row gap-2"
                        >
                            {/* Location Button */}
                            <button
                                onClick={() => setShowLocationModal(true)}
                                className="flex items-center gap-4 px-6 py-4 hover:bg-primary/5 transition-all group flex-shrink-0 border-b md:border-b-0 md:border-r border-primary/10"
                            >
                                <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                    <MapPin className="w-4 h-4 text-primary" />
                                </div>
                                <div className="text-left overflow-hidden max-w-[200px]">
                                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Current Area</p>
                                    <p className="text-sm font-light truncate">
                                        {locationName || "Detecting location..."}
                                    </p>
                                </div>
                            </button>

                            {/* Search Input */}
                            <div className="flex-1 flex items-center px-6 py-4 group">
                                <Search className="w-4 h-4 text-muted-foreground mr-4 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search by restaurant name or cuisine..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-transparent border-none focus:ring-0 w-full text-sm font-light placeholder:text-muted-foreground/50"
                                />
                            </div>

                            {/* Filters / Count */}
                            <div className="hidden md:flex items-center px-8 border-l border-primary/10 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                                {filteredRestaurants.length} Results
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* 3. RESTAURANT GRID */}
                <section id="browse-results" className="px-4 sm:px-6 lg:px-12 mb-32 min-h-[400px]">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center gap-4 mb-12">
                            <h2 className="text-2xl font-serif">Available Nearby</h2>
                            <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-32 space-y-6">
                                <div className="relative">
                                    <div className="w-12 h-12 border-2 border-primary/20 rounded-full animate-ping" />
                                    <Loader2 className="w-12 h-12 text-primary animate-spin absolute inset-0" />
                                </div>
                                <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground animate-pulse">Scanning nearby kitchens</p>
                            </div>
                        ) : filteredRestaurants.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-32 bg-secondary/5 rounded-sm border border-dashed border-primary/10"
                            >
                                <Navigation className="w-12 h-12 text-muted-foreground/40 mx-auto mb-6" />
                                <h3 className="text-2xl font-serif font-light mb-2">No active rescues found</h3>
                                <p className="text-muted-foreground font-light mb-8 max-w-md mx-auto px-4">
                                    We couldn't find any available rescue bags within 7km of your current location.
                                </p>
                                <button
                                    onClick={() => setShowLocationModal(true)}
                                    className="px-8 py-4 bg-primary text-primary-foreground text-[10px] uppercase tracking-[0.3em] hover:opacity-90 transition-opacity"
                                >
                                    Update Search Area
                                </button>
                            </motion.div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredRestaurants.map((restaurant, index) => (
                                    <motion.div
                                        key={restaurant.id}
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index % 3 * 0.1, duration: 0.8 }}
                                        viewport={{ once: true }}
                                    >
                                        <Link
                                            href={`/restaurant/${restaurant.id}`}
                                            className="group block relative bg-background/60 backdrop-blur-sm border border-primary/5 hover:border-primary/30 transition-all duration-500 overflow-hidden rounded-sm"
                                        >
                                            {/* Card Image / Placeholder */}
                                            <div className="aspect-[16/9] overflow-hidden relative">
                                                <div className="absolute inset-0 bg-secondary/20" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                                                
                                                {/* Distance Badge */}
                                                <div className="absolute top-4 right-4 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 text-[9px] uppercase tracking-widest text-white rounded-full">
                                                    {formatDistance(restaurant.distance_km)}
                                                </div>

                                                {/* Meta Info on Image */}
                                                <div className="absolute bottom-4 left-6 right-6">
                                                    <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] text-white/70 mb-1">
                                                        <Clock className="w-3 h-3" />
                                                        <span>Pickup: {restaurant.rescue_bags[0] && formatPickupTime(restaurant.rescue_bags[0].pickup_start_time, restaurant.rescue_bags[0].pickup_end_time)}</span>
                                                    </div>
                                                    <h3 className="text-xl md:text-2xl font-serif text-white group-hover:translate-x-1 transition-transform duration-500">
                                                        {restaurant.name}
                                                    </h3>
                                                </div>
                                            </div>

                                            {/* Card Content */}
                                            <div className="p-6">
                                                <p className="text-xs text-muted-foreground font-light mb-6 line-clamp-1 italic">
                                                    {restaurant.cuisine_types?.join(" • ") || "Global Cuisines"}
                                                </p>
                                                
                                                <div className="flex items-center justify-between pt-4 border-t border-primary/5">
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Available</p>
                                                        <p className="text-sm font-medium">{restaurant.rescue_bags.length} Rescue {restaurant.rescue_bags.length === 1 ? 'Bag' : 'Bags'}</p>
                                                    </div>
                                                    <div className="w-10 h-10 rounded-full border border-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all duration-500">
                                                        <ArrowRight className="w-4 h-4 group-hover:text-primary-foreground group-hover:translate-x-0.5 transition-all" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Subtle Glow Hover */}
                                            <div className="absolute -inset-px bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* 4. MY ACTIVITY SECTION */}
                <MyActivity />

                {/* 5. IMPACT & PARTNERS SECTION */}
                <ImpactPartners />
            </main>

            {/* Location Modal - Premium Redesign */}
            <AnimatePresence>
                {showLocationModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                            onClick={() => setShowLocationModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-lg bg-background border border-primary/10 p-8 md:p-12 shadow-2xl overflow-hidden rounded-sm"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
                            
                            <div className="flex justify-between items-start mb-12">
                                <div>
                                    <h3 className="text-3xl font-serif mb-2">Refine Search</h3>
                                    <p className="text-sm text-muted-foreground font-light">Set your rescue perimeter.</p>
                                </div>
                                <button
                                    onClick={() => setShowLocationModal(false)}
                                    className="p-2 hover:bg-secondary/10 transition-colors rounded-full"
                                >
                                    <X className="w-5 h-5 text-muted-foreground" />
                                </button>
                            </div>

                            {locationError && (
                                <div className="mb-8 p-4 bg-destructive/5 border border-destructive/20 text-destructive text-xs font-light tracking-wide rounded-sm">
                                    {locationError}
                                </div>
                            )}

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Search Address</label>
                                    <div className="relative group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <input
                                            ref={searchInputRef}
                                            type="text"
                                            placeholder="Enter area, street or landmark..."
                                            className="w-full pl-12 pr-4 py-4 bg-secondary/5 border-b-2 border-primary/10 focus:border-primary focus:outline-none transition-all text-sm font-light"
                                        />
                                    </div>
                                </div>

                                <div className="relative py-4">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-primary/5"></div>
                                    </div>
                                    <div className="relative flex justify-center">
                                        <span className="bg-background px-4 text-[9px] uppercase tracking-[0.5em] text-muted-foreground">OR</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleRefreshLocation}
                                    disabled={locationLoading}
                                    className="w-full flex items-center justify-center gap-4 py-5 border border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all duration-500 group disabled:opacity-50"
                                >
                                    {locationLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Navigation className="w-4 h-4 transition-transform group-hover:rotate-12" />
                                    )}
                                    <span className="text-[10px] uppercase tracking-[0.3em] font-medium">Use Exact Location</span>
                                </button>
                            </div>

                            <p className="text-[9px] text-center text-muted-foreground mt-12 uppercase tracking-widest opacity-60">
                                Privacy Guaranteed • Coimbatore, India
                            </p>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Footer / Copyright - Simplified */}
            <footer id="closing" className="py-12 border-t border-primary/5 px-12 bg-black text-white">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground italic">Latebites Hub</p>
                    <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground opacity-60">© 2024 Coimbatore • Sustainable Food Rescue</p>
                </div>
            </footer>
        </div>
    );
}
