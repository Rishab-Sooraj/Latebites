import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:google_fonts/google_fonts.dart';
import '../config/theme.dart';

/// Orders screen - Shows active and past orders
class OrdersScreen extends ConsumerStatefulWidget {
  const OrdersScreen({super.key});

  @override
  ConsumerState<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends ConsumerState<OrdersScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<Map<String, dynamic>> _activeOrders = [];
  List<Map<String, dynamic>> _pastOrders = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadOrders();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadOrders() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) {
        setState(() {
          _isLoading = false;
        });
        return;
      }

      final response = await Supabase.instance.client
          .from('bookings')
          .select('''
            *,
            rescue_bags!inner (
              id,
              title,
              size,
              discounted_price,
              original_price,
              pickup_start_time,
              pickup_end_time,
              available_date
            ),
            restaurants!inner (
              id,
              name,
              address_line1,
              city,
              phone
            )
          ''')
          .eq('user_id', user.id)
          .order('created_at', ascending: false);

      final orders = List<Map<String, dynamic>>.from(response);
      
      setState(() {
        _activeOrders = orders
            .where((o) => o['status'] == 'confirmed' || o['status'] == 'pending')
            .toList();
        _pastOrders = orders
            .where((o) => o['status'] == 'completed' || 
                         o['status'] == 'cancelled' ||
                         o['status'] == 'picked_up')
            .toList();
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        backgroundColor: AppTheme.background,
        elevation: 0,
        title: Text(
          'My Orders',
          style: GoogleFonts.poppins(
            fontSize: 24,
            fontWeight: FontWeight.w700,
            color: AppTheme.foreground,
          ),
        ),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppTheme.primary,
          unselectedLabelColor: AppTheme.mutedForeground,
          indicatorColor: AppTheme.primary,
          indicatorWeight: 3,
          labelStyle: GoogleFonts.poppins(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
          unselectedLabelStyle: GoogleFonts.poppins(
            fontSize: 14,
            fontWeight: FontWeight.w400,
          ),
          tabs: [
            Tab(text: 'Active (${_activeOrders.length})'),
            Tab(text: 'Past (${_pastOrders.length})'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppTheme.primary),
            )
          : _error != null
              ? _buildErrorState()
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _buildOrdersList(_activeOrders, isActive: true),
                    _buildOrdersList(_pastOrders, isActive: false),
                  ],
                ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 64, color: AppTheme.error),
          const SizedBox(height: 16),
          Text(
            'Failed to load orders',
            style: GoogleFonts.poppins(
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          TextButton(
            onPressed: _loadOrders,
            child: Text(
              'Retry',
              style: GoogleFonts.poppins(
                color: AppTheme.primary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOrdersList(List<Map<String, dynamic>> orders, {required bool isActive}) {
    if (orders.isEmpty) {
      return _buildEmptyState(isActive);
    }

    return RefreshIndicator(
      onRefresh: _loadOrders,
      color: AppTheme.primary,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: orders.length,
        itemBuilder: (context, index) {
          return _buildOrderCard(orders[index], index, isActive: isActive);
        },
      ),
    );
  }

  Widget _buildEmptyState(bool isActive) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            isActive ? Icons.shopping_bag_outlined : Icons.history,
            size: 80,
            color: AppTheme.mutedForeground.withOpacity(0.3),
          ),
          const SizedBox(height: 16),
          Text(
            isActive ? 'No active orders' : 'No past orders',
            style: GoogleFonts.poppins(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: AppTheme.mutedForeground,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            isActive
                ? 'Your rescue bags will appear here'
                : 'Completed orders will show here',
            style: GoogleFonts.poppins(
              fontSize: 14,
              color: AppTheme.mutedForeground.withOpacity(0.7),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOrderCard(Map<String, dynamic> order, int index, {required bool isActive}) {
    final bag = order['rescue_bags'];
    final restaurant = order['restaurants'];
    final status = order['status'] as String;
    final otp = order['otp'] as String?;
    final createdAt = DateTime.parse(order['created_at']);
    
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with restaurant and status
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Restaurant icon
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: AppTheme.primaryLight,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    Icons.restaurant,
                    color: AppTheme.primary,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                
                // Restaurant info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        restaurant['name'] ?? 'Restaurant',
                        style: GoogleFonts.poppins(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        bag['title'] ?? 'Rescue Bag',
                        style: GoogleFonts.poppins(
                          fontSize: 13,
                          color: AppTheme.mutedForeground,
                        ),
                      ),
                    ],
                  ),
                ),
                
                // Status badge
                _buildStatusBadge(status),
              ],
            ),
          ),
          
          // OTP Section for active orders
          if (isActive && otp != null) ...[
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.success.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.success.withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  Icon(Icons.qr_code_2, color: AppTheme.success, size: 32),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Pickup OTP',
                        style: GoogleFonts.poppins(
                          fontSize: 12,
                          color: AppTheme.success,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      Text(
                        otp,
                        style: GoogleFonts.poppins(
                          fontSize: 24,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.success,
                          letterSpacing: 4,
                        ),
                      ),
                    ],
                  ),
                  const Spacer(),
                  Text(
                    'Show at pickup',
                    style: GoogleFonts.poppins(
                      fontSize: 11,
                      color: AppTheme.success.withOpacity(0.7),
                    ),
                  ),
                ],
              ),
            )
                .animate()
                .shimmer(duration: 2000.ms, delay: 500.ms),
          ],
          
          // Order details
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                _buildDetailRow(
                  Icons.calendar_today_outlined,
                  'Ordered',
                  _formatDate(createdAt),
                ),
                const SizedBox(height: 8),
                _buildDetailRow(
                  Icons.access_time,
                  'Pickup',
                  '${bag['pickup_start_time']} - ${bag['pickup_end_time']}',
                ),
                const SizedBox(height: 8),
                _buildDetailRow(
                  Icons.location_on_outlined,
                  'Location',
                  restaurant['address_line1'] ?? 'Address',
                ),
              ],
            ),
          ),
          
          // Footer with price
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.muted,
              borderRadius: const BorderRadius.only(
                bottomLeft: Radius.circular(16),
                bottomRight: Radius.circular(16),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Total Paid',
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    color: AppTheme.mutedForeground,
                  ),
                ),
                Text(
                  '₹${bag['discounted_price']?.toStringAsFixed(0) ?? '0'}',
                  style: GoogleFonts.poppins(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.primary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    )
        .animate()
        .fadeIn(delay: Duration(milliseconds: index * 100), duration: 400.ms)
        .slideY(begin: 0.2, end: 0);
  }

  Widget _buildStatusBadge(String status) {
    Color color;
    String label;
    
    switch (status.toLowerCase()) {
      case 'confirmed':
        color = AppTheme.success;
        label = 'Confirmed';
        break;
      case 'pending':
        color = AppTheme.warning;
        label = 'Pending';
        break;
      case 'picked_up':
      case 'completed':
        color = AppTheme.green;
        label = 'Completed';
        break;
      case 'cancelled':
        color = AppTheme.error;
        label = 'Cancelled';
        break;
      default:
        color = AppTheme.mutedForeground;
        label = status;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: GoogleFonts.poppins(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 16, color: AppTheme.mutedForeground),
        const SizedBox(width: 8),
        Text(
          '$label: ',
          style: GoogleFonts.poppins(
            fontSize: 13,
            color: AppTheme.mutedForeground,
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: GoogleFonts.poppins(
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);
    
    if (difference.inDays == 0) {
      return 'Today';
    } else if (difference.inDays == 1) {
      return 'Yesterday';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} days ago';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }
}
