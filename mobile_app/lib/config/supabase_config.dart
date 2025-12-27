import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Supabase configuration and client initialization
class SupabaseConfig {
  static Future<void> initialize() async {
    // Load environment variables
    await dotenv.load(fileName: '.env');
    
    final supabaseUrl = dotenv.env['SUPABASE_URL'] ?? '';
    final supabaseAnonKey = dotenv.env['SUPABASE_ANON_KEY'] ?? '';
    
    if (supabaseUrl.isEmpty || supabaseAnonKey.isEmpty) {
      debugPrint('⚠️ Warning: Supabase credentials not found in .env file');
      debugPrint('Please add SUPABASE_URL and SUPABASE_ANON_KEY to mobile_app/.env');
    }
    
    await Supabase.initialize(
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      debug: true,
    );
    
    debugPrint('✅ Supabase initialized successfully');
  }
  
  /// Get the Supabase client instance
  static SupabaseClient get client => Supabase.instance.client;
}
