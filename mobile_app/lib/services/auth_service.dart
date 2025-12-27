import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:google_sign_in/google_sign_in.dart';

/// Authentication service handling all auth operations
class AuthService {
  final SupabaseClient _supabase = Supabase.instance.client;
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile'],
  );
  
  /// Get current user
  User? get currentUser => _supabase.auth.currentUser;
  
  /// Check if user is logged in
  bool get isLoggedIn => currentUser != null;
  
  /// Sign up with email and password
  Future<AuthResponse> signUpWithEmail({
    required String email,
    required String password,
    required String fullName,
    required String role, // 'customer' or 'restaurant'
  }) async {
    try {
      // Create user in Supabase Auth
      final response = await _supabase.auth.signUp(
        email: email,
        password: password,
        emailRedirectTo: null, // Disable email confirmation for demo
        data: {
          'full_name': fullName,
          'role': role,
        },
      );
      
      if (response.user == null) {
        throw Exception('Failed to create user');
      }
      
      // Create profile in customers table (matching website schema)
      await _supabase.from('customers').insert({
        'id': response.user!.id,
        'name': fullName,
        'email': email,
        'phone': '', // Will be updated later
      });
      
      return response; // Changed to return AuthResponse to match method signature
    } catch (e) {
      throw Exception('Sign up failed: $e');
    }
  }
  
  /// Sign in with email and password
  Future<AuthResponse> signInWithEmail({
    required String email,
    required String password,
  }) async {
    try {
      return await _supabase.auth.signInWithPassword(
        email: email,
        password: password,
      );
    } catch (e) {
      rethrow;
    }
  }
  
  /// Sign in with Google
  Future<AuthResponse> signInWithGoogle({
    required String role, // 'customer' or 'restaurant'
  }) async {
    try {
      // Trigger Google Sign-In flow
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      
      if (googleUser == null) {
        throw Exception('Google sign-in cancelled');
      }
      
      // Get authentication details
      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
      
      // Sign in to Supabase with Google credentials
      final response = await _supabase.auth.signInWithIdToken(
        provider: OAuthProvider.google,
        idToken: googleAuth.idToken!,
        accessToken: googleAuth.accessToken,
      );
      
      // Create or update user profile
      // Create profile in customers table if it doesn't exist
      final existingProfile = await _supabase
          .from('customers')
          .select()
          .eq('id', response.user!.id)
          .maybeSingle();
      
      if (existingProfile == null) {
        await _supabase.from('customers').insert({
          'id': response.user!.id,
          'name': response.user!.userMetadata?['full_name'] ?? 
                  response.user!.email?.split('@')[0] ?? 'User',
          'email': response.user!.email ?? '',
          'phone': '',
        });
      }
      
      return response;
    } catch (e) {
      throw Exception('Google sign in failed: $e');
    }
  }
  
  /// Sign out
  Future<void> signOut() async {
    try {
      await _googleSignIn.signOut();
      await _supabase.auth.signOut();
    } catch (e) {
      rethrow;
    }
  }
  
  /// Get user role from database
  Future<String?> getUserRole() async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) return null;
      
      // Check if user exists in customers table
      final response = await _supabase
          .from('customers')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();
      
      // If exists in customers table, they're a customer
      if (response != null) {
        return 'customer';
      }
      
      // Otherwise check metadata (for restaurant users)
      return user.userMetadata?['role'] as String?;
    } catch (e) {
      print('Error getting user role: $e');
      return null;
    }
  }
  
  /// Update user profile
  Future<void> updateProfile({
    String? fullName,
    String? phone,
  }) async {
    try {
      if (currentUser == null) throw Exception('No user logged in');
      
      final updates = <String, dynamic>{};
      if (fullName != null) updates['full_name'] = fullName;
      if (phone != null) updates['phone'] = phone;
      
      if (updates.isNotEmpty) {
        await _supabase
            .from('users')
            .update(updates)
            .eq('id', currentUser!.id);
      }
    } catch (e) {
      rethrow;
    }
  }
}

/// Provider for AuthService
final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService();
});

/// Provider for current user
final currentUserProvider = StreamProvider<User?>((ref) {
  return Supabase.instance.client.auth.onAuthStateChange.map((data) => data.session?.user);
});
