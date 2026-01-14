import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'config/theme.dart';
import 'config/supabase_config.dart';
import 'screens/landing_screen.dart';
import 'screens/main_navigation.dart';
import 'screens/onboarding_flow.dart';
import 'screens/splash_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Supabase
  await SupabaseConfig.initialize();
  
  runApp(
    const ProviderScope(
      child: LateBitesApp(),
    ),
  );
}

class LateBitesApp extends StatelessWidget {
  const LateBitesApp({super.key});
  
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'LateBites',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: _buildInitialScreen(),
    );
  }
  
  Widget _buildInitialScreen() {
    // Always show splash screen first
    return const SplashScreen();
  }
}

