import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Premium theme matching the web application's design system
/// Colors: Deep earthy green + Orange accent (from design images)
/// Typography: Cormorant Garamond (serif) + Plus Jakarta Sans (sans-serif)
class AppTheme {
  // Color System - Matching web + mobile design images
  static const Color background = Color(0xFFFAF9F7); // Warm off-white
  static const Color foreground = Color(0xFF262626); // Dark gray
  
  // Primary - Deep earthy green
  static const Color primary = Color(0xFF2D4A3E);
  static const Color primaryForeground = Color(0xFFFAF9F7);
  static const Color primaryLight = Color(0xFFE8EDE9);
  
  // Accent - Orange (for CTAs and highlights)
  static const Color orange = Color(0xFFFF6B35);
  static const Color orangeLight = Color(0xFFFFF5F2);
  static const Color orangeDark = Color(0xFFE55A28);
  
  // Secondary - Light green
  static const Color secondary = Color(0xFFE8EDE9);
  static const Color secondaryForeground = Color(0xFF2D4A3E);
  
  // Neutral
  static const Color muted = Color(0xFFF0EFED);
  static const Color mutedForeground = Color(0xFF737373);
  
  // Semantic
  static const Color success = Color(0xFF10B981);
  static const Color error = Color(0xFFEF4444);
  static const Color warning = Color(0xFFF59E0B);
  
  // Borders
  static const Color border = Color(0xFFD9D9D9);
  static const Color borderLight = Color(0xFFE8E8E8);
  
  // Typography
  static TextTheme get textTheme => TextTheme(
    displayLarge: GoogleFonts.getFont(
      'Cormorant Garamond',
      fontSize: 96,
      fontWeight: FontWeight.w300,
      letterSpacing: -1.5,
      color: foreground,
    ),
    displayMedium: GoogleFonts.getFont(
      'Cormorant Garamond',
      fontSize: 60,
      fontWeight: FontWeight.w300,
      letterSpacing: -0.5,
      color: foreground,
    ),
    displaySmall: GoogleFonts.getFont(
      'Cormorant Garamond',
      fontSize: 48,
      fontWeight: FontWeight.w400,
      color: foreground,
    ),
    headlineLarge: GoogleFonts.getFont(
      'Cormorant Garamond',
      fontSize: 40,
      fontWeight: FontWeight.w400,
      letterSpacing: 0.25,
      color: foreground,
    ),
    headlineMedium: GoogleFonts.getFont(
      'Cormorant Garamond',
      fontSize: 34,
      fontWeight: FontWeight.w400,
      letterSpacing: 0.25,
      color: foreground,
    ),
    headlineSmall: GoogleFonts.getFont(
      'Cormorant Garamond',
      fontSize: 24,
      fontWeight: FontWeight.w400,
      color: foreground,
    ),
    titleLarge: GoogleFonts.plusJakartaSans(
      fontSize: 20,
      fontWeight: FontWeight.w500,
      letterSpacing: 0.15,
      color: foreground,
    ),
    titleMedium: GoogleFonts.plusJakartaSans(
      fontSize: 16,
      fontWeight: FontWeight.w400,
      letterSpacing: 0.15,
      color: foreground,
    ),
    titleSmall: GoogleFonts.plusJakartaSans(
      fontSize: 14,
      fontWeight: FontWeight.w500,
      letterSpacing: 0.1,
      color: foreground,
    ),
    bodyLarge: GoogleFonts.plusJakartaSans(
      fontSize: 16,
      fontWeight: FontWeight.w300,
      letterSpacing: 0.5,
      color: foreground,
    ),
    bodyMedium: GoogleFonts.plusJakartaSans(
      fontSize: 14,
      fontWeight: FontWeight.w300,
      letterSpacing: 0.25,
      color: foreground,
    ),
    bodySmall: GoogleFonts.plusJakartaSans(
      fontSize: 12,
      fontWeight: FontWeight.w300,
      letterSpacing: 0.4,
      color: mutedForeground,
    ),
    labelLarge: GoogleFonts.plusJakartaSans(
      fontSize: 14,
      fontWeight: FontWeight.w500,
      letterSpacing: 1.25,
      color: foreground,
    ),
    labelMedium: GoogleFonts.plusJakartaSans(
      fontSize: 12,
      fontWeight: FontWeight.w400,
      letterSpacing: 1.5,
      color: mutedForeground,
    ),
    labelSmall: GoogleFonts.plusJakartaSans(
      fontSize: 10,
      fontWeight: FontWeight.w400,
      letterSpacing: 1.5,
      color: mutedForeground,
    ),
  );

  // Light Theme
  static ThemeData get lightTheme => ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    scaffoldBackgroundColor: background,
    colorScheme: const ColorScheme.light(
      primary: primary,
      onPrimary: primaryForeground,
      secondary: secondary,
      onSecondary: secondaryForeground,
      surface: background,
      onSurface: foreground,
      error: error,
    ),
    textTheme: textTheme,
    appBarTheme: AppBarTheme(
      backgroundColor: Colors.transparent,
      elevation: 0,
      iconTheme: const IconThemeData(color: foreground),
      titleTextStyle: GoogleFonts.getFont(
        'Cormorant Garamond',
        fontSize: 24,
        fontWeight: FontWeight.w400,
        fontStyle: FontStyle.italic,
        color: foreground,
        letterSpacing: -0.5,
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: orange,  // Changed from primary to orange
        foregroundColor: Colors.white,
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),  // Slightly rounded
        ),
        textStyle: GoogleFonts.plusJakartaSans(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          letterSpacing: 1,
        ),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: false,
      fillColor: Colors.transparent,
      border: const UnderlineInputBorder(
        borderSide: BorderSide(color: border, width: 2),
      ),
      enabledBorder: UnderlineInputBorder(
        borderSide: BorderSide(color: border.withOpacity(0.2), width: 2),
      ),
      focusedBorder: const UnderlineInputBorder(
        borderSide: BorderSide(color: primary, width: 2),
      ),
      errorBorder: const UnderlineInputBorder(
        borderSide: BorderSide(color: error, width: 2),
      ),
      labelStyle: GoogleFonts.plusJakartaSans(
        fontSize: 10,
        fontWeight: FontWeight.w400,
        letterSpacing: 3,
        color: mutedForeground,
      ),
      hintStyle: GoogleFonts.plusJakartaSans(
        fontSize: 16,
        fontWeight: FontWeight.w300,
        color: mutedForeground,
      ),
    ),
  );

  // Animation Durations - Intentional and smooth
  static const Duration fastAnimation = Duration(milliseconds: 300);
  static const Duration normalAnimation = Duration(milliseconds: 600);
  static const Duration slowAnimation = Duration(milliseconds: 1000);
  static const Duration cinematicAnimation = Duration(milliseconds: 1500);
  
  // Spacing System
  static const double spacingXs = 4.0;
  static const double spacingSm = 8.0;
  static const double spacingMd = 16.0;
  static const double spacingLg = 24.0;
  static const double spacingXl = 32.0;
  static const double spacing2xl = 48.0;
  static const double spacing3xl = 64.0;
}
