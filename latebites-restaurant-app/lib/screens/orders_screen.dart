import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
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

  @override
  void initState() {
    super.initState();
    _fetchOrders();
    _subscribeToUpdates();
  }

  @override
  void dispose() {
    _subscription?.unsubscribe();
    super.dispose();
  }

  void _subscribeToUpdates() {
    _subscription = _service.subscribeToOrders(() {
      _fetchOrders();
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
                  Text(
                    'Orders',
                    style: Theme.of(context).textTheme.headlineMedium,
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
