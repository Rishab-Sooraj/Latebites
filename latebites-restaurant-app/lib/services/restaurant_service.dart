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

  /// Verify OTP and complete order
  Future<OtpResult> verifyOtp(String orderId, String otp) async {
    try {
      // Get order and verify OTP
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

      // Update order status to completed
      await _client
          .from('orders')
          .update({
            'status': 'completed',
            'payment_status': 'paid',
            'updated_at': DateTime.now().toIso8601String(),
          })
          .eq('id', orderId);

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
