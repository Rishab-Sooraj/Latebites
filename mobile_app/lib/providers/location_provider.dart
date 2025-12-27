import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import '../services/location_service.dart';

/// Location state
class LocationState {
  final Position? position;
  final String? address;
  final bool isLoading;
  final String? error;
  
  LocationState({
    this.position,
    this.address,
    this.isLoading = false,
    this.error,
  });
  
  LocationState copyWith({
    Position? position,
    String? address,
    bool? isLoading,
    String? error,
  }) {
    return LocationState(
      position: position ?? this.position,
      address: address ?? this.address,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

/// Location provider
class LocationNotifier extends StateNotifier<LocationState> {
  LocationNotifier() : super(LocationState());
  
  /// Request location permission and get current location
  Future<void> requestLocationPermission(BuildContext context) async {
    state = state.copyWith(isLoading: true, error: null);
    
    try {
      // Check if location service is enabled
      bool serviceEnabled = await LocationService.isLocationServiceEnabled();
      if (!serviceEnabled) {
        state = state.copyWith(
          isLoading: false,
          error: 'Location services are disabled. Please enable them in settings.',
        );
        return;
      }
      
      // Request permission
      LocationPermission permission = await LocationService.requestPermission();
      
      if (permission == LocationPermission.denied) {
        state = state.copyWith(
          isLoading: false,
          error: 'Location permission denied',
        );
        return;
      }
      
      if (permission == LocationPermission.deniedForever) {
        state = state.copyWith(
          isLoading: false,
          error: 'Location permission permanently denied. Please enable in settings.',
        );
        return;
      }
      
      // Get current location
      await getCurrentLocation();
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Error requesting location: $e',
      );
    }
  }
  
  /// Get current location
  Future<void> getCurrentLocation() async {
    state = state.copyWith(isLoading: true, error: null);
    
    try {
      Position? position = await LocationService.getCurrentLocation();
      
      if (position == null) {
        state = state.copyWith(
          isLoading: false,
          error: 'Could not get location',
        );
        return;
      }
      
      // Get address from coordinates
      String? address = await LocationService.getAddressFromCoordinates(
        latitude: position.latitude,
        longitude: position.longitude,
      );
      
      state = state.copyWith(
        position: position,
        address: address,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Error getting location: $e',
      );
    }
  }
  
  /// Clear location
  void clearLocation() {
    state = LocationState();
  }
}

/// Location provider instance
final locationProvider = StateNotifierProvider<LocationNotifier, LocationState>((ref) {
  return LocationNotifier();
});
