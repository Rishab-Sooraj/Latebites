import 'package:flutter/material.dart';
import '../config/supabase_config.dart';

/// Service for all Supabase operations
class SupabaseService {
  /// Submit restaurant onboarding form
  static Future<Map<String, dynamic>> submitOnboarding({
    required String restaurantName,
    required String contactPerson,
    required String email,
    required String phoneNumber,
    required String city,
  }) async {
    try {
      debugPrint('📤 Submitting restaurant onboarding...');
      
      final response = await SupabaseConfig.client
          .from('Restaurant Onboarding')
          .insert({
            'restaurant_name': restaurantName,
            'contact_person': contactPerson,
            'email': email,
            'phone_number': phoneNumber,
            'city': city,
            'status': 'pending',
            'created_at': DateTime.now().toIso8601String(),
          })
          .select()
          .single();
      
      debugPrint('✅ Onboarding submitted successfully');
      
      return {
        'success': true,
        'message': 'Thank you! We\'ve received your application. Please check your email to verify your address.',
        'data': response,
      };
    } catch (e) {
      debugPrint('❌ Error submitting onboarding: $e');
      
      return {
        'success': false,
        'message': 'Failed to submit. Please try again.',
        'error': e.toString(),
      };
    }
  }
  
  /// Verify email with token
  static Future<Map<String, dynamic>> verifyEmail(String token) async {
    try {
      debugPrint('📤 Verifying email with token...');
      
      final response = await SupabaseConfig.client
          .from('Restaurant Onboarding')
          .select()
          .eq('verification_token', token)
          .single();
      
      if (response == null) {
        return {
          'success': false,
          'message': 'Invalid verification token.',
        };
      }
      
      // Update verification status
      await SupabaseConfig.client
          .from('Restaurant Onboarding')
          .update({
            'email_verified': true,
            'status': 'verified',
          })
          .eq('verification_token', token);
      
      debugPrint('✅ Email verified successfully');
      
      return {
        'success': true,
        'message': 'Email verified successfully! We\'ll be in touch soon.',
      };
    } catch (e) {
      debugPrint('❌ Error verifying email: $e');
      
      return {
        'success': false,
        'message': 'Verification failed. Please try again.',
        'error': e.toString(),
      };
    }
  }
  
  /// Get all restaurants (for future use)
  static Future<List<Map<String, dynamic>>> getRestaurants() async {
    try {
      final response = await SupabaseConfig.client
          .from('Restaurant Onboarding')
          .select()
          .eq('status', 'verified')
          .order('created_at', ascending: false);
      
      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      debugPrint('❌ Error fetching restaurants: $e');
      return [];
    }
  }
}
