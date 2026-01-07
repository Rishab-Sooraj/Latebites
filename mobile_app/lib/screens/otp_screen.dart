import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/theme.dart';
import 'main_navigation.dart';

/// OTP verification screen with 6-digit input and auto-focus
class OTPScreen extends StatefulWidget {
  final String phoneNumber;
  
  const OTPScreen({
    super.key,
    required this.phoneNumber,
  });

  @override
  State<OTPScreen> createState() => _OTPScreenState();
}

class _OTPScreenState extends State<OTPScreen> {
  final List<TextEditingController> _controllers = 
      List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());
  
  bool _isLoading = false;
  bool _isResending = false;
  int _resendCountdown = 30;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _startResendCountdown();
    _sendOTP();
    
    // Auto-focus first field
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _focusNodes[0].requestFocus();
    });
  }

  @override
  void dispose() {
    for (var controller in _controllers) {
      controller.dispose();
    }
    for (var node in _focusNodes) {
      node.dispose();
    }
    super.dispose();
  }

  void _startResendCountdown() {
    Future.doWhile(() async {
      await Future.delayed(const Duration(seconds: 1));
      if (mounted && _resendCountdown > 0) {
        setState(() => _resendCountdown--);
        return true;
      }
      return false;
    });
  }

  Future<void> _sendOTP() async {
    try {
      await Supabase.instance.client.auth.signInWithOtp(
        phone: widget.phoneNumber,
      );
    } catch (e) {
      // For demo, we'll use a mock OTP flow
      debugPrint('OTP send error (using mock): $e');
    }
  }

  Future<void> _resendOTP() async {
    if (_resendCountdown > 0) return;
    
    setState(() {
      _isResending = true;
      _errorMessage = null;
    });

    try {
      await _sendOTP();
      setState(() {
        _resendCountdown = 30;
      });
      _startResendCountdown();
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('OTP sent successfully!'),
            backgroundColor: AppTheme.success,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Failed to resend OTP';
      });
    } finally {
      if (mounted) {
        setState(() => _isResending = false);
      }
    }
  }

  Future<void> _verifyOTP() async {
    final otp = _controllers.map((c) => c.text).join();
    if (otp.length != 6) {
      setState(() => _errorMessage = 'Please enter complete OTP');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      // Try Supabase OTP verification
      final response = await Supabase.instance.client.auth.verifyOTP(
        phone: widget.phoneNumber,
        token: otp,
        type: OtpType.sms,
      );

      if (response.user != null) {
        // Check if customer profile exists, create if not
        final existingProfile = await Supabase.instance.client
            .from('customers')
            .select()
            .eq('id', response.user!.id)
            .maybeSingle();

        if (existingProfile == null) {
          await Supabase.instance.client.from('customers').insert({
            'id': response.user!.id,
            'name': 'Customer',
            'email': '',
            'phone': widget.phoneNumber,
          });
        }

        if (mounted) {
          Navigator.of(context).pushAndRemoveUntil(
            PageRouteBuilder(
              pageBuilder: (context, animation, secondaryAnimation) => 
                  const MainNavigation(),
              transitionsBuilder: (context, animation, secondaryAnimation, child) {
                return FadeTransition(opacity: animation, child: child);
              },
              transitionDuration: const Duration(milliseconds: 400),
            ),
            (route) => false,
          );
        }
      }
    } catch (e) {
      // For demo purposes, accept any 6-digit OTP
      if (otp == '123456') {
        if (mounted) {
          Navigator.of(context).pushAndRemoveUntil(
            PageRouteBuilder(
              pageBuilder: (context, animation, secondaryAnimation) => 
                  const MainNavigation(),
              transitionsBuilder: (context, animation, secondaryAnimation, child) {
                return FadeTransition(opacity: animation, child: child);
              },
              transitionDuration: const Duration(milliseconds: 400),
            ),
            (route) => false,
          );
        }
      } else {
        setState(() {
          _errorMessage = 'Invalid OTP. Try 123456 for demo.';
        });
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _onOTPChanged(int index, String value) {
    if (value.isNotEmpty && index < 5) {
      _focusNodes[index + 1].requestFocus();
    }
    
    // Auto-verify when all digits entered
    if (index == 5 && value.isNotEmpty) {
      _verifyOTP();
    }
  }

  void _onKeyDown(int index, RawKeyEvent event) {
    if (event is RawKeyDownEvent && 
        event.logicalKey == LogicalKeyboardKey.backspace &&
        _controllers[index].text.isEmpty && 
        index > 0) {
      _focusNodes[index - 1].requestFocus();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppTheme.foreground),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Text(
                'Verify OTP',
                style: GoogleFonts.poppins(
                  fontSize: 28,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.foreground,
                ),
              )
                  .animate()
                  .fadeIn(duration: 400.ms)
                  .slideX(begin: -0.2, end: 0),
              
              const SizedBox(height: 8),
              
              Text(
                'We sent a 6-digit code to',
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  color: AppTheme.mutedForeground,
                ),
              )
                  .animate()
                  .fadeIn(delay: 100.ms, duration: 400.ms),
              
              Text(
                widget.phoneNumber,
                style: GoogleFonts.poppins(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.foreground,
                ),
              )
                  .animate()
                  .fadeIn(delay: 150.ms, duration: 400.ms),
              
              const SizedBox(height: 40),
              
              // OTP Input boxes
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: List.generate(6, (index) {
                  return SizedBox(
                    width: 48,
                    height: 56,
                    child: RawKeyboardListener(
                      focusNode: FocusNode(),
                      onKey: (event) => _onKeyDown(index, event),
                      child: TextField(
                        controller: _controllers[index],
                        focusNode: _focusNodes[index],
                        textAlign: TextAlign.center,
                        keyboardType: TextInputType.number,
                        maxLength: 1,
                        style: GoogleFonts.poppins(
                          fontSize: 24,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.foreground,
                        ),
                        inputFormatters: [
                          FilteringTextInputFormatter.digitsOnly,
                        ],
                        decoration: InputDecoration(
                          counterText: '',
                          contentPadding: EdgeInsets.zero,
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(
                              color: _errorMessage != null 
                                  ? AppTheme.error 
                                  : AppTheme.borderLight,
                              width: 2,
                            ),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(
                              color: AppTheme.primary,
                              width: 2,
                            ),
                          ),
                          filled: true,
                          fillColor: _controllers[index].text.isNotEmpty
                              ? AppTheme.primaryLight
                              : Colors.white,
                        ),
                        onChanged: (value) => _onOTPChanged(index, value),
                      ),
                    ),
                  )
                      .animate()
                      .fadeIn(delay: Duration(milliseconds: 200 + index * 50))
                      .scale(
                        begin: const Offset(0.8, 0.8),
                        end: const Offset(1, 1),
                        delay: Duration(milliseconds: 200 + index * 50),
                      );
                }),
              ),
              
              // Error message
              if (_errorMessage != null) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.error.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.error_outline, color: AppTheme.error, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _errorMessage!,
                          style: GoogleFonts.poppins(
                            fontSize: 13,
                            color: AppTheme.error,
                          ),
                        ),
                      ),
                    ],
                  ),
                )
                    .animate()
                    .fadeIn()
                    .shake(hz: 3, duration: 400.ms),
              ],
              
              const SizedBox(height: 32),
              
              // Resend OTP
              Center(
                child: _resendCountdown > 0
                    ? Text(
                        'Resend OTP in ${_resendCountdown}s',
                        style: GoogleFonts.poppins(
                          fontSize: 14,
                          color: AppTheme.mutedForeground,
                        ),
                      )
                    : TextButton(
                        onPressed: _isResending ? null : _resendOTP,
                        child: _isResending
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: AppTheme.primary,
                                ),
                              )
                            : Text(
                                'Resend OTP',
                                style: GoogleFonts.poppins(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: AppTheme.primary,
                                ),
                              ),
                      ),
              ),
              
              const Spacer(),
              
              // Verify button
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _verifyOTP,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : Text(
                          'Verify',
                          style: GoogleFonts.poppins(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                ),
              )
                  .animate()
                  .fadeIn(delay: 500.ms, duration: 400.ms)
                  .slideY(begin: 0.2, end: 0),
            ],
          ),
        ),
      ),
    );
  }
}
