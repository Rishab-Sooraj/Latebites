import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../config/theme.dart';
import '../providers/location_provider.dart';

/// Location permission request screen
class LocationPermissionScreen extends ConsumerWidget {
  const LocationPermissionScreen({super.key});
  
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locationState = ref.watch(locationProvider);
    
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Location Icon
              Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  color: AppTheme.orangeLight,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.location_on_outlined,
                  size: 60,
                  color: AppTheme.orange,
                ),
              )
                  .animate()
                  .fadeIn(duration: AppTheme.cinematicAnimation)
                  .scale(),
              
              const SizedBox(height: 40),
              
              // Heading
              Text(
                'Enable Location',
                style: Theme.of(context).textTheme.displaySmall?.copyWith(
                  fontSize: 32,
                ),
                textAlign: TextAlign.center,
              )
                  .animate()
                  .fadeIn(
                    delay: const Duration(milliseconds: 200),
                    duration: AppTheme.slowAnimation,
                  )
                  .slideY(begin: 0.2, end: 0),
              
              const SizedBox(height: 16),
              
              // Description
              Text(
                'We need your location to show nearby restaurants with available rescue bags',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: AppTheme.mutedForeground,
                  height: 1.6,
                ),
                textAlign: TextAlign.center,
              )
                  .animate()
                  .fadeIn(
                    delay: const Duration(milliseconds: 400),
                    duration: AppTheme.slowAnimation,
                  ),
              
              const SizedBox(height: 48),
              
              // Error Message
              if (locationState.error != null)
                Container(
                  padding: const EdgeInsets.all(16),
                  margin: const EdgeInsets.only(bottom: 24),
                  decoration: BoxDecoration(
                    color: AppTheme.error.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: AppTheme.error.withOpacity(0.3),
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.error_outline,
                        color: AppTheme.error,
                        size: 24,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          locationState.error!,
                          style: TextStyle(
                            color: AppTheme.error,
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ],
                  ),
                )
                    .animate()
                    .fadeIn()
                    .shake(),
              
              // Enable Location Button
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton.icon(
                  onPressed: locationState.isLoading
                      ? null
                      : () async {
                          await ref
                              .read(locationProvider.notifier)
                              .requestLocationPermission(context);
                          
                          // If location obtained successfully, navigate to home
                          if (ref.read(locationProvider).position != null) {
                            // TODO: Navigate to customer home screen
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    'Location enabled: ${ref.read(locationProvider).address ?? "Location obtained"}',
                                  ),
                                  backgroundColor: AppTheme.success,
                                ),
                              );
                            }
                          }
                        },
                  icon: locationState.isLoading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : const Icon(Icons.location_on),
                  label: Text(
                    locationState.isLoading
                        ? 'Getting Location...'
                        : 'Enable Location',
                  ),
                ),
              )
                  .animate()
                  .fadeIn(
                    delay: const Duration(milliseconds: 600),
                    duration: AppTheme.slowAnimation,
                  )
                  .slideY(begin: 0.2, end: 0),
              
              const SizedBox(height: 16),
              
              // Skip Button
              TextButton(
                onPressed: () {
                  // TODO: Navigate to home without location
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('You can enable location later in settings'),
                    ),
                  );
                },
                child: Text(
                  'Skip for now',
                  style: TextStyle(
                    color: AppTheme.mutedForeground,
                  ),
                ),
              )
                  .animate()
                  .fadeIn(
                    delay: const Duration(milliseconds: 800),
                    duration: const Duration(milliseconds: 2000),
                  ),
              
              const Spacer(),
              
              // Privacy Note
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.lock_outline,
                    size: 16,
                    color: AppTheme.mutedForeground.withOpacity(0.6),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Your location is only used to find nearby restaurants',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppTheme.mutedForeground.withOpacity(0.6),
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
}
