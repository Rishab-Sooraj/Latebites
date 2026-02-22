import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/supabase_config.dart';
import '../models/order.dart';
import 'notification_service.dart';

/// Service for managing restaurant status and orders
class RestaurantService {
  final SupabaseClient _client = SupabaseConfig.client;

  String? get _userId => _client.auth.currentUser?.id;

  /// Get restaurant info including active status
  Future<Map<String, dynamic>?> getRestaurantInfo() async {
    if (_userId == null) return null;
    
    try {
      final data = await _client
          .from('restaurants')
          .select('*')
          .eq('id', _userId!)
          .single();
      
      return data;
    } catch (e) {
      debugPrint('❌ Error fetching restaurant info: $e');
      return null;
    }
  }

  /// Check if restaurant is currently active/online
  Future<bool> isActive() async {
    final info = await getRestaurantInfo();
    return info?['is_active'] == true;
  }

  /// Toggle restaurant active status (go online/offline)
  /// This is what the admin portal monitors
  Future<bool> toggleActive(bool active) async {
    if (_userId == null) return false;
    
    try {
      await _client
          .from('restaurants')
          .update({
            'is_active': active,
            'updated_at': DateTime.now().toIso8601String(),
          })
          .eq('id', _userId!);
      
      debugPrint('✅ Restaurant is_active set to: $active');
      return true;
    } catch (e) {
      debugPrint('❌ Error toggling active status: $e');
      return false;
    }
  }

  /// Get the restaurant's rescue bags for today
  Future<List<Map<String, dynamic>>> getTodayBags() async {
    if (_userId == null) return [];
    
    try {
      final today = DateTime.now().toIso8601String().split('T')[0];
      
      final data = await _client
          .from('rescue_bags')
          .select('*')
          .eq('restaurant_id', _userId!)
          .eq('available_date', today)
          .order('created_at', ascending: false);
      
      return List<Map<String, dynamic>>.from(data);
    } catch (e) {
      debugPrint('❌ Error fetching bags: $e');
      return [];
    }
  }

  /// Get ALL active rescue bags for this restaurant (not just today)
  Future<List<Map<String, dynamic>>> getAllBags() async {
    if (_userId == null) return [];
    
    try {
      final data = await _client
          .from('rescue_bags')
          .select('*')
          .eq('restaurant_id', _userId!)
          .eq('is_active', true)
          .order('available_date', ascending: false)
          .order('created_at', ascending: false);
      
      return List<Map<String, dynamic>>.from(data);
    } catch (e) {
      debugPrint('❌ Error fetching all bags: $e');
      return [];
    }
  }

  /// Calculate customer price with 40% off, rounded to end in 9 or 0
  int _calculateCustomerPrice(int estimatedValue) {
    double basePrice = estimatedValue * 0.6;
    int rounded = basePrice.floor();
    int lastDigit = rounded % 10;
    
    if (lastDigit == 9 || lastDigit == 0) {
      return rounded;
    } else if (lastDigit < 5) {
      return rounded - lastDigit;
    } else {
      return rounded - (lastDigit - 9).abs();
    }
  }

  /// Create a new rescue bag for today with dynamic pricing
  Future<bool> createRescueBag({
    required String size,
    required int estimatedValue,
    required int quantity,
    required String pickupStart,
    required String pickupEnd,
    List<String>? dietaryInfo,
  }) async {
    if (_userId == null) return false;
    
    try {
      final today = DateTime.now().toIso8601String().split('T')[0];
      
      // Calculate prices dynamically
      final customerPrice = _calculateCustomerPrice(estimatedValue);
      final restaurantPayout = (customerPrice * 0.92).floor();
      
      // Get restaurant name for title
      final info = await getRestaurantInfo();
      final restaurantName = info?['name'] ?? 'Restaurant';
      
      final sizeLabel = size[0].toUpperCase() + size.substring(1);
      final title = '$restaurantName $sizeLabel Bag';
      
      await _client.from('rescue_bags').insert({
        'restaurant_id': _userId,
        'title': title,
        'description': 'Guaranteed value of at least ₹$estimatedValue',
        'size': size,
        'original_price': estimatedValue,
        'discounted_price': customerPrice,
        'quantity_available': quantity,
        'pickup_start_time': pickupStart,
        'pickup_end_time': pickupEnd,
        'available_date': today,
        'is_active': true,
        'dietary_info': dietaryInfo ?? [],
      });
      
      debugPrint('✅ Rescue bag created: $title @ ₹$customerPrice (payout: ₹$restaurantPayout)');
      return true;
    } catch (e) {
      debugPrint('❌ Error creating bag: $e');
      return false;
    }
  }

