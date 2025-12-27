// Geolocation utilities for location-based features

export interface Coordinates {
    latitude: number;
    longitude: number;
}

export interface LocationError {
    code: number;
    message: string;
}

/**
 * Get user's current location using browser geolocation API
 */
export async function getCurrentLocation(): Promise<Coordinates> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject({
                code: 0,
                message: "Geolocation is not supported by your browser",
            });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            (error) => {
                reject({
                    code: error.code,
                    message: getErrorMessage(error.code),
                });
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    });
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
    coord1: Coordinates,
    coord2: Coordinates
): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(coord2.latitude - coord1.latitude);
    const dLon = toRadians(coord2.longitude - coord1.longitude);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(coord1.latitude)) *
        Math.cos(toRadians(coord2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Format distance for display
 */
export function formatDistance(distanceKm: number): string {
    if (distanceKm < 1) {
        return `${Math.round(distanceKm * 1000)}m`;
    }
    return `${distanceKm.toFixed(1)}km`;
}

/**
 * Check if user has granted location permission
 */
export async function checkLocationPermission(): Promise<PermissionState> {
    if (!navigator.permissions) {
        return "prompt";
    }

    try {
        const result = await navigator.permissions.query({ name: "geolocation" });
        return result.state;
    } catch {
        return "prompt";
    }
}

// Helper functions
function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

function getErrorMessage(code: number): string {
    switch (code) {
        case 1:
            return "Location permission denied. Please enable location access in your browser settings.";
        case 2:
            return "Location unavailable. Please check your device settings.";
        case 3:
            return "Location request timed out. Please try again.";
        default:
            return "An unknown error occurred while getting your location.";
    }
}

/**
 * Store user location in localStorage
 */
export function saveLocation(coords: Coordinates): void {
    localStorage.setItem("userLocation", JSON.stringify(coords));
}

/**
 * Get stored user location from localStorage
 */
export function getSavedLocation(): Coordinates | null {
    const saved = localStorage.getItem("userLocation");
    if (!saved) return null;

    try {
        return JSON.parse(saved);
    } catch {
        return null;
    }
}

/**
 * Clear saved location
 */
export function clearSavedLocation(): void {
    localStorage.removeItem("userLocation");
}
