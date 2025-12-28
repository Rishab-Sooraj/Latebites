"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrentLocation, calculateDistance, formatDistance, type Coordinates } from "@/lib/location/geolocation";
import { MapPin, Search, Clock, X, Navigation } from "lucide-react";
import Link from "next/link";
import type { Database } from "@/types/database";

type Restaurant = Database['public']['Tables']['restaurants']['Row'] & {
    distance?: number;
    rescue_bags?: RescueBag[];
};

type RescueBag = Database['public']['Tables']['rescue_bags']['Row'];

export default function BrowsePage() {
    const { customer } = useAuth();
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
    const [locationError, setLocationError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        getCurrentLocation()
            .then((coords) => {
                setUserLocation(coords);
                fetchData(coords);
            })
            .catch((error) => {
                setLocationError(error.message);
                fetchData(null);
            });
    }, []);

    const fetchData = async (coords: Coordinates | null) => {
        setLoading(true);

        try {
            const { data: restaurantData, error: restaurantError } = await supabase
                .from("restaurants")
                .select(`
          *,
          rescue_bags (*)
        `)
                .eq("is_active", true)
                .eq("verified", true);

            if (restaurantError) throw restaurantError;

            let restaurantsWithDistance = (restaurantData || []) as Restaurant[];

            if (coords) {
                restaurantsWithDistance = restaurantData.map((restaurant) => ({
                    ...restaurant,
                    distance: calculateDistance(coords, {
                        latitude: restaurant.latitude,
                        longitude: restaurant.longitude,
                    }),
                }));

                restaurantsWithDistance = restaurantsWithDistance.filter(
                    (r) => r.distance !== undefined && r.distance <= 7
                );

                restaurantsWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));
            }

            const restaurantsWithBags = restaurantsWithDistance.filter(
                (r) => r.rescue_bags && r.rescue_bags.length > 0
            );

            setRestaurants(restaurantsWithBags);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefreshLocation = async () => {
        setLocationLoading(true);
        setLocationError("");

        try {
            const coords = await getCurrentLocation();
            setUserLocation(coords);
            await fetchData(coords);
            setShowLocationModal(false);
        } catch (error: any) {
            setLocationError(error.message);
        } finally {
            setLocationLoading(false);
        }
    };

    const filteredRestaurants = restaurants.filter((restaurant) =>
        restaurant.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
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
                                        <p className="text-sm font-light">
                                            Within 7km radius
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
                    </motion.p>
                </div>
            </div>

            {/* Restaurants List */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                {loading ? (
                    <div className="text-center py-24">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
                        <p className="text-sm text-muted-foreground mt-4 uppercase tracking-[0.2em]">
                            Loading...
                        </p>
                    </div>
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
                            Try changing your location or check back later
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
                                                {restaurant.distance !== undefined && (
                                                    <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                                        {formatDistance(restaurant.distance)}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground font-light mb-4">
                                                {restaurant.cuisine_types?.join(", ")}
                                            </p>
                                            <div className="flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-3 h-3" />
                                                    <span>Pickup: 8-10 PM</span>
                                                </div>
                                                <div>
                                                    {restaurant.rescue_bags?.length || 0} {restaurant.rescue_bags?.length === 1 ? "Bag" : "Bags"} Available
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
                                        We use your location to show nearby restaurants within 7km
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

                            <button
                                onClick={handleRefreshLocation}
                                disabled={locationLoading}
                                className="w-full flex items-center justify-center gap-3 px-6 py-4 border border-border hover:border-foreground/20 transition-colors disabled:opacity-50"
                            >
                                <Navigation className="w-4 h-4" />
                                <span className="text-sm uppercase tracking-[0.2em]">
                                    {locationLoading ? "Getting Location..." : "Use Current Location"}
                                </span>
                            </button>

                            <p className="text-xs text-muted-foreground text-center mt-6 font-light">
                                We only use your location to show nearby restaurants. Your privacy is important to us.
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
