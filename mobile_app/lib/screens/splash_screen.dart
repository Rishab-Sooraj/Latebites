import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../config/theme.dart';
import 'home_screen.dart';

/// Splash screen with animated Latebites logo
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});
  
  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _navigateToHome();
  }
  
  Future<void> _navigateToHome() async {
    await Future.delayed(const Duration(milliseconds: 2500));
    if (mounted) {
      Navigator.of(context).pushReplacement(
        PageRouteBuilder(
          pageBuilder: (context, animation, secondaryAnimation) => const HomeScreen(),
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            return FadeTransition(
              opacity: animation,
              child: child,
            );
          },
          transitionDuration: AppTheme.slowAnimation,
        ),
      );
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'Latebites',
              style: Theme.of(context).textTheme.displayMedium?.copyWith(
                    fontStyle: FontStyle.italic,
                    letterSpacing: -1,
                  ),
            )
                .animate()
                .fadeIn(
                  duration: AppTheme.cinematicAnimation,
                  curve: Curves.easeOut,
                )
                .slideY(
                  begin: 0.2,
                  end: 0,
                  duration: AppTheme.cinematicAnimation,
                  curve: Curves.easeOut,
                ),
            const SizedBox(height: AppTheme.spacingLg),
            Text(
              'SURPLUS IS A GIFT',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    letterSpacing: 5,
                  ),
            )
                .animate()
                .fadeIn(
                  delay: const Duration(milliseconds: 500),
                  duration: AppTheme.slowAnimation,
                ),
          ],
        ),
      ),
    );
  }
}
