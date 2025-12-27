import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/theme.dart';
import '../services/notification_service.dart';

/// Rescue bag detail screen - View details and book a bag
class BagDetailScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic> bag;
  
  const BagDetailScreen({
    super.key,
    required this.bag,
  });
  
  @override
  ConsumerState<BagDetailScreen> createState() => _BagDetailScreenState();
}

class _BagDetailScreenState extends ConsumerState<BagDetailScreen> {
  bool _isBooking = false;
  
  Future<void> _bookBag() async {
    setState(() => _isBooking = true);
    
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) {
        throw Exception('Please login to book');
      }
      
      // Create booking
      final booking = await Supabase.instance.client
          .from('bookings')
          .insert({
            'user_id': user.id,
            'bag_id': widget.bag['id'],
            'restaurant_id': widget.bag['restaurant_id'],
            'status': 'confirmed',
            'payment_status': 'pending', // Mock payment for now
            'amount': widget.bag['price'],
          })
          .select()
          .single();
      
      // Decrement available slots
      await Supabase.instance.client
          .from('rescue_bags')
          .update({
            'available_slots': widget.bag['available_slots'] - 1,
          })
          .eq('id', widget.bag['id']);
      
      if (mounted) {
        // Show success
        InAppNotification.showSuccess(
          context,
          'Booking confirmed! Check your email for details.',
        );
        
        // Navigate back
        Navigator.pop(context, true); // true = booking successful
      }
    } catch (e) {
      if (mounted) {
        InAppNotification.showError(context, 'Booking failed: $e');
      }
    } finally {
      if (mounted) {
        setState(() => _isBooking = false);
      }
    }
  }
  
  @override
  Widget build(BuildContext context) {
    final restaurant = widget.bag['restaurants'];
    final size = widget.bag['size'] as String;
    final price = widget.bag['price'];
    final guaranteedValue = widget.bag['guaranteed_value'];
    final availableSlots = widget.bag['available_slots'];
    final totalSlots = widget.bag['total_slots'];
    final pickupStart = DateTime.parse(widget.bag['pickup_start']);
    final pickupEnd = DateTime.parse(widget.bag['pickup_end']);
    final description = widget.bag['description'] ?? 'Delicious surplus food items';
    
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: CustomScrollView(
        slivers: [
          // App Bar
          SliverAppBar(
            expandedHeight: 200,
            pinned: true,
            backgroundColor: AppTheme.primary,
            flexibleSpace: FlexibleSpaceBar(
              title: Text(
                restaurant['name'],
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      AppTheme.primary,
                      AppTheme.primary.withOpacity(0.8),
                    ],
                  ),
                ),
                child: Center(
                  child: Icon(
                    Icons.restaurant,
                    size: 80,
                    color: Colors.white.withOpacity(0.3),
                  ),
                ),
              ),
            ),
          ),
          
          // Content
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Bag Size & Slots
                  Row(
                    children: [
                      _buildInfoCard(
                        icon: Icons.shopping_bag_outlined,
                        label: 'Size',
                        value: '${size[0].toUpperCase()}${size.substring(1)}',
                        color: AppTheme.orange,
                      ),
                      const SizedBox(width: 12),
                      _buildInfoCard(
                        icon: Icons.inventory_2_outlined,
                        label: 'Slots Left',
                        value: '$availableSlots/$totalSlots',
                        color: availableSlots <= 3 ? AppTheme.error : AppTheme.success,
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Description
                  Text(
                    'What\'s Inside',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    description,
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: AppTheme.mutedForeground,
                      height: 1.6,
                    ),
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Pricing
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: AppTheme.orangeLight,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppTheme.orange.withOpacity(0.3)),
                    ),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'YOU PAY',
                                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                    color: AppTheme.orange,
                                    letterSpacing: 1.2,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '₹${price.toStringAsFixed(0)}',
                                  style: Theme.of(context).textTheme.displaySmall?.copyWith(
                                    color: AppTheme.orange,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  'MIN VALUE',
                                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                    color: AppTheme.mutedForeground,
                                    letterSpacing: 1.2,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '₹${guaranteedValue.toStringAsFixed(0)}+',
                                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                    color: AppTheme.foreground,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 10,
                          ),
                          decoration: BoxDecoration(
                            color: AppTheme.success.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.savings_outlined,
                                size: 18,
                                color: AppTheme.success,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'Save ${((1 - price / guaranteedValue) * 100).toStringAsFixed(0)}% • ₹${(guaranteedValue - price).toStringAsFixed(0)} off',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: AppTheme.success,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Pickup Details
                  Text(
                    'Pickup Details',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 12),
                  
                  _buildDetailRow(
                    icon: Icons.access_time,
                    label: 'Pickup Window',
                    value: '${_formatTime(pickupStart)} - ${_formatTime(pickupEnd)}',
                  ),
                  
                  const SizedBox(height: 12),
                  
                  _buildDetailRow(
                    icon: Icons.location_on_outlined,
                    label: 'Address',
                    value: '${restaurant['address']}, ${restaurant['city']}',
                  ),
                  
                  const SizedBox(height: 32),
                  
                  // Important Notes
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppTheme.muted,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(
                              Icons.info_outline,
                              size: 20,
                              color: AppTheme.primary,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Important',
                              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        _buildBulletPoint('You\'ll receive an OTP before pickup'),
                        _buildBulletPoint('Show OTP at restaurant to collect'),
                        _buildBulletPoint('Pickup only - no delivery'),
                        _buildBulletPoint('Contents may vary from description'),
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 100), // Space for bottom button
                ],
              ),
            ),
          ),
        ],
      ),
      
      // Book Button
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: AppTheme.background,
          border: Border(
            top: BorderSide(color: AppTheme.borderLight),
          ),
        ),
        child: SafeArea(
          child: SizedBox(
            height: 56,
            child: ElevatedButton(
              onPressed: _isBooking || availableSlots <= 0 ? null : _bookBag,
              child: _isBooking
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2,
                      ),
                    )
                  : Text(
                      availableSlots <= 0
                          ? 'Sold Out'
                          : 'Book for ₹${price.toStringAsFixed(0)}',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
            ),
          ),
        ),
      ),
    );
  }
  
  Widget _buildInfoCard({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                color: AppTheme.mutedForeground,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildDetailRow({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 20, color: AppTheme.primary),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: AppTheme.mutedForeground,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
  
  Widget _buildBulletPoint(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '• ',
            style: TextStyle(
              fontSize: 14,
              color: AppTheme.mutedForeground,
            ),
          ),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                fontSize: 13,
                color: AppTheme.mutedForeground,
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }
  
  String _formatTime(DateTime time) {
    final hour = time.hour;
    final minute = time.minute.toString().padLeft(2, '0');
    final period = hour >= 12 ? 'PM' : 'AM';
    final displayHour = hour > 12 ? hour - 12 : (hour == 0 ? 12 : hour);
    return '$displayHour:$minute $period';
  }
}
