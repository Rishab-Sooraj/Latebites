import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../config/theme.dart';
import '../widgets/custom_button.dart';
import '../services/supabase_service.dart';

/// Restaurant onboarding screen with form validation
class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});
  
  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _formKey = GlobalKey<FormState>();
  final _restaurantNameController = TextEditingController();
  final _contactPersonController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _cityController = TextEditingController(text: 'Coimbatore');
  
  bool _isSubmitting = false;
  String? _successMessage;
  String? _errorMessage;
  
  final Map<String, bool> _touchedFields = {};
  final Map<String, String?> _fieldErrors = {};
  
  @override
  void dispose() {
    _restaurantNameController.dispose();
    _contactPersonController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _cityController.dispose();
    super.dispose();
  }
  
  String? _validateField(String fieldName, String value) {
    switch (fieldName) {
      case 'restaurant_name':
        return value.trim().length < 2
            ? 'Restaurant name must be at least 2 characters'
            : null;
      case 'contact_person':
        return value.trim().length < 2
            ? 'Contact person name must be at least 2 characters'
            : null;
      case 'email':
        final emailRegex = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');
        return !emailRegex.hasMatch(value)
            ? 'Please enter a valid email address'
            : null;
      case 'phone_number':
        final phoneRegex = RegExp(r'^[+]?[0-9\s-]{10,}$');
        return !phoneRegex.hasMatch(value)
            ? 'Please enter a valid phone number'
            : null;
      case 'city':
        return value.trim().length < 2
            ? 'City name must be at least 2 characters'
            : null;
      default:
        return null;
    }
  }
  
  void _handleFieldChange(String fieldName, String value) {
    setState(() {
      _fieldErrors[fieldName] = null;
    });
  }
  
  void _handleFieldBlur(String fieldName, String value) {
    setState(() {
      _touchedFields[fieldName] = true;
      _fieldErrors[fieldName] = _validateField(fieldName, value);
    });
  }
  
  Color _getBorderColor(String fieldName) {
    if (!(_touchedFields[fieldName] ?? false)) {
      return AppTheme.border.withOpacity(0.2);
    }
    if (_fieldErrors[fieldName] != null) {
      return AppTheme.destructive;
    }
    return Colors.green;
  }
  
  Future<void> _handleSubmit() async {
    // Mark all fields as touched
    setState(() {
      _touchedFields['restaurant_name'] = true;
      _touchedFields['contact_person'] = true;
      _touchedFields['email'] = true;
      _touchedFields['phone_number'] = true;
      _touchedFields['city'] = true;
    });
    
    // Validate all fields
    final restaurantNameError = _validateField('restaurant_name', _restaurantNameController.text);
    final contactPersonError = _validateField('contact_person', _contactPersonController.text);
    final emailError = _validateField('email', _emailController.text);
    final phoneError = _validateField('phone_number', _phoneController.text);
    final cityError = _validateField('city', _cityController.text);
    
    setState(() {
      _fieldErrors['restaurant_name'] = restaurantNameError;
      _fieldErrors['contact_person'] = contactPersonError;
      _fieldErrors['email'] = emailError;
      _fieldErrors['phone_number'] = phoneError;
      _fieldErrors['city'] = cityError;
    });
    
    // Check if there are any errors
    if (restaurantNameError != null ||
        contactPersonError != null ||
        emailError != null ||
        phoneError != null ||
        cityError != null) {
      setState(() {
        _errorMessage = 'Please fix the errors above before submitting.';
        _successMessage = null;
      });
      return;
    }
    
    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
      _successMessage = null;
    });
    
    try {
      final result = await SupabaseService.submitOnboarding(
        restaurantName: _restaurantNameController.text,
        contactPerson: _contactPersonController.text,
        email: _emailController.text,
        phoneNumber: _phoneController.text,
        city: _cityController.text,
      );
      
      if (result['success']) {
        setState(() {
          _successMessage = result['message'];
          _errorMessage = null;
          
          // Clear form
          _restaurantNameController.clear();
          _contactPersonController.clear();
          _emailController.clear();
          _phoneController.clear();
          _cityController.text = 'Coimbatore';
          
          _touchedFields.clear();
          _fieldErrors.clear();
        });
      } else {
        setState(() {
          _errorMessage = result['message'];
          _successMessage = null;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Failed to submit. Please try again.';
        _successMessage = null;
      });
    } finally {
      setState(() {
        _isSubmitting = false;
      });
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text(
          'Restaurant Onboarding',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontStyle: FontStyle.italic,
              ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppTheme.spacingLg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Join the Latebites movement.',
              style: Theme.of(context).textTheme.displaySmall,
            )
                .animate()
                .fadeIn(duration: AppTheme.slowAnimation)
                .slideY(begin: 0.2, end: 0),
            const SizedBox(height: AppTheme.spacingLg),
            Text(
              'We\'re looking for partner restaurants who value their craft and care about their surplus. Rescue your effort with us in Coimbatore.',
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
            const SizedBox(height: AppTheme.spacing2xl),
            
            // Form
            Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildTextField(
                    controller: _restaurantNameController,
                    label: 'RESTAURANT NAME',
                    placeholder: 'The Kitchen Collective',
                    fieldName: 'restaurant_name',
                  ),
                  const SizedBox(height: AppTheme.spacingLg),
                  _buildTextField(
                    controller: _contactPersonController,
                    label: 'CONTACT PERSON',
                    placeholder: 'Your Name',
                    fieldName: 'contact_person',
                  ),
                  const SizedBox(height: AppTheme.spacingLg),
                  _buildTextField(
                    controller: _emailController,
                    label: 'EMAIL ADDRESS',
                    placeholder: 'your@email.com',
                    fieldName: 'email',
                    keyboardType: TextInputType.emailAddress,
                  ),
                  const SizedBox(height: AppTheme.spacingLg),
                  _buildTextField(
                    controller: _phoneController,
                    label: 'PHONE NUMBER',
                    placeholder: '+91 ....',
                    fieldName: 'phone_number',
                    keyboardType: TextInputType.phone,
                  ),
                  const SizedBox(height: AppTheme.spacingLg),
                  _buildTextField(
                    controller: _cityController,
                    label: 'CITY',
                    placeholder: 'Coimbatore',
                    fieldName: 'city',
                    readOnly: true,
                  ),
                  const SizedBox(height: AppTheme.spacingXl),
                  
                  // Success/Error Messages
                  if (_successMessage != null)
                    Container(
                      padding: const EdgeInsets.all(AppTheme.spacingMd),
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withOpacity(0.1),
                        border: Border.all(color: AppTheme.primary.withOpacity(0.2)),
                      ),
                      child: Text(
                        _successMessage!,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: AppTheme.primary,
                            ),
                      ),
                    )
                        .animate()
                        .fadeIn()
                        .slideY(begin: -0.1, end: 0),
                  
                  if (_errorMessage != null)
                    Container(
                      padding: const EdgeInsets.all(AppTheme.spacingMd),
                      decoration: BoxDecoration(
                        color: AppTheme.destructive.withOpacity(0.1),
                        border: Border.all(color: AppTheme.destructive.withOpacity(0.2)),
                      ),
                      child: Text(
                        _errorMessage!,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: AppTheme.destructive,
                            ),
                      ),
                    )
                        .animate()
                        .fadeIn()
                        .slideY(begin: -0.1, end: 0),
                  
                  if (_successMessage != null || _errorMessage != null)
                    const SizedBox(height: AppTheme.spacingLg),
                  
                  // Submit Button
                  PremiumButton(
                    text: 'Apply to Rescue',
                    onPressed: _isSubmitting ? null : _handleSubmit,
                    isLoading: _isSubmitting,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String placeholder,
    required String fieldName,
    TextInputType? keyboardType,
    bool readOnly = false,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                letterSpacing: 3,
              ),
        ),
        const SizedBox(height: AppTheme.spacingSm),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          readOnly: readOnly,
          onChanged: (value) => _handleFieldChange(fieldName, value),
          onTap: () {
            if (!readOnly) {
              setState(() {
                _touchedFields[fieldName] = true;
              });
            }
          },
          onEditingComplete: () {
            _handleFieldBlur(fieldName, controller.text);
          },
          style: Theme.of(context).textTheme.bodyLarge,
          decoration: InputDecoration(
            hintText: placeholder,
            hintStyle: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: AppTheme.mutedForeground.withOpacity(0.5),
                ),
            enabledBorder: UnderlineInputBorder(
              borderSide: BorderSide(
                color: _getBorderColor(fieldName),
                width: 2,
              ),
            ),
            focusedBorder: UnderlineInputBorder(
              borderSide: BorderSide(
                color: _fieldErrors[fieldName] != null
                    ? AppTheme.destructive
                    : AppTheme.primary,
                width: 2,
              ),
            ),
            errorBorder: const UnderlineInputBorder(
              borderSide: BorderSide(
                color: AppTheme.destructive,
                width: 2,
              ),
            ),
          ),
        ),
        if (_touchedFields[fieldName] == true && _fieldErrors[fieldName] != null)
          Padding(
            padding: const EdgeInsets.only(top: AppTheme.spacingSm),
            child: Text(
              _fieldErrors[fieldName]!,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppTheme.destructive,
                  ),
            ),
          ),
      ],
    );
  }
}
