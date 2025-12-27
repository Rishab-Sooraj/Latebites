import 'package:flutter/material.dart';
import '../config/theme.dart';

/// Section wrapper matching web's section component
class SectionWrapper extends StatelessWidget {
  final Widget child;
  final Color? backgroundColor;
  final EdgeInsetsGeometry? padding;
  final bool fullHeight;
  
  const SectionWrapper({
    super.key,
    required this.child,
    this.backgroundColor,
    this.padding,
    this.fullHeight = false,
  });
  
  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      constraints: fullHeight
          ? BoxConstraints(minHeight: MediaQuery.of(context).size.height)
          : null,
      color: backgroundColor,
      padding: padding ??
          const EdgeInsets.symmetric(
            horizontal: AppTheme.spacingLg,
            vertical: AppTheme.spacing3xl,
          ),
      child: child,
    );
  }
}

/// Centered section with max width
class CenteredSection extends StatelessWidget {
  final Widget child;
  final double maxWidth;
  final Color? backgroundColor;
  
  const CenteredSection({
    super.key,
    required this.child,
    this.maxWidth = 1200,
    this.backgroundColor,
  });
  
  @override
  Widget build(BuildContext context) {
    return SectionWrapper(
      backgroundColor: backgroundColor,
      child: Center(
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: maxWidth),
          child: child,
        ),
      ),
    );
  }
}