  /// Update quantity for a rescue bag
  Future<void> updateBagQuantity(String bagId, int quantity) async {
    try {
      await _client
          .from('rescue_bags')
          .update({'quantity_available': quantity})
          .eq('id', bagId);
      
      debugPrint('✅ Bag quantity updated');
    } catch (e) {
      debugPrint('❌ Error updating quantity: $e');
    }
  }

  /// Delete a rescue bag
  Future<bool> deleteBag(String bagId) async {
    try {
      await _client
          .from('rescue_bags')
          .delete()
          .eq('id', bagId);
      
      debugPrint('✅ Bag deleted');
      return true;
    } catch (e) {
      debugPrint('❌ Error deleting bag: $e');
      return false;
    }
  }

  /// Get restaurant's orders
  Future<List<Order>> getOrders() async {
    if (_userId == null) return [];
    
    try {
      debugPrint('🔍 Fetching orders for restaurant ID: $_userId');
      
      final data = await _client
          .from('orders')
          .select('''
            *,
            rescue_bags (
              id,
              title,
              pickup_start_time,
              pickup_end_time,
              restaurant_id
            ),
            customers (name, phone)
          ''')
          .eq('restaurant_id', _userId!)
          .order('created_at', ascending: false);

      debugPrint('📦 Fetched ${data.length} orders for restaurant $_userId');
      
      return (data as List)
          .map((json) => Order.fromJson(json))
          .toList();
    } catch (e) {
      debugPrint('❌ Error fetching orders: $e');
      return [];
    }
  }

