/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

/**
 * Check if a location is within a given radius
 * @param userLat User's latitude
 * @param userLon User's longitude
 * @param targetLat Target latitude
 * @param targetLon Target longitude
 * @param radiusKm Radius in kilometers
 * @returns True if within radius
 */
export function isWithinRadius(
    userLat: number,
    userLon: number,
    targetLat: number,
    targetLon: number,
    radiusKm: number
): boolean {
    const distance = calculateDistance(userLat, userLon, targetLat, targetLon);
    return distance <= radiusKm;
}

/**
 * Format distance for display
 * @param km Distance in kilometers
 * @returns Formatted string (e.g., "2.3 km" or "850 m")
 */
export function formatDistance(km: number): string {
    if (km < 1) {
        return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
}

/**
 * Get color class based on distance
 * @param km Distance in kilometers
 * @returns Tailwind color class
 */
export function getDistanceColor(km: number): string {
    if (km < 2) return "text-green-600";
    if (km < 5) return "text-yellow-600";
    return "text-orange-600";
}
