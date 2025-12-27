import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../config/theme.dart';
import 'signup_screen.dart';

/// Role selection screen matching design image 2
/// User chooses between Customer or Restaurant
class RoleSelectionScreen extends StatelessWidget {
  const RoleSelectionScreen({super.key});
  
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
              Container(
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
                  ),
              
              const SizedBox(height: 32),
              
              // Heading
              Text(
                'How will you use LateBites?',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.displaySmall?.copyWith(
                  fontSize: 32,
                  fontWeight: FontWeight.w400,
                ),
              )
                  .animate()
                  .fadeIn(
                    delay: const Duration(milliseconds: 200),
                    duration: AppTheme.slowAnimation,
                  )
                  .slideY(begin: 0.2, end: 0),
              
              const SizedBox(height: 12),
              
              // Subheading
              Text(
                'Choose your role to get started',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: AppTheme.mutedForeground,
                ),
              )
                  .animate()
                  .fadeIn(
                    delay: const Duration(milliseconds: 400),
                    duration: AppTheme.slowAnimation,
                  ),
              
              const SizedBox(height: 48),
              
              // Customer Role Card
              _buildRoleCard(
                context,
                icon: Icons.shopping_bag_outlined,
                iconColor: AppTheme.orange,
                iconBg: AppTheme.orangeLight,
                title: 'I\'m a Customer',
                subtitle: 'Discover and rescue surplus food from\nlocal restaurants',
                delay: 600,
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (context) => const SignupScreen(role: 'customer'),
                    ),
                  );
                },
              ),
              
              const SizedBox(height: 16),
              
              // Restaurant Role Card
              _buildRoleCard(
                context,
                icon: Icons.storefront_outlined,
                iconColor: AppTheme.primary,
                iconBg: AppTheme.primaryLight,
                title: 'I\'m a Restaurant',
                subtitle: 'List your surplus food and reduce\nwaste while earning',
                delay: 800,
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (context) => const SignupScreen(role: 'restaurant'),
                    ),
                  );
                },
              ),
              
              const Spacer(),
              
              // Sign In Link
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'Already have an account? ',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppTheme.mutedForeground,
                    ),
                  ),
                  GestureDetector(
                    onTap: () {
                      // TODO: Navigate to login
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Login screen coming soon!'),
                          duration: Duration(seconds: 2),
                        ),
                      );
                    },
                    child: Text(
                      'Sign in',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppTheme.orange,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
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
  
  Widget _buildRoleCard(
    BuildContext context, {
    required IconData icon,
    required Color iconColor,
    required Color iconBg,
    required String title,
    required String subtitle,
    required int delay,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: AppTheme.background,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.borderLight, width: 1.5),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            // Icon
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: iconBg,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(
                icon,
                color: iconColor,
                size: 28,
              ),
            ),
            
            const SizedBox(width: 20),
            
            // Text
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w600,
                      fontSize: 18,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    subtitle,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppTheme.mutedForeground,
                      height: 1.5,
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
          .slideY(begin: 0.2, end: 0),
    );
  }
}
