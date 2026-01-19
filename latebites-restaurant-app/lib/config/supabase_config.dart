import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Supabase configuration and client initialization
class SupabaseConfig {
  static Future<void> initialize() async {
    try {
      await dotenv.load(fileName: '.env');
      debugPrint('✅ .env file loaded');
    } catch (e) {
      debugPrint('❌ Failed to load .env file: $e');
    }
    
    final supabaseUrl = dotenv.env['SUPABASE_URL'] ?? '';
    final supabaseAnonKey = dotenv.env['SUPABASE_ANON_KEY'] ?? '';
    
    debugPrint('🔗 Supabase URL: $supabaseUrl');
    debugPrint('🔑 Anon Key length: ${supabaseAnonKey.length}');
    
    if (supabaseUrl.isEmpty || supabaseAnonKey.isEmpty) {
      debugPrint('⚠️ Warning: Supabase credentials not found in .env file');
      debugPrint('Available env vars: ${dotenv.env.keys.toList()}');
    }
    
    await Supabase.initialize(
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      debug: true,
    );
    
    debugPrint('✅ Supabase initialized successfully');
  }
  
  static SupabaseClient get client => Supabase.instance.client;
}

