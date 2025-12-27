"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MapPin, Clock, Star, ArrowLeft, ShoppingBag, Leaf, Users } from "lucide-react";
import Link from "next/link";
import type { Database } from "@/types/database";
import { calculateDistance, formatDistance, getSavedLocation } from "@/lib/location/geolocation";

type RescueBag = Database['public']['Tables']['rescue_bags']['Row'];
type Restaurant = Database['public']['Tables']['restaurants']['Row'];

export default function BagDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { customer } = useAuth();
    const [bag, setBag] = useState<RescueBag | null>(null);
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [loading, setLoading] = useState(true);
    const [reserving, setReserving] = useState(false);
    const [distance, setDistance] = useState<number | null>(null);

    const supabase = createClient();

    useEffect(() => {
        fetchBagDetails();
    }, [params.id]);

    const fetchBagDetails = async () => {
        try {
            const { data: bagData, error: bagError } = await supabase
                .from("rescue_bags")
                .select("*")
                .eq("id", params.id)
                .single();

            if (bagError) throw bagError;

            setBag(bagData);

            // Fetch restaurant details
            const { data: restaurantData, error: restaurantError } = await supabase
                .from("restaurants")
                .select("*")
                .eq("id", bagData.restaurant_id)
                .single();

            if (restaurantError) throw restaurantError;

            setRestaurant(restaurantData);

            // Calculate distance if we have user location
            const userLocation = getSavedLocation();
            if (userLocation && restaurantData) {
                const dist = calculateDistance(userLocation, {
                    latitude: restaurantData.latitude,
                    longitude: restaurantData.longitude,
                });
                setDistance(dist);
            }
        } catch (error) {
            console.error("Error fetching bag details:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleReserve = async () => {
        if (!customer || !bag) return;

        setReserving(true);

        try {
            // Create order
            const { data: orderData, error: orderError } = await supabase
                .from("orders")
                .insert([{
                    customer_id: customer.id,
                    rescue_bag_id: bag.id,
                    restaurant_id: bag.restaurant_id,
                    quantity: 1,
                    total_price: bag.discounted_price,
                    status: "pending",
                    payment_method: "pay_at_pickup",
                }])
                .select()
                .single();

            if (orderError) throw orderError;

            // Update bag quantity
            const { error: updateError } = await supabase
                .from("rescue_bags")
                .update({ quantity_available: bag.quantity_available - 1 })
                .eq("id", bag.id);

            if (updateError) throw updateError;

            // Redirect to order confirmation
            router.push(`/orders/${orderData.id}`);
        } catch (error: any) {
            console.error("Error creating order:", error);
            alert(error.message || "Failed to reserve bag. Please try again.");
        } finally {
            setReserving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    if (!bag || !restaurant) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground/40" />
                    <h2 className="text-2xl font-serif mb-2">Bag not found</h2>
                    <p className="text-muted-foreground mb-6">This rescue bag may no longer be available</p>
                    <Link
                        href="/browse"
                        className="inline-block px-6 py-3 bg-primary text-primary-foreground text-sm uppercase tracking-widest hover:opacity-90 transition-opacity rounded-sm"
                    >
                        Browse Other Bags
                    </Link>
                </div>
            </div>
        );
    }

    const discountPercent = Math.round((1 - bag.discounted_price / bag.original_price) * 100);

    return (
        <main className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50 pt-24 pb-12 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Back Button */}
                <Link
                    href="/browse"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to browse
                </Link>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Image Section */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-4"
                    >
                        <div className="relative h-96 bg-gradient-to-br from-cyan-100 to-teal-100 rounded-lg overflow-hidden">
                            {restaurant.cover_image_url ? (
                                <img
                                    src={restaurant.cover_image_url}
                                    alt={restaurant.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Leaf className="w-24 h-24 text-primary/20" />
                                </div>
                            )}

                            {/* Discount Badge */}
                            <div className="absolute top-6 left-6 bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold text-lg shadow-lg">
                                {discountPercent}% OFF
                            </div>

                            {/* Distance Badge */}
                            {distance && (
                                <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg">
                                    <MapPin className="w-4 h-4 text-primary" />
                                    {formatDistance(distance)}
                                </div>
                            )}
                        </div>

                        {/* Restaurant Info */}
                        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg border border-primary/10">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-2xl font-serif mb-1">{restaurant.name}</h3>
                                    {restaurant.cuisine_types && restaurant.cuisine_types.length > 0 && (
                                        <div className="flex gap-2 flex-wrap mt-2">
                                            {restaurant.cuisine_types.map((cuisine) => (
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
                                <div className="flex items-center gap-1">
                                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                    <span className="font-medium">4.5</span>
                                </div>
                            </div>

                            {restaurant.description && (
                                <p className="text-sm text-muted-foreground mb-4">
                                    {restaurant.description}
                                </p>
                            )}

                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="w-4 h-4" />
                                <span>{restaurant.address}</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Details Section */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                    >
                        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-lg border border-primary/10">
                            <h1 className="text-4xl font-serif mb-4">{bag.title}</h1>

                            {bag.description && (
                                <p className="text-lg text-muted-foreground mb-6">
                                    {bag.description}
                                </p>
                            )}

                            {/* Price */}
                            <div className="mb-6 pb-6 border-b border-primary/10">
                                <div className="flex items-baseline gap-4">
                                    <span className="text-4xl font-bold text-primary">
                                        ₹{bag.discounted_price}
                                    </span>
                                    <span className="text-xl text-muted-foreground line-through">
                                        ₹{bag.original_price}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Save ₹{bag.original_price - bag.discounted_price} on this bag!
                                </p>
                            </div>

                            {/* Details */}
                            <div className="space-y-4 mb-6">
                                <div className="flex items-center justify-between py-3 border-b border-primary/10">
                                    <div className="flex items-center gap-3">
                                        <Clock className="w-5 h-5 text-primary" />
                                        <span className="font-medium">Pickup Time</span>
                                    </div>
                                    <span className="text-muted-foreground">
                                        {bag.pickup_start_time.slice(0, 5)} - {bag.pickup_end_time.slice(0, 5)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between py-3 border-b border-primary/10">
                                    <div className="flex items-center gap-3">
                                        <ShoppingBag className="w-5 h-5 text-primary" />
                                        <span className="font-medium">Bag Size</span>
                                    </div>
                                    <span className="text-muted-foreground capitalize">{bag.size}</span>
                                </div>

                                <div className="flex items-center justify-between py-3 border-b border-primary/10">
                                    <div className="flex items-center gap-3">
                                        <Users className="w-5 h-5 text-primary" />
                                        <span className="font-medium">Available</span>
                                    </div>
                                    <span className="text-primary font-medium">
                                        {bag.quantity_available} bag{bag.quantity_available !== 1 ? "s" : ""} left
                                    </span>
                                </div>
                            </div>

                            {/* Reserve Button */}
                            <button
                                onClick={handleReserve}
                                disabled={reserving || bag.quantity_available === 0}
                                className="w-full py-4 bg-primary text-primary-foreground text-sm uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-medium rounded-sm"
                            >
                                {reserving
                                    ? "Reserving..."
                                    : bag.quantity_available === 0
                                        ? "Sold Out"
                                        : "Reserve This Bag"}
                            </button>

                            <p className="text-xs text-center text-muted-foreground mt-4">
                                Payment: Pay at pickup • No cancellation fee
                            </p>
                        </div>

                        {/* Impact Card */}
                        <div className="bg-gradient-to-br from-primary/10 to-teal-100/50 p-6 rounded-lg border border-primary/20">
                            <h3 className="text-lg font-serif mb-4 flex items-center gap-2">
                                <Leaf className="w-5 h-5 text-primary" />
                                Your Impact
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-2xl font-bold text-primary">2.5kg</p>
                                    <p className="text-xs text-muted-foreground">Food saved</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-primary">3.2kg</p>
                                    <p className="text-xs text-muted-foreground">CO₂ reduced</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </main>
    );
}
