import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/supabase_config.dart';

class AuthService {
  final SupabaseClient _client = SupabaseConfig.client;

  User? get currentUser => _client.auth.currentUser;
  bool get isAuthenticated => currentUser != null;

  Stream<AuthState> get authStateChanges => _client.auth.onAuthStateChange;

  /// Sign in with email and password
  /// Verifies that the user is a restaurant owner
  Future<AuthResult> signIn(String email, String password) async {
    try {
      final response = await _client.auth.signInWithPassword(
        email: email,
        password: password,
      );

      if (response.user == null) {
        return AuthResult.error('Login failed');
      }

      // Verify user is a restaurant owner
      final restaurantData = await _client
          .from('restaurants')
          .select('id, name, must_change_password')
          .eq('id', response.user!.id)
          .maybeSingle();

      if (restaurantData == null) {
        await _client.auth.signOut();
        return AuthResult.error(
          'No restaurant account found for this email. Please contact support at partners@latebites.in to get your account set up.',
        );
      }

      final mustChangePassword = restaurantData['must_change_password'] == true;
      final restaurantName = restaurantData['name'] ?? 'Restaurant';
      
      debugPrint('✅ Restaurant logged in: $restaurantName (must_change_password: $mustChangePassword)');
      
      return AuthResult.success(
        response.user!,
        mustChangePassword: mustChangePassword,
        restaurantName: restaurantName,
      );
    } on AuthException catch (e) {
      if (e.message.contains('Invalid login credentials')) {
        return AuthResult.error(
          'Invalid email or password. Please check your credentials and try again.',
        );
      }
      return AuthResult.error(e.message);
    } catch (e) {
      debugPrint('❌ Login error: $e');
      return AuthResult.error('Login failed. Please try again.');
    }
  }

  /// Sign out
  Future<void> signOut() async {
    await _client.auth.signOut();
    debugPrint('👋 Signed out');
  }

  /// Check if there's an existing session and get restaurant info
  Future<SessionCheckResult> checkSession() async {
    final session = _client.auth.currentSession;
    if (session == null) return SessionCheckResult.noSession();

    // Verify it's still a valid restaurant
    final restaurantData = await _client
        .from('restaurants')
        .select('id, name, must_change_password')
        .eq('id', session.user.id)
        .maybeSingle();

    if (restaurantData == null) return SessionCheckResult.noSession();
    
    return SessionCheckResult.valid(
      mustChangePassword: restaurantData['must_change_password'] == true,
      restaurantName: restaurantData['name'] ?? 'Restaurant',
    );
  }
}

class AuthResult {
  final bool success;
  final User? user;
  final String? error;
  final bool mustChangePassword;
  final String? restaurantName;

  AuthResult._({
    required this.success, 
    this.user, 
    this.error,
    this.mustChangePassword = false,
    this.restaurantName,
  });

  factory AuthResult.success(User user, {bool mustChangePassword = false, String? restaurantName}) => 
      AuthResult._(success: true, user: user, mustChangePassword: mustChangePassword, restaurantName: restaurantName);
  factory AuthResult.error(String message) => AuthResult._(success: false, error: message);
}

class SessionCheckResult {
  final bool hasSession;
  final bool mustChangePassword;
  final String restaurantName;

  SessionCheckResult._({
    required this.hasSession,
    this.mustChangePassword = false,
    this.restaurantName = '',
  });

  factory SessionCheckResult.noSession() => SessionCheckResult._(hasSession: false);
  factory SessionCheckResult.valid({bool mustChangePassword = false, String restaurantName = ''}) => 
      SessionCheckResult._(hasSession: true, mustChangePassword: mustChangePassword, restaurantName: restaurantName);
}

