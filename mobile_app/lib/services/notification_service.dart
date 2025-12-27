import 'package:flutter/material.dart';

/// Notification service for local notifications
/// Handles booking confirmations, pickup reminders, and updates
class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();
  
  /// Initialize notification service
  Future<void> initialize() async {
    // TODO: Initialize flutter_local_notifications
    // For now, using simple SnackBar notifications
    print('Notification service initialized');
  }
  
  /// Request notification permission
  Future<bool> requestPermission() async {
    // TODO: Implement actual notification permission request
    // For now, returning true
    return true;
  }
  
  /// Show booking confirmation notification
  Future<void> showBookingConfirmation({
    required String restaurantName,
    required String bagSize,
    required String pickupTime,
  }) async {
    // TODO: Show actual notification
    print('Booking confirmed: $restaurantName - $bagSize at $pickupTime');
  }
  
  /// Show pickup reminder notification (30-60 mins before pickup)
  Future<void> schedulePickupReminder({
    required String bookingId,
    required DateTime pickupTime,
    required String otp,
  }) async {
    // Calculate when to show reminder (30 mins before pickup)
    final reminderTime = pickupTime.subtract(const Duration(minutes: 30));
    
    // TODO: Schedule notification
    print('Pickup reminder scheduled for $reminderTime - OTP: $otp');
  }
  
  /// Show OTP notification when it becomes available
  Future<void> showOTPNotification({
    required String otp,
    required String restaurantName,
  }) async {
    // TODO: Show notification with OTP
    print('Your OTP for $restaurantName: $otp');
  }
  
  /// Show cancellation notification
  Future<void> showCancellationNotification({
    required String restaurantName,
    required String reason,
    required bool isRefunded,
  }) async {
    // TODO: Show notification
    print('Booking cancelled: $restaurantName - $reason');
  }
  
  /// Show general notification
  Future<void> showNotification({
    required String title,
    required String body,
  }) async {
    // TODO: Show notification
    print('Notification: $title - $body');
  }
  
  /// Cancel all notifications
  Future<void> cancelAll() async {
    // TODO: Cancel all scheduled notifications
    print('All notifications cancelled');
  }
  
  /// Cancel specific notification
  Future<void> cancel(int id) async {
    // TODO: Cancel notification by ID
    print('Notification $id cancelled');
  }
}

/// Simple in-app notification helper
class InAppNotification {
  /// Show success message
  static void showSuccess(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle, color: Colors.white),
            const SizedBox(width: 12),
            Expanded(child: Text(message)),
          ],
        ),
        backgroundColor: const Color(0xFF10B981),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        duration: const Duration(seconds: 3),
      ),
    );
  }
  
  /// Show error message
  static void showError(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.error_outline, color: Colors.white),
            const SizedBox(width: 12),
            Expanded(child: Text(message)),
          ],
        ),
        backgroundColor: const Color(0xFFEF4444),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        duration: const Duration(seconds: 4),
      ),
    );
  }
  
  /// Show info message
  static void showInfo(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.info_outline, color: Colors.white),
            const SizedBox(width: 12),
            Expanded(child: Text(message)),
          ],
        ),
        backgroundColor: const Color(0xFF3B82F6),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        duration: const Duration(seconds: 3),
      ),
    );
  }
}
