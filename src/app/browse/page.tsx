"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrentLocation, calculateDistance, formatDistance, type Coordinates } from "@/lib/location/geolocation";
import { MapPin, Search, Clock, Sparkles, TrendingUp, Leaf, ChevronRight, Heart, Star } from "lucide-react";
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
    const [featuredBags, setFeaturedBags] = useState<(RescueBag & { restaurants: Restaurant })[]>([]);
    const [loading, setLoading] = useState(true);
    const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
    const [locationError, setLocationError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const supabase = createClient();

    useEffect(() => {
        // Get user location
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
            // Fetch restaurants with their rescue bags
            const { data: restaurantData, error: restaurantError } = await supabase
                .from("restaurants")
                .select(`
          *,
          rescue_bags (*)
        `)
                .eq("is_active", true)
                .eq("verified", true);

            if (restaurantError) throw restaurantError;

            // Calculate distances and filter restaurants with available bags
            let restaurantsWithDistance = (restaurantData || []) as Restaurant[];

            if (coords) {
                restaurantsWithDistance = restaurantData.map((restaurant) => ({
                    ...restaurant,
                    distance: calculateDistance(coords, {
                        latitude: restaurant.latitude,
                        longitude: restaurant.longitude,
                    }),
                }));

                // Sort by distance
                restaurantsWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));
            }

            // Filter to only show restaurants with available bags
            const restaurantsWithBags = restaurantsWithDistance.filter(
                (r) => r.rescue_bags && r.rescue_bags.length > 0
            );

            setRestaurants(restaurantsWithBags);

            // Get featured bags (random selection from available bags)
            const allBags = restaurantsWithBags.flatMap((restaurant) =>
                (restaurant.rescue_bags || [])
                    .filter((bag) => bag.is_active && bag.quantity_available > 0)
                    .map((bag) => ({
                        ...bag,
                        restaurants: restaurant,
                    }))
            );

            // Shuffle and take first 6 for featured
            const shuffled = allBags.sort(() => 0.5 - Math.random());
            setFeaturedBags(shuffled.slice(0, 6));
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredRestaurants = restaurants.filter((restaurant) => {
        const matchesSearch = restaurant.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !selectedCategory || restaurant.cuisine_types?.includes(selectedCategory);
        return matchesSearch && matchesCategory;
    });

    // Get unique cuisine types
    const cuisineTypes = Array.from(
        new Set(restaurants.flatMap((r) => r.cuisine_types || []))
    );

    return (
        <main className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50">
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-4 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />

                <div className="max-w-7xl mx-auto relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-12"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-primary">
                                {userLocation ? `${filteredRestaurants.length} restaurants nearby` : "Discover rescue bags"}
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif mb-4">
                            Rescue food,{" "}
                            <span className="italic text-primary">save the planet</span>
                        </h1>

                        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                            {customer?.name ? `Welcome back, ${customer.name}! ` : ""}
                            Discover surplus food from restaurants near you at 50% off or more
                        </p>
                    </motion.div>

                    {/* Search Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="max-w-2xl mx-auto mb-8"
                    >
                        <div className="relative">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search restaurants or cuisine..."
                                className="w-full pl-14 pr-6 py-5 bg-white/80 backdrop-blur-sm border-2 border-primary/20 rounded-full focus:outline-none focus:border-primary transition-all shadow-lg text-lg"
                            />
                        </div>
                    </motion.div>

                    {/* Location Status */}
                    {locationError && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-2xl mx-auto mb-8 p-4 bg-yellow-50/80 backdrop-blur-sm border border-yellow-200 rounded-full text-sm text-yellow-800 text-center"
                        >
                            <MapPin className="w-4 h-4 inline mr-2" />
                            {locationError}
                        </motion.div>
                    )}

                    {/* Category Pills */}
                    {cuisineTypes.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex gap-3 justify-center flex-wrap"
                        >
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${!selectedCategory
                                        ? "bg-primary text-primary-foreground shadow-lg"
                                        : "bg-white/60 hover:bg-white/80"
                                    }`}
                            >
                                All
                            </button>
                            {cuisineTypes.slice(0, 5).map((cuisine) => (
                                <button
                                    key={cuisine}
                                    onClick={() => setSelectedCategory(cuisine)}
                                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === cuisine
                                            ? "bg-primary text-primary-foreground shadow-lg"
                                            : "bg-white/60 hover:bg-white/80"
                                        }`}
                                >
                                    {cuisine}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </div>
            </section>

            {/* Featured Bags Section */}
            {featuredBags.length > 0 && (
                <section className="py-12 px-4">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-between mb-8"
                        >
                            <div>
                                <h2 className="text-3xl md:text-4xl font-serif mb-2">
                                    Featured rescue bags
                                </h2>
                                <p className="text-muted-foreground">
                                    Limited availability • Pickup today
                                </p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-primary" />
                        </motion.div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {featuredBags.map((bag, index) => (
                                <motion.div
                                    key={bag.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="group relative bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
                                >
                                    {/* Image */}
                                    <div className="h-56 bg-gradient-to-br from-cyan-100 to-teal-100 relative overflow-hidden">
                                        {bag.restaurants.cover_image_url ? (
                                            <img
                                                src={bag.restaurants.cover_image_url}
                                                alt={bag.restaurants.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Leaf className="w-16 h-16 text-primary/20" />
                                            </div>
                                        )}

                                        {/* Discount Badge */}
                                        <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-4 py-2 rounded-full font-bold text-sm shadow-lg">
                                            {Math.round((1 - bag.discounted_price / bag.original_price) * 100)}% OFF
                                        </div>

                                        {/* Distance Badge */}
                                        {bag.restaurants.distance && (
                                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {formatDistance(bag.restaurants.distance)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-6">
                                        <div className="mb-4">
                                            <h3 className="text-xl font-serif mb-1 group-hover:text-primary transition-colors">
                                                {bag.title}
                                            </h3>
                                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                                {bag.restaurants.name}
                                            </p>
                                        </div>

                                        {bag.description && (
                                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                                {bag.description}
                                            </p>
                                        )}

                                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-primary/10">
                                            <div>
                                                <p className="text-xs text-muted-foreground line-through">
                                                    ₹{bag.original_price}
                                                </p>
                                                <p className="text-2xl font-bold text-primary">
                                                    ₹{bag.discounted_price}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {bag.pickup_start_time.slice(0, 5)} - {bag.pickup_end_time.slice(0, 5)}
                                                </p>
                                                <p className="text-xs font-medium text-primary">
                                                    {bag.quantity_available} left
                                                </p>
                                            </div>
                                        </div>

                                        <Link
                                            href={`/bag/${bag.id}`}
                                            className="block w-full py-3 bg-primary text-primary-foreground text-center text-sm uppercase tracking-widest hover:opacity-90 transition-opacity rounded-sm font-medium"
                                        >
                                            Reserve Now
                                        </Link>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Nearby Restaurants Section */}
            <section className="py-12 px-4 bg-white/40">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="flex items-center justify-between mb-8"
                    >
                        <div>
                            <h2 className="text-3xl md:text-4xl font-serif mb-2">
                                Restaurants near you
                            </h2>
                            <p className="text-muted-foreground">
                                {userLocation
                                    ? "Sorted by distance from your location"
                                    : "Enable location to see nearest first"}
                            </p>
                        </div>
                        <MapPin className="w-8 h-8 text-primary" />
                    </motion.div>

                    {loading ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="bg-white rounded-lg p-6 animate-pulse">
                                    <div className="h-40 bg-gray-200 rounded mb-4" />
                                    <div className="h-4 bg-gray-200 rounded mb-2" />
                                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                                </div>
                            ))}
                        </div>
                    ) : filteredRestaurants.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredRestaurants.map((restaurant, index) => {
                                const availableBags = restaurant.rescue_bags?.filter(
                                    (bag) => bag.is_active && bag.quantity_available > 0
                                ) || [];

                                return (
                                    <motion.div
                                        key={restaurant.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.05 }}
                                        className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group"
                                    >
                                        {/* Restaurant Image */}
                                        <div className="h-48 bg-gradient-to-br from-cyan-100 to-teal-100 relative overflow-hidden">
                                            {restaurant.cover_image_url ? (
                                                <img
                                                    src={restaurant.cover_image_url}
                                                    alt={restaurant.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Leaf className="w-16 h-16 text-primary/20" />
                                                </div>
                                            )}

                                            {restaurant.distance && (
                                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full text-sm font-medium flex items-center gap-1 shadow-lg">
                                                    <MapPin className="w-4 h-4 text-primary" />
                                                    {formatDistance(restaurant.distance)}
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="p-6">
                                            <div className="mb-4">
                                                <h3 className="text-2xl font-serif mb-2 group-hover:text-primary transition-colors">
                                                    {restaurant.name}
                                                </h3>
                                                {restaurant.cuisine_types && restaurant.cuisine_types.length > 0 && (
                                                    <div className="flex gap-2 flex-wrap">
                                                        {restaurant.cuisine_types.slice(0, 3).map((cuisine) => (
                                                            <span
                                                                key={cuisine}
                                                                className="text-xs px-3 py-1 bg-primary/10 text-primary rounded-full"
                                                            >
                                                                {cuisine}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {restaurant.description && (
                                                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                                    {restaurant.description}
                                                </p>
                                            )}

                                            <div className="flex items-center justify-between pt-4 border-t border-primary/10">
                                                <div className="text-sm">
                                                    <p className="font-medium text-primary">
                                                        {availableBags.length} bag{availableBags.length !== 1 ? "s" : ""} available
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Starting from ₹{Math.min(...availableBags.map((b) => b.discounted_price))}
                                                    </p>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-20 bg-white rounded-lg"
                        >
                            <Leaf className="w-16 h-16 mx-auto mb-4 text-muted-foreground/40" />
                            <p className="text-xl text-muted-foreground mb-2">
                                {searchQuery
                                    ? "No restaurants match your search"
                                    : "No restaurants with available bags right now"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Check back later or try a different search
                            </p>
                        </motion.div>
                    )}
                </div>
            </section>

            {/* Impact Stats */}
            <section className="py-20 px-4 bg-primary text-primary-foreground">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl md:text-5xl font-serif mb-4">
                            Join the rescue movement
                        </h2>
                        <p className="text-lg opacity-80">
                            Every bag you rescue makes a difference
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { icon: Leaf, value: "50%+", label: "Discount on every bag" },
                            { icon: TrendingUp, value: "Zero", label: "Food waste" },
                            { icon: Heart, value: "Local", label: "Community impact" },
                        ].map((stat, index) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="text-center"
                            >
                                <stat.icon className="w-12 h-12 mx-auto mb-4" />
                                <p className="text-4xl font-bold mb-2">{stat.value}</p>
                                <p className="text-lg opacity-80">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
}
