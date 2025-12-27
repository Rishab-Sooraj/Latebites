import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';

/// Location service for getting user location and calculating distances
class LocationService {
  /// Check if location services are enabled
  static Future<bool> isLocationServiceEnabled() async {
    return await Geolocator.isLocationServiceEnabled();
  }
  
  /// Check location permission status
  static Future<LocationPermission> checkPermission() async {
    return await Geolocator.checkPermission();
  }
  
  /// Request location permission
  static Future<LocationPermission> requestPermission() async {
    return await Geolocator.requestPermission();
  }
  
  /// Get current user location
  /// Returns null if permission denied or service disabled
  static Future<Position?> getCurrentLocation() async {
    try {
      // Check if location services are enabled
      bool serviceEnabled = await isLocationServiceEnabled();
      if (!serviceEnabled) {
        return null;
      }
      
      // Check permission
      LocationPermission permission = await checkPermission();
      
      if (permission == LocationPermission.denied) {
        permission = await requestPermission();
        if (permission == LocationPermission.denied) {
          return null;
        }
      }
      
      if (permission == LocationPermission.deniedForever) {
        return null;
      }
      
      // Get current position
      return await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
    } catch (e) {
      print('Error getting location: $e');
      return null;
    }
  }
  
  /// Calculate distance between two coordinates in kilometers
  static double calculateDistance({
    required double startLat,
    required double startLng,
    required double endLat,
    required double endLng,
  }) {
    return Geolocator.distanceBetween(
      startLat,
      startLng,
      endLat,
      endLng,
    ) / 1000; // Convert meters to kilometers
  }
  
  /// Get address from coordinates (reverse geocoding)
  static Future<String?> getAddressFromCoordinates({
    required double latitude,
    required double longitude,
  }) async {
    try {
      List<Placemark> placemarks = await placemarkFromCoordinates(
        latitude,
        longitude,
      );
      
      if (placemarks.isNotEmpty) {
        Placemark place = placemarks[0];
        return '${place.street}, ${place.locality}, ${place.administrativeArea}';
      }
      return null;
    } catch (e) {
      print('Error getting address: $e');
      return null;
    }
  }
  
  /// Get coordinates from address (geocoding)
  static Future<Position?> getCoordinatesFromAddress(String address) async {
    try {
      List<Location> locations = await locationFromAddress(address);
      
      if (locations.isNotEmpty) {
        Location location = locations[0];
        return Position(
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: DateTime.now(),
          accuracy: 0,
          altitude: 0,
          altitudeAccuracy: 0,
          heading: 0,
          headingAccuracy: 0,
          speed: 0,
          speedAccuracy: 0,
        );
      }
      return null;
    } catch (e) {
      print('Error getting coordinates: $e');
      return null;
    }
  }
  
  /// Check if user is within a certain radius of a location (in km)
  static bool isWithinRadius({
    required double userLat,
    required double userLng,
    required double targetLat,
    required double targetLng,
    required double radiusKm,
  }) {
    double distance = calculateDistance(
      startLat: userLat,
      startLng: userLng,
      endLat: targetLat,
      endLng: targetLng,
    );
    return distance <= radiusKm;
  }
  
  /// Format distance for display
  static String formatDistance(double distanceKm) {
    if (distanceKm < 1) {
      return '${(distanceKm * 1000).round()} m';
    } else {
      return '${distanceKm.toStringAsFixed(1)} km';
    }
  }
  
  /// Get nearby restaurants from Supabase based on user location
  /// Returns restaurants within specified radius (default 10km)
  static Future<List<Map<String, dynamic>>> getNearbyRestaurants({
    required double userLat,
    required double userLng,
    double radiusKm = 10.0,
  }) async {
    // This will be implemented with Supabase query
    // For now, returning empty list
    // TODO: Implement Supabase query with PostGIS or filter in-app
    return [];
  }
}
