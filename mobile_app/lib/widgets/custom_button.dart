import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../config/theme.dart';

/// Premium button with micro-animations matching web design
class PremiumButton extends StatefulWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;
  final bool isFullWidth;
  
  const PremiumButton({
    super.key,
    required this.text,
    this.onPressed,
    this.isLoading = false,
    this.isFullWidth = true,
  });
  
  @override
  State<PremiumButton> createState() => _PremiumButtonState();
}

class _PremiumButtonState extends State<PremiumButton> {
  bool _isPressed = false;
  
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _isPressed = true),
      onTapUp: (_) => setState(() => _isPressed = false),
      onTapCancel: () => setState(() => _isPressed = false),
      child: AnimatedOpacity(
        opacity: widget.isLoading || widget.onPressed == null ? 0.5 : (_isPressed ? 0.9 : 1.0),
        duration: AppTheme.fastAnimation,
        child: Container(
          width: widget.isFullWidth ? double.infinity : null,
          padding: const EdgeInsets.symmetric(
            horizontal: AppTheme.spacingXl,
            vertical: AppTheme.spacingMd,
          ),
          decoration: const BoxDecoration(
            color: AppTheme.primary,
            borderRadius: BorderRadius.zero,
          ),
          child: widget.isLoading
              ? const SizedBox(
                  height: 20,
                  width: 20,
                  child: CircularProgressIndicator(
                    color: AppTheme.primaryForeground,
                    strokeWidth: 2,
                  ),
                )
              : Text(
                  widget.text.toUpperCase(),
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                        color: AppTheme.primaryForeground,
                        letterSpacing: 3,
                      ),
                ),
        ),
      ),
    ).animate(target: _isPressed ? 1 : 0).scaleXY(
          begin: 1,
          end: 0.98,
          duration: AppTheme.fastAnimation,
        );
  }
}

/// Outlined button variant
class OutlinedPremiumButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  
  const OutlinedPremiumButton({
    super.key,
    required this.text,
    this.onPressed,
  });
  
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AppTheme.spacingXl,
          vertical: AppTheme.spacingMd,
        ),
        decoration: BoxDecoration(
          color: Colors.transparent,
          border: Border.all(color: AppTheme.primary, width: 2),
          borderRadius: BorderRadius.zero,
        ),
        child: Text(
          text.toUpperCase(),
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.labelLarge?.copyWith(
                color: AppTheme.primary,
                letterSpacing: 3,
              ),
        ),
      ),
    );
  }
}