  /// Subscribe to order updates for data refresh
  RealtimeChannel subscribeToOrders(VoidCallback onUpdate) {
    return _client
        .channel('orders-changes-${DateTime.now().millisecondsSinceEpoch}')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'orders',
          callback: (payload) {
            debugPrint('📦 Order update received');
            onUpdate();
          },
        )
        .subscribe();
  }

  /// Monitor orders for notifications (call this once at app level)
  RealtimeChannel monitorOrdersForNotifications() {
    // Initialize notifications
    NotificationService().init();

    return _client
        .channel('orders-notifications')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'orders',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'restaurant_id',
            value: _userId ?? '',
          ),
          callback: (payload) {
            debugPrint('🔔 New order notification trigger!');
            NotificationService().showNewOrderNotification(
              title: 'New Order Received! 🛍️',
              body: 'Customer placed a new order. Tap to view details.',
            );
          },
        )
        .subscribe();
  }

  /// Cancel an order placed at this restaurant.
  ///
  /// Lock-in rules (match Next.js cancel API):
  ///   - Before lock-in (> 45 min before pickup):  free cancel, quantity restored
  ///   - After lock-in  (≤ 45 min before pickup):  cancel + automatic penalty strike
  ///
  /// Returns a [CancelResult] describing what happened.
  Future<CancelResult> cancelOrder({
    required String orderId,
    String? reason,
  }) async {
    if (_userId == null) {
      return CancelResult(success: false, error: 'Not authenticated');
    }

    try {
      // 1. Fetch order + rescue bag in one query
      final raw = await _client
          .from('orders')
          .select('*, rescue_bags(id, pickup_start_time, pickup_end_time, quantity_available, restaurant_id)')
          .eq('id', orderId)
          .single();

      // 2. Verify ownership
      if (raw['restaurant_id'] != _userId) {
        return CancelResult(success: false, error: 'This order does not belong to your restaurant');
      }

      // 3. Guard against already-done orders
      final status = raw['status'] as String? ?? '';
      if (status == 'cancelled') {
        return CancelResult(success: false, error: 'Order is already cancelled');
      }
      if (status == 'completed' || status == 'picked_up') {
        return CancelResult(success: false, error: 'Cannot cancel a completed order');
      }

      // 4. Determine lock-in
      final bag = raw['rescue_bags'] as Map<String, dynamic>?;
      bool isAfterLockIn = false;

      if (bag?['pickup_start_time'] != null) {
        final parts = (bag!['pickup_start_time'] as String).split(':');
        final now = DateTime.now();
        var pickupStart = DateTime(
          now.year, now.month, now.day,
          int.parse(parts[0]),
          int.parse(parts[1]),
          parts.length > 2 ? int.parse(parts[2]) : 0,
        );

        // If pickup time has already passed today, treat as tomorrow
        if (pickupStart.isBefore(now)) {
          pickupStart = pickupStart.add(const Duration(days: 1));
        }

        final lockInTime = pickupStart.subtract(const Duration(minutes: 45));
        isAfterLockIn = now.isAfter(lockInTime);
      }

      // 5. Build cancellation reason
      final cancelReason = reason?.trim().isNotEmpty == true
          ? reason!.trim()
          : isAfterLockIn
              ? 'Cancelled by restaurant after lock-in period'
              : 'Cancelled by restaurant';

      // 6. Cancel the order
      await _client.from('orders').update({
        'status': 'cancelled',
        'cancellation_reason': cancelReason,
        'cancelled_by': 'restaurant:$_userId',
        'updated_at': DateTime.now().toIso8601String(),
      }).eq('id', orderId);

      // 7. Restore bag quantity
      if (bag != null) {
        final currentQty = (bag['quantity_available'] as int?) ?? 0;
        final orderQty = (raw['quantity'] as int?) ?? 1;
        await _client
            .from('rescue_bags')
            .update({'quantity_available': currentQty + orderQty})
            .eq('id', bag['id']);
      }

      // 8. Issue penalty strike if after lock-in
      int newStrikeCount = 0;
      bool strikeIssued = false;
      bool deactivated = false;

      if (isAfterLockIn) {
        final restaurantRaw = await _client
            .from('restaurants')
            .select('strike_count, name')
            .eq('id', _userId!)
            .single();

        final currentStrikes = (restaurantRaw['strike_count'] as int?) ?? 0;
        newStrikeCount = currentStrikes + 1;
        deactivated = newStrikeCount >= 3;

        // Insert strike record
        await _client.from('restaurant_strikes').insert({
          'restaurant_id': _userId,
          'strike_number': newStrikeCount,
          'reason':
              'Post lock-in cancellation — Order #${orderId.length >= 8 ? orderId.substring(0, 8).toUpperCase() : orderId.toUpperCase()}. $cancelReason',
          'issued_by_name': restaurantRaw['name'] ?? 'System',
          'issued_by_role': 'system_auto',
        });

        // Update restaurant strike count (deactivate if 3 strikes)
        final update = <String, dynamic>{'strike_count': newStrikeCount};
        if (deactivated) update['is_active'] = false;
        await _client.from('restaurants').update(update).eq('id', _userId!);

        strikeIssued = true;
        debugPrint('⚠️ Strike issued for late cancellation. Strike $newStrikeCount/3');
      }

      debugPrint('✅ Order $orderId cancelled (afterLockIn: $isAfterLockIn)');
      debugPrint('✅ Order $orderId cancelled (afterLockIn: $isAfterLockIn)');
      return CancelResult(
        success: true,
        isAfterLockIn: isAfterLockIn,
        strikeIssued: strikeIssued,
        newStrikeCount: newStrikeCount,
        restaurantDeactivated: deactivated,
      );
    } catch (e) {
      debugPrint('❌ Error cancelling order: $e');
      return CancelResult(success: false, error: 'Cancellation failed: $e');
    }
  }

  /// Verify OTP and complete order
  Future<OtpResult> verifyOtp(String orderId, String otp) async {
    try {
      final order = await _client
          .from('orders')
          .select('pickup_otp, status')
          .eq('id', orderId)
          .single();

      if (order['pickup_otp'] != otp) {
        return OtpResult(success: false, error: 'Invalid OTP');
      }
      if (order['status'] == 'completed') {
        return OtpResult(success: false, error: 'Order already completed');
      }

      await _client.from('orders').update({
        'status': 'completed',
        'payment_status': 'paid',
        'updated_at': DateTime.now().toIso8601String(),
      }).eq('id', orderId);

      debugPrint('✅ Order completed');
      return OtpResult(success: true);
    } catch (e) {
      debugPrint('❌ Error verifying OTP: $e');
      return OtpResult(success: false, error: 'Verification failed');
    }
  }
}

class OtpResult {
  final bool success;
  final String? error;

  OtpResult({required this.success, this.error});
}

class CancelResult {
  final bool success;
  final String? error;
  final bool isAfterLockIn;
  final bool strikeIssued;
  final int newStrikeCount;
  final bool restaurantDeactivated;

  CancelResult({
    required this.success,
    this.error,
    this.isAfterLockIn = false,
    this.strikeIssued = false,
    this.newStrikeCount = 0,
    this.restaurantDeactivated = false,
  });
}

