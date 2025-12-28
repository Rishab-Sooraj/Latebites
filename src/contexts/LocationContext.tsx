"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { createClient } from "@/lib/supabase/client";

interface LocationContextType {
    latitude: number | null;
    longitude: number | null;
    loading: boolean;
    error: string | null;
    requestLocation: () => Promise<void>;
    hasPermission: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
    const { customer } = useAuth();
    const supabase = createClient();

    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasPermission, setHasPermission] = useState(false);

    // Load saved location from customer profile
    useEffect(() => {
        if (customer?.latitude && customer?.longitude) {
            setLatitude(customer.latitude);
            setLongitude(customer.longitude);
            setHasPermission(true);
        }
    }, [customer]);

    const requestLocation = async () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                });
            });

            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            setLatitude(lat);
            setLongitude(lon);
            setHasPermission(true);

            // Save to customer profile if logged in
            if (customer?.id) {
                const { error: updateError } = await supabase
                    .from("customers")
                    .update({
                        latitude: lat,
                        longitude: lon,
                        location_updated_at: new Date().toISOString(),
                    })
                    .eq("id", customer.id);

                if (updateError) {
                    console.error("Error saving location:", updateError);
                }
            }
        } catch (err: any) {
            console.error("Geolocation error:", err);

            if (err.code === 1) {
                setError("Location permission denied. Please enable location access in your browser settings.");
            } else if (err.code === 2) {
                setError("Location unavailable. Please check your device settings.");
            } else if (err.code === 3) {
                setError("Location request timed out. Please try again.");
            } else {
                setError("Failed to get your location. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <LocationContext.Provider
            value={{
                latitude,
                longitude,
                loading,
                error,
                requestLocation,
                hasPermission,
            }}
        >
            {children}
        </LocationContext.Provider>
    );
}

export function useLocation() {
    const context = useContext(LocationContext);
    if (context === undefined) {
        throw new Error("useLocation must be used within a LocationProvider");
    }
    return context;
}
