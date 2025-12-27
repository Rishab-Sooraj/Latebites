import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../config/theme.dart';

/// Animated text reveal widget matching the web's cinematic text animations
class RevealText extends StatelessWidget {
  final String text;
  final TextStyle? style;
  final Duration delay;
  final TextAlign textAlign;
  
  const RevealText({
    super.key,
    required this.text,
    this.style,
    this.delay = Duration.zero,
    this.textAlign = TextAlign.start,
  });
  
  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: style,
      textAlign: textAlign,
    )
        .animate()
        .fadeIn(
          duration: AppTheme.cinematicAnimation,
          delay: delay,
          curve: Curves.easeOut,
        )
        .slideY(
          begin: 0.3,
          end: 0,
          duration: AppTheme.cinematicAnimation,
          delay: delay,
          curve: Curves.easeOut,
        );
  }
}

/// Animated heading with reveal effect
class RevealHeading extends StatelessWidget {
  final String text;
  final Duration delay;
  final bool isItalic;
  
  const RevealHeading({
    super.key,
    required this.text,
    this.delay = Duration.zero,
    this.isItalic = false,
  });
  
  @override
  Widget build(BuildContext context) {
    return RevealText(
      text: text,
      delay: delay,
      style: Theme.of(context).textTheme.displaySmall?.copyWith(
        fontStyle: isItalic ? FontStyle.italic : FontStyle.normal,
      ),
    );
  }
}

/// Animated subheading
class RevealSubheading extends StatelessWidget {
  final String text;
  final Duration delay;
  
  const RevealSubheading({
    super.key,
    required this.text,
    this.delay = Duration.zero,
  });
  
  @override
  Widget build(BuildContext context) {
    return RevealText(
      text: text,
      delay: delay,
      style: Theme.of(context).textTheme.headlineMedium,
    );
  }
}

/// Animated body text
class RevealBody extends StatelessWidget {
  final String text;
  final Duration delay;
  final TextAlign textAlign;
  
  const RevealBody({
    super.key,
    required this.text,
    this.delay = Duration.zero,
    this.textAlign = TextAlign.start,
  });
  
  @override
  Widget build(BuildContext context) {
    return RevealText(
      text: text,
      delay: delay,
      textAlign: textAlign,
      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
        color: AppTheme.mutedForeground,
        height: 1.6,
      ),
    );
  }
}
