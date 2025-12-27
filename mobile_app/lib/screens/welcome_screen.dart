import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../config/theme.dart';
import 'role_selection_screen.dart';

/// Welcome screen matching the design image
/// Shows app intro with "Get Started" CTA
class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 48),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Spacer(),
              
              // Logo Icon
              _buildLogo(),
              
              const SizedBox(height: 32),
              
              // App Name
              Text(
                'LateBites',
                style: Theme.of(context).textTheme.displayMedium?.copyWith(
                  fontWeight: FontWeight.w400,
                ),
              )
                  .animate()
                  .fadeIn(duration: AppTheme.cinematicAnimation)
                  .slideY(begin: 0.2, end: 0),
              
              const SizedBox(height: 16),
              
              // Tagline
              Text(
                'Fresh surplus food from your favorite\nrestaurants at amazing prices.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: AppTheme.mutedForeground,
                  height: 1.6,
                ),
              )
                  .animate()
                  .fadeIn(
                    delay: const Duration(milliseconds: 200),
                    duration: AppTheme.slowAnimation,
                  ),
              
              const SizedBox(height: 48),
              
              // Feature Cards
              _buildFeatureCard(
                context,
                icon: Icons.shopping_bag_outlined,
                iconColor: AppTheme.orange,
                iconBg: AppTheme.orangeLight,
                title: 'Rescue Bags',
                subtitle: 'Surprise bags worth ₹300+ for just ₹99',
                delay: 400,
              ),
              
              const SizedBox(height: 16),
              
              _buildFeatureCard(
                context,
                icon: Icons.restaurant_outlined,
                iconColor: AppTheme.primary,
                iconBg: AppTheme.primaryLight,
                title: 'Quality Food',
                subtitle: 'Fresh surplus, never leftovers',
                delay: 600,
              ),
              
              const Spacer(),
              
              // Get Started Button
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (context) => const RoleSelectionScreen(),
                      ),
                    );
                  },
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('Get Started'),
                      const SizedBox(width: 8),
                      Icon(
                        Icons.arrow_forward,
                        size: 20,
                        color: Colors.white,
                      ),
                    ],
                  ),
                ),
              )
                  .animate()
                  .fadeIn(
                    delay: const Duration(milliseconds: 800),
                    duration: AppTheme.slowAnimation,
                  )
                  .slideY(begin: 0.2, end: 0),
              
              const SizedBox(height: 16),
              
              // Bottom Text
              Text(
                'Join thousands reducing food waste',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppTheme.mutedForeground.withOpacity(0.6),
                ),
              )
                  .animate()
                  .fadeIn(
                    delay: const Duration(milliseconds: 1000),
                    duration: const Duration(milliseconds: 2000),
                  ),
            ],
          ),
        ),
      ),
    );
  }
  
  Widget _buildLogo() {
    return Container(
      width: 80,
      height: 80,
      decoration: BoxDecoration(
        color: AppTheme.orange,
        borderRadius: BorderRadius.circular(20),
      ),
      child: const Icon(
        Icons.shopping_bag,
        size: 40,
        color: Colors.white,
      ),
    )
        .animate()
        .fadeIn(duration: AppTheme.cinematicAnimation)
        .scale(
          begin: const Offset(0.8, 0.8),
          end: const Offset(1, 1),
          duration: AppTheme.cinematicAnimation,
        );
  }
  
  Widget _buildFeatureCard(
    BuildContext context, {
    required IconData icon,
    required Color iconColor,
    required Color iconBg,
    required String title,
    required String subtitle,
    required int delay,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.background,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.borderLight),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          // Icon
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: iconBg,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              icon,
              color: iconColor,
              size: 24,
            ),
          ),
          
          const SizedBox(width: 16),
          
          // Text
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppTheme.mutedForeground,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    )
        .animate()
        .fadeIn(
          delay: Duration(milliseconds: delay),
          duration: AppTheme.slowAnimation,
        )
        .slideX(begin: 0.2, end: 0);
  }
}
