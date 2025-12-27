import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../config/theme.dart';
import '../services/supabase_service.dart';
import '../widgets/custom_button.dart';

/// Email verification screen
class VerifyScreen extends StatefulWidget {
  final String token;
  
  const VerifyScreen({
    super.key,
    required this.token,
  });
  
  @override
  State<VerifyScreen> createState() => _VerifyScreenState();
}

class _VerifyScreenState extends State<VerifyScreen> {
  bool _isVerifying = true;
  bool _isSuccess = false;
  String _message = '';
  
  @override
  void initState() {
    super.initState();
    _verifyEmail();
  }
  
  Future<void> _verifyEmail() async {
    final result = await SupabaseService.verifyEmail(widget.token);
    
    setState(() {
      _isVerifying = false;
      _isSuccess = result['success'];
      _message = result['message'];
    });
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text(
          'Email Verification',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontStyle: FontStyle.italic,
              ),
        ),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(AppTheme.spacingXl),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (_isVerifying)
                Column(
                  children: [
                    const CircularProgressIndicator(
                      color: AppTheme.primary,
                      strokeWidth: 2,
                    ),
                    const SizedBox(height: AppTheme.spacingXl),
                    Text(
                      'Verifying your email...',
                      style: Theme.of(context).textTheme.bodyLarge,
                      textAlign: TextAlign.center,
                    ),
                  ],
                )
              else
                Column(
                  children: [
                    Icon(
                      _isSuccess ? Icons.check_circle_outline : Icons.error_outline,
                      size: 80,
                      color: _isSuccess ? Colors.green : AppTheme.destructive,
                    )
                        .animate()
                        .fadeIn(duration: AppTheme.slowAnimation)
                        .scale(
                          begin: const Offset(0.8, 0.8),
                          end: const Offset(1, 1),
                          duration: AppTheme.slowAnimation,
                        ),
                    const SizedBox(height: AppTheme.spacingXl),
                    Text(
                      _message,
                      style: Theme.of(context).textTheme.bodyLarge,
                      textAlign: TextAlign.center,
                    )
                        .animate()
                        .fadeIn(
                          delay: const Duration(milliseconds: 200),
                          duration: AppTheme.slowAnimation,
                        ),
                    const SizedBox(height: AppTheme.spacing2xl),
                    PremiumButton(
                      text: 'Back to Home',
                      onPressed: () {
                        Navigator.of(context).popUntil((route) => route.isFirst);
                      },
                    )
                        .animate()
                        .fadeIn(
                          delay: const Duration(milliseconds: 400),
                          duration: AppTheme.slowAnimation,
                        ),
                  ],
                ),
            ],
          ),
        ),
      ),
    );
  }
}
