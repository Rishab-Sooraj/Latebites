import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/theme.dart';
import '../config/supabase_config.dart';
import 'main_navigation.dart';

class ChangePasswordScreen extends StatefulWidget {
  final String restaurantName;
  final bool isVoluntary; // true if user chose to change password from settings
  
  const ChangePasswordScreen({
    super.key,
    required this.restaurantName,
    this.isVoluntary = false,
  });

  @override
  State<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends State<ChangePasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  
  bool _isSubmitting = false;
  bool _success = false;
  String? _error;
  
  bool _obscureCurrent = true;
  bool _obscureNew = true;
  bool _obscureConfirm = true;

  @override
  void dispose() {
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;
    
    final currentPassword = _currentPasswordController.text;
    final newPassword = _newPasswordController.text;
    final confirmPassword = _confirmPasswordController.text;
    
    // Validation
    if (newPassword.length < 8) {
      setState(() => _error = 'New password must be at least 8 characters');
      return;
    }
    
    if (newPassword != confirmPassword) {
      setState(() => _error = 'New passwords do not match');
      return;
    }
    
    if (currentPassword == newPassword) {
      setState(() => _error = 'New password must be different from current password');
      return;
    }
    
    setState(() {
      _isSubmitting = true;
      _error = null;
    });
    
    try {
      final client = SupabaseConfig.client;
      final user = client.auth.currentUser;
      if (user == null) throw Exception('Not authenticated');
      
      // Verify current password by re-authenticating
      final signInResult = await client.auth.signInWithPassword(
        email: user.email!,
        password: currentPassword,
      );
      
      if (signInResult.user == null) {
        throw Exception('Current password is incorrect');
      }
      
      // Update password
      await client.auth.updateUser(
        UserAttributes(password: newPassword),
      );
      
      // Update must_change_password flag to false (only if it was mandatory)
      if (!widget.isVoluntary) {
        await client
            .from('restaurants')
            .update({'must_change_password': false})
            .eq('id', user.id);
      }
      
      debugPrint('✅ Password changed successfully');
      
      setState(() => _success = true);
      
      // Navigate after 2 seconds
      await Future.delayed(const Duration(seconds: 2));
      if (!mounted) return;
      
      if (widget.isVoluntary) {
        // Just go back to previous screen
        Navigator.of(context).pop();
      } else {
        // Navigate to main (first time login)
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const MainNavigation()),
        );
      }
      
    } catch (e) {
      debugPrint('❌ Password change error: $e');
      setState(() {
        _error = e.toString().contains('incorrect') 
            ? 'Current password is incorrect'
            : 'Failed to change password. Please try again.';
      });
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_success) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: AppTheme.primary.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Icon(
                  Icons.check,
                  size: 40,
                  color: AppTheme.primary,
                ),
              ).animate().scale(begin: const Offset(0.5, 0.5)),
              const SizedBox(height: 24),
              Text(
                'Password Changed!',
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 8),
              Text(
                widget.isVoluntary ? 'Going back...' : 'Redirecting to dashboard...',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ],
          ),
        ),
      );
    }
    
    return Scaffold(
      appBar: widget.isVoluntary
          ? AppBar(
              title: const Text('Change Password'),
              leading: IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () => Navigator.pop(context),
              ),
            )
          : null,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (!widget.isVoluntary) const SizedBox(height: 40),
                
                // Header
                Center(
                  child: Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: AppTheme.warning.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Icon(
                      Icons.shield,
                      size: 40,
                      color: AppTheme.warning,
                    ),
                  ),
                ).animate().fadeIn(duration: 500.ms),
                
                const SizedBox(height: 24),
                
                Center(
                  child: Text(
                    'Change Your Password',
                    style: Theme.of(context).textTheme.headlineLarge,
                  ),
                ),
                
                const SizedBox(height: 8),
                
                Center(
                  child: Text(
                    widget.isVoluntary 
                        ? 'Enter your current password and choose a new one.'
                        : 'Welcome, ${widget.restaurantName}!\nPlease set a new password to continue.',
                    style: Theme.of(context).textTheme.bodyMedium,
                    textAlign: TextAlign.center,
                  ),
                ),
                
                const SizedBox(height: 32),
                
                // Error message
                if (_error != null)
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppTheme.error.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.error.withValues(alpha: 0.2)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.error_outline, color: AppTheme.error, size: 20),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            _error!,
                            style: TextStyle(color: AppTheme.error.withValues(alpha: 0.9)),
                          ),
                        ),
                      ],
                    ),
                  ).animate().fadeIn().shake(),
                
                if (_error != null) const SizedBox(height: 24),
                
                // Current Password
                Text(
                  'CURRENT PASSWORD (TEMPORARY)',
                  style: Theme.of(context).textTheme.labelSmall,
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _currentPasswordController,
                  obscureText: _obscureCurrent,
                  decoration: InputDecoration(
                    hintText: 'Enter temporary password',
                    prefixIcon: const Icon(Icons.lock_outline, color: AppTheme.textMuted),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscureCurrent ? Icons.visibility_off : Icons.visibility,
                        color: AppTheme.textMuted,
                      ),
                      onPressed: () => setState(() => _obscureCurrent = !_obscureCurrent),
                    ),
                  ),
                  validator: (value) => value?.isEmpty == true ? 'Required' : null,
                ),
                
                const SizedBox(height: 20),
                
                // New Password
                Text(
                  'NEW PASSWORD',
                  style: Theme.of(context).textTheme.labelSmall,
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _newPasswordController,
                  obscureText: _obscureNew,
                  decoration: InputDecoration(
                    hintText: 'Enter new password (min 8 chars)',
                    prefixIcon: const Icon(Icons.lock_outline, color: AppTheme.textMuted),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscureNew ? Icons.visibility_off : Icons.visibility,
                        color: AppTheme.textMuted,
                      ),
                      onPressed: () => setState(() => _obscureNew = !_obscureNew),
                    ),
                  ),
                  validator: (value) {
                    if (value?.isEmpty == true) return 'Required';
                    if (value!.length < 8) return 'Min 8 characters';
                    return null;
                  },
                ),
                
                const SizedBox(height: 20),
                
                // Confirm Password
                Text(
                  'CONFIRM NEW PASSWORD',
                  style: Theme.of(context).textTheme.labelSmall,
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _confirmPasswordController,
                  obscureText: _obscureConfirm,
                  decoration: InputDecoration(
                    hintText: 'Confirm new password',
                    prefixIcon: const Icon(Icons.lock_outline, color: AppTheme.textMuted),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscureConfirm ? Icons.visibility_off : Icons.visibility,
                        color: AppTheme.textMuted,
                      ),
                      onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
                    ),
                  ),
                  validator: (value) => value?.isEmpty == true ? 'Required' : null,
                ),
                
                const SizedBox(height: 32),
                
                // Submit Button
                SizedBox(
                  height: 56,
                  child: ElevatedButton(
                    onPressed: _isSubmitting ? null : _handleSubmit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.warning,
                    ),
                    child: _isSubmitting
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.black,
                            ),
                          )
                        : const Text('SET NEW PASSWORD'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
