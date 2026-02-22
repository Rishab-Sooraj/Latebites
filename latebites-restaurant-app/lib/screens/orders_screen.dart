import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:vibration/vibration.dart';
import '../config/theme.dart';
import '../models/order.dart';
import '../services/restaurant_service.dart';
import '../widgets/order_card.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  final RestaurantService _service = RestaurantService();
  
  List<Order> _orders = [];
  bool _isLoading = true;
  String _filter = 'pending';
  String? _error;
  String? _success;
  RealtimeChannel? _subscription;
  Timer? _pollTimer;

  // New-order alert state
  String? _newOrderAlert;

  @override
  void initState() {
    super.initState();
    _fetchOrders();
    _subscribeToUpdates();
    _startPolling();
  }

  @override
  void dispose() {
    _subscription?.unsubscribe();
    _pollTimer?.cancel();
    super.dispose();
  }

  // ─── Realtime subscription ──────────────────────────────────────────────
  void _subscribeToUpdates() {
    _subscription = _service.subscribeToOrders((isInsert) {
      _fetchOrders();
      if (isInsert) _showNewOrderAlert();
    });
  }

  // ─── Fast backup poll (every 5s) ────────────────────────────────────────
  void _startPolling() {
    _pollTimer = Timer.periodic(const Duration(seconds: 5), (_) async {
      final oldCount = _orders.where((o) => o.isPending).length;
      final orders = await _service.getOrders();
      if (!mounted) return;
      final newCount = orders.where((o) => o.isPending).length;

      setState(() => _orders = orders);

      // New pending order detected via poll
      if (newCount > oldCount) {
        _showNewOrderAlert();
      }
    });
  }

  // ─── In-app new order alert ─────────────────────────────────────────────
  void _showNewOrderAlert() async {
    // Vibrate
    if (await Vibration.hasVibrator() ?? false) {
      Vibration.vibrate(pattern: [0, 300, 150, 300, 150, 300]);
    }

    if (!mounted) return;

    setState(() {
      _newOrderAlert = '🔔 New order received!';
      _filter = 'pending'; // auto-switch to pending tab
    });

    // Auto-dismiss after 6 seconds
    Future.delayed(const Duration(seconds: 6), () {
      if (mounted) setState(() => _newOrderAlert = null);
    });
  }

  Future<void> _fetchOrders() async {
    final orders = await _service.getOrders();
    if (!mounted) return;
    
    setState(() {
      _orders = orders;
      _isLoading = false;
    });
  }

  List<Order> get _filteredOrders {
    return _orders.where((order) {
      switch (_filter) {
        case 'pending':
          return order.isPending;
        case 'completed':
          return order.isCompleted;
        default:
          return true;
      }
    }).toList();
  }

  Future<void> _handleVerifyOtp(String orderId, String otp) async {
    setState(() {
      _error = null;
      _success = null;
    });

    final result = await _service.verifyOtp(orderId, otp);
    
    if (!mounted) return;

    if (result.success) {
      setState(() {
        _success = 'Order completed successfully!';
      });
      _fetchOrders();
      
      Future.delayed(const Duration(seconds: 3), () {
        if (mounted) {
          setState(() {
            _success = null;
          });
        }
      });
    } else {
      setState(() {
        _error = result.error ?? 'Verification failed';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final pendingCount = _orders.where((o) => o.isPending).length;

    return RefreshIndicator(
      onRefresh: _fetchOrders,
      color: AppTheme.primary,
      child: CustomScrollView(
        slivers: [
          // Header
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        'Orders',
                        style: Theme.of(context).textTheme.headlineMedium,
                      ),
                      if (pendingCount > 0) ...[
                        const SizedBox(width: 10),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppTheme.warning.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: AppTheme.warning.withOpacity(0.4)),
                          ),
                          child: Text(
                            '$pendingCount pending',
                            style: TextStyle(
                              color: AppTheme.warning,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Manage customer orders and verify pickups',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 20),
                  
                  // Filter Tabs
                  Row(
                    children: [
                      _buildFilterChip('pending', 'Pending'),
                      const SizedBox(width: 8),
                      _buildFilterChip('completed', 'Completed'),
                      const SizedBox(width: 8),
                      _buildFilterChip('all', 'All'),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // ─── New order alert banner ─────────────────────────────────
          if (_newOrderAlert != null)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        AppTheme.primary.withOpacity(0.15),
                        AppTheme.warning.withOpacity(0.10),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppTheme.primary.withOpacity(0.4)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: AppTheme.primary.withOpacity(0.2),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.notifications_active_rounded,
                            color: AppTheme.primary, size: 22),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'New Order Received!',
                              style: TextStyle(
                                color: AppTheme.primary,
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'A customer just placed an order. Check pending orders below.',
                              style: TextStyle(
                                  color: AppTheme.textMuted, fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: Icon(Icons.close, color: AppTheme.textMuted, size: 18),
                        onPressed: () =>
                            setState(() => _newOrderAlert = null),
                      ),
                    ],
                  ),
                ).animate().fadeIn(duration: 300.ms).slideY(begin: -0.3),
              ),
            ),
          
          // Status Messages
          if (_error != null)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppTheme.error.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.error.withOpacity(0.2)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, color: AppTheme.error, size: 20),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _error!,
                          style: TextStyle(color: AppTheme.error.withOpacity(0.9)),
                        ),
                      ),
                    ],
                  ),
                ).animate().fadeIn().shake(),
              ),
            ),
          
          if (_success != null)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.primary.withOpacity(0.2)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.check_circle_outline, color: AppTheme.primary, size: 20),
                      const SizedBox(width: 12),
                      Text(
                        _success!,
                        style: TextStyle(color: AppTheme.primary),
                      ),
                    ],
                  ),
                ).animate().fadeIn(),
              ),
            ),
          
          // Loading
          if (_isLoading)
            const SliverFillRemaining(
              child: Center(
                child: CircularProgressIndicator(color: AppTheme.primary),
              ),
            )
          // Empty State
          else if (_filteredOrders.isEmpty)
            SliverFillRemaining(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.receipt_long,
                      size: 64,
                      color: AppTheme.textMuted.withOpacity(0.5),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'No orders found',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _filter == 'pending'
                          ? 'When customers place orders, they will appear here'
                          : 'No orders match the selected filter',
                      style: Theme.of(context).textTheme.bodyMedium,
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            )
          // Orders List
          else
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final order = _filteredOrders[index];
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: OrderCard(
                        order: order,
                        onVerifyOtp: (otp) => _handleVerifyOtp(order.id, otp),
                        onCancelled: _fetchOrders,
                      ).animate().fadeIn(
                        duration: 400.ms,
                        delay: Duration(milliseconds: index * 50),
                      ).slideY(begin: 0.1),
                    );
                  },
                  childCount: _filteredOrders.length,
                ),
              ),
            ),
          
          const SliverToBoxAdapter(
            child: SizedBox(height: 20),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String value, String label) {
    final isSelected = _filter == value;
    
    return GestureDetector(
      onTap: () => setState(() => _filter = value),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primary : AppTheme.surfaceLight,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.black : AppTheme.textMuted,
            fontWeight: FontWeight.w500,
            fontSize: 14,
          ),
        ),
      ),
    );
  }
}
