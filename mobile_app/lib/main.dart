import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'config/theme.dart';
import 'config/supabase_config.dart';
import 'screens/landing_screen.dart';
import 'screens/main_navigation.dart';
import 'screens/onboarding_flow.dart';

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
    return FutureBuilder<bool>(
      future: _checkOnboardingStatus(),
      builder: (context, snapshot) {
        // Show loading while checking
        if (!snapshot.hasData) {
          return const Scaffold(
            body: Center(
              child: CircularProgressIndicator(color: AppTheme.primary),
            ),
          );
        }

        final hasSeenOnboarding = snapshot.data!;
        
        // If first time, show onboarding
        if (!hasSeenOnboarding) {
          return const OnboardingFlow();
        }

        // Check if user is already logged in
        final session = Supabase.instance.client.auth.currentSession;
        
        if (session != null) {
          return const MainNavigation();
        }
        
        return const LandingScreen();
      },
    );
  }

  Future<bool> _checkOnboardingStatus() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool('onboarding_complete') ?? false;
  }
}

