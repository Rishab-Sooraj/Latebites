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

        // Try high accuracy first with a shorter timeout
        const tryGetLocation = (highAccuracy: boolean, timeout: number) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                },
                (error) => {
                    // If high accuracy failed, try low accuracy as fallback
                    if (highAccuracy && error.code === 3) {
                        console.log("High accuracy timed out, trying low accuracy...");
                        tryGetLocation(false, 30000);
                    } else {
                        reject({
                            code: error.code,
                            message: getErrorMessage(error.code),
                        });
                    }
                },
                {
                    enableHighAccuracy: highAccuracy,
                    timeout: timeout,
                    maximumAge: 300000, // Accept cached position up to 5 minutes old
                }
            );
        };

        // Start with low accuracy for faster response
        tryGetLocation(false, 15000);
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
            return "Location access denied. Please enable location in your browser settings, or search for your location manually.";
        case 2:
            return "Couldn't detect your location. Please search for your location manually using the search box above.";
        case 3:
            return "Location detection is taking too long. Please search for your location manually using the search box above.";
        default:
            return "Couldn't get your location. Please search for your location manually.";
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
