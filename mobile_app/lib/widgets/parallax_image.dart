import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../config/theme.dart';

/// Parallax image widget with grayscale-to-color effect
class ParallaxImage extends StatefulWidget {
  final String imageUrl;
  final double aspectRatio;
  final bool startGrayscale;
  
  const ParallaxImage({
    super.key,
    required this.imageUrl,
    this.aspectRatio = 4 / 5,
    this.startGrayscale = true,
  });
  
  @override
  State<ParallaxImage> createState() => _ParallaxImageState();
}

class _ParallaxImageState extends State<ParallaxImage> {
  bool _isHovered = false;
  
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        setState(() {
          _isHovered = !_isHovered;
        });
      },
      child: AspectRatio(
        aspectRatio: widget.aspectRatio,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(2),
          child: AnimatedContainer(
            duration: AppTheme.slowAnimation,
            curve: Curves.easeInOut,
            child: ColorFiltered(
              colorFilter: ColorFilter.mode(
                Colors.transparent,
                widget.startGrayscale && !_isHovered
                    ? BlendMode.saturation
                    : BlendMode.dst,
              ),
              child: CachedNetworkImage(
                imageUrl: widget.imageUrl,
                fit: BoxFit.cover,
                placeholder: (context, url) => Container(
                  color: AppTheme.muted,
                  child: const Center(
                    child: CircularProgressIndicator(
                      color: AppTheme.primary,
                      strokeWidth: 2,
                    ),
                  ),
                ),
                errorWidget: (context, url, error) => Container(
                  color: AppTheme.muted,
                  child: const Icon(
                    Icons.image_not_supported_outlined,
                    color: AppTheme.mutedForeground,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    )
        .animate()
        .fadeIn(duration: AppTheme.slowAnimation)
        .scale(
          begin: const Offset(0.95, 0.95),
          end: const Offset(1, 1),
          duration: AppTheme.slowAnimation,
        );
  }
}

/// Simple image widget without parallax effect
class AppImage extends StatelessWidget {
  final String imageUrl;
  final double? height;
  final double? width;
  final BoxFit fit;
  
  const AppImage({
    super.key,
    required this.imageUrl,
    this.height,
    this.width,
    this.fit = BoxFit.cover,
  });
  
  @override
  Widget build(BuildContext context) {
    return CachedNetworkImage(
      imageUrl: imageUrl,
      height: height,
      width: width,
      fit: fit,
      placeholder: (context, url) => Container(
        height: height,
        width: width,
        color: AppTheme.muted,
        child: const Center(
          child: CircularProgressIndicator(
            color: AppTheme.primary,
            strokeWidth: 2,
          ),
        ),
      ),
      errorWidget: (context, url, error) => Container(
        height: height,
        width: width,
        color: AppTheme.muted,
        child: const Icon(
          Icons.image_not_supported_outlined,
          color: AppTheme.mutedForeground,
        ),
      ),
    );
  }
}
