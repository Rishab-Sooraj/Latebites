import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import '../config/theme.dart';
import '../services/restaurant_service.dart';
import '../widgets/add_bag_modal.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final RestaurantService _service = RestaurantService();
  
  bool _isLoading = true;
  bool _isActive = false;
  bool _isToggling = false;
  Map<String, dynamic>? _restaurantInfo;
  List<Map<String, dynamic>> _bags = [];

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    
    final info = await _service.getRestaurantInfo();
    final bags = await _service.getTodayBags();
    
    debugPrint('📦 Fetched ${bags.length} bags');
    
    if (!mounted) return;
    
    setState(() {
      _restaurantInfo = info;
      _isActive = info?['is_active'] == true;
      _bags = bags;
      _isLoading = false;
    });
  }

  Future<void> _handleToggle() async {
    if (_isToggling) return;
    
    setState(() => _isToggling = true);
    
    final newStatus = !_isActive;
    final success = await _service.toggleActive(newStatus);
    
    if (!mounted) return;
    
    if (success) {
      setState(() {
        _isActive = newStatus;
      });
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(newStatus ? '🎉 You\'re now ONLINE!' : '😴 You\'re now OFFLINE'),
          backgroundColor: newStatus ? AppTheme.primary : AppTheme.textMuted,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to update status. Please try again.'),
          backgroundColor: AppTheme.error,
        ),
      );
    }
    
    setState(() => _isToggling = false);
  }

  void _showAddBagModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => AddBagModal(
        onConfirm: (size, estimatedValue, quantity, pickupStart, pickupEnd, dietaryInfo) async {
          Navigator.pop(ctx);
          
          final success = await _service.createRescueBag(
            size: size,
            estimatedValue: estimatedValue,
            quantity: quantity,
            pickupStart: pickupStart,
            pickupEnd: pickupEnd,
            dietaryInfo: dietaryInfo,
          );
          
          if (!mounted) return;
          
          if (success) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('✅ Listed $quantity ${size.toUpperCase()} bags!'),
                backgroundColor: AppTheme.primary,
              ),
            );
            _fetchData();
          } else {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Failed to add bags. Please try again.'),
                backgroundColor: AppTheme.error,
              ),
            );
          }
        },
      ),
    );
  }

  Future<void> _updateQuantity(String bagId, int currentQty, int delta) async {
    final newQty = (currentQty + delta).clamp(1, 99);
    
    setState(() {
      final index = _bags.indexWhere((b) => b['id'] == bagId);
      if (index != -1) {
        _bags[index]['quantity_available'] = newQty;
      }
    });
    
    await _service.updateBagQuantity(bagId, newQty);
  }

  Future<void> _deleteBag(String bagId, String bagName) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surface,
        title: const Text('Delete Listing?', style: TextStyle(color: Colors.white)),
        content: Text(
          'Remove "$bagName" from today\'s listings?',
          style: const TextStyle(color: AppTheme.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: AppTheme.error),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final success = await _service.deleteBag(bagId);
      
      if (!mounted) return;
      
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('🗑️ Listing removed'),
            backgroundColor: AppTheme.textMuted,
          ),
        );
        _fetchData();
      }
    }
  }

  String _formatTime12Hour(String time24) {
    try {
      final parts = time24.split(':');
      final hour = int.parse(parts[0]);
      final minute = parts.length > 1 ? int.parse(parts[1]) : 0;
      final period = hour >= 12 ? 'PM' : 'AM';
      final hour12 = hour == 0 ? 12 : (hour > 12 ? hour - 12 : hour);
      return '$hour12:${minute.toString().padLeft(2, '0')} $period';
    } catch (e) {
      return time24;
    }
  }

  int _calculatePayout(int customerPrice) {
    return (customerPrice * 0.92).floor();
  }

  @override
  Widget build(BuildContext context) {
    final today = DateFormat('EEEE, MMMM d').format(DateTime.now());
    final restaurantName = _restaurantInfo?['name'] ?? 'Restaurant';
    
    // Calculate totals
    int totalBags = 0;
    int totalPayout = 0;
    for (final bag in _bags) {
      final qty = bag['quantity_available'] ?? 0;
      final price = (bag['discounted_price'] ?? 0).toDouble().toInt();
      totalBags += qty as int;
      totalPayout += _calculatePayout(price) * qty;
    }
    
    return RefreshIndicator(
      onRefresh: _fetchData,
      color: AppTheme.primary,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Welcome Header
            Text('Welcome back,', style: Theme.of(context).textTheme.bodyMedium),
            const SizedBox(height: 4),
            Text(restaurantName, style: Theme.of(context).textTheme.headlineMedium),
            const SizedBox(height: 4),
            Text(today, style: Theme.of(context).textTheme.bodySmall),
            
            const SizedBox(height: 24),
            
            if (_isLoading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(40),
                  child: CircularProgressIndicator(color: AppTheme.primary),
                ),
              )
            else ...[
              // Status Toggle Card
              _buildStatusCard().animate().fadeIn(duration: 400.ms),
              
              const SizedBox(height: 20),
              
              // Today's Stats (when online)
              if (_isActive && _bags.isNotEmpty)
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppTheme.surface,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppTheme.border),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          children: [
                            Text('$totalBags', style: TextStyle(color: AppTheme.primary, fontSize: 28, fontWeight: FontWeight.bold)),
                            Text('Bags Listed', style: Theme.of(context).textTheme.bodySmall),
                          ],
                        ),
                      ),
                      Container(width: 1, height: 40, color: AppTheme.border),
                      Expanded(
                        child: Column(
                          children: [
                            Text('₹$totalPayout', style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
                            Text('Est. Payout', style: Theme.of(context).textTheme.bodySmall),
                          ],
                        ),
                      ),
                    ],
                  ),
                ).animate().fadeIn(duration: 400.ms, delay: 100.ms),
              
              const SizedBox(height: 20),
              
              // Add Bag Button (when online)
              if (_isActive)
                SizedBox(
                  width: double.infinity,
                  height: 54,
                  child: ElevatedButton.icon(
                    onPressed: _showAddBagModal,
                    icon: const Icon(Icons.add, size: 22),
                    label: const Text('List Surplus', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                  ),
                ).animate().fadeIn(duration: 400.ms, delay: 150.ms),
              
              // Bags section
              if (_bags.isNotEmpty) ...[
                const SizedBox(height: 24),
                Text('TODAY\'S LISTINGS', style: Theme.of(context).textTheme.labelSmall),
                const SizedBox(height: 12),
                
                ...(_bags.asMap().entries.where((entry) {
                  final bag = entry.value;
                  final qty = (bag['quantity_available'] ?? 0) as int;
                  return qty > 0; // Only show bags with available quantity
                }).map((entry) {
                  final index = entry.key;
                  final bag = entry.value;
                  
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _buildBagCard(bag).animate().fadeIn(
                      duration: 400.ms,
                      delay: Duration(milliseconds: 200 + (index * 80)),
                    ).slideY(begin: 0.1),
                  );
                })),
              ],
              
              // Empty state when online but no bags
              if (_isActive && _bags.isEmpty)
                Container(
                  margin: const EdgeInsets.only(top: 20),
                  padding: const EdgeInsets.all(32),
                  decoration: BoxDecoration(
                    color: AppTheme.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppTheme.border),
                  ),
                  child: Column(
                    children: [
                      Icon(Icons.inventory_2_outlined, size: 48, color: AppTheme.primary.withValues(alpha: 0.5)),
                      const SizedBox(height: 16),
                      Text('No Surplus Listed', style: Theme.of(context).textTheme.titleLarge),
                      const SizedBox(height: 8),
                      Text(
                        'Tap the button above to list your surplus food for today.',
                        style: Theme.of(context).textTheme.bodyMedium,
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ).animate().fadeIn(duration: 400.ms, delay: 200.ms),
              
              // Offline state
              if (!_isActive)
                Container(
                  margin: const EdgeInsets.only(top: 20),
                  padding: const EdgeInsets.all(32),
                  decoration: BoxDecoration(
                    color: AppTheme.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppTheme.border),
                  ),
                  child: Column(
                    children: [
                      Icon(Icons.storefront, size: 48, color: AppTheme.textMuted.withValues(alpha: 0.5)),
                      const SizedBox(height: 16),
                      Text('You\'re Offline', style: Theme.of(context).textTheme.titleLarge),
                      const SizedBox(height: 8),
                      Text(
                        'Go online to list surplus and receive orders.',
                        style: Theme.of(context).textTheme.bodyMedium,
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ).animate().fadeIn(duration: 400.ms, delay: 200.ms),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStatusCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: _isActive
            ? LinearGradient(
                colors: [AppTheme.primary.withValues(alpha: 0.15), AppTheme.primary.withValues(alpha: 0.05)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              )
            : null,
        color: _isActive ? null : AppTheme.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: _isActive ? AppTheme.primary.withValues(alpha: 0.3) : AppTheme.border,
          width: 2,
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: _isActive ? AppTheme.primary : AppTheme.textMuted,
                        borderRadius: BorderRadius.circular(5),
                        boxShadow: _isActive ? [
                          BoxShadow(color: AppTheme.primary.withValues(alpha: 0.5), blurRadius: 6, spreadRadius: 1),
                        ] : null,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      _isActive ? 'LIVE' : 'OFFLINE',
                      style: TextStyle(
                        color: _isActive ? AppTheme.primary : AppTheme.textMuted,
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.2,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  _isActive ? 'Customers can order' : 'Tap to go live',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
          
          GestureDetector(
            onTap: _isToggling ? null : _handleToggle,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              width: 72,
              height: 40,
              decoration: BoxDecoration(
                color: _isActive ? AppTheme.primary : AppTheme.surfaceLight,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: _isActive ? AppTheme.primary : AppTheme.border, width: 2),
                boxShadow: _isActive ? [
                  BoxShadow(color: AppTheme.primary.withValues(alpha: 0.3), blurRadius: 10, offset: const Offset(0, 3)),
                ] : null,
              ),
              child: Stack(
                children: [
                  AnimatedPositioned(
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.easeInOut,
                    left: _isActive ? 36 : 4,
                    top: 4,
                    child: Container(
                      width: 28,
                      height: 28,
                      decoration: BoxDecoration(
                        color: _isActive ? Colors.white : AppTheme.textMuted,
                        borderRadius: BorderRadius.circular(14),
                        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.2), blurRadius: 4, offset: const Offset(0, 2))],
                      ),
                      child: _isToggling
                          ? const Padding(padding: EdgeInsets.all(5), child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primary))
                          : Icon(_isActive ? Icons.check : Icons.close, size: 16, color: _isActive ? AppTheme.primary : Colors.white),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBagCard(Map<String, dynamic> bag) {
    final bagId = bag['id'] as String;
    final title = bag['title'] ?? 'Rescue Bag';
    final size = bag['size'] ?? 'medium';
    final quantity = bag['quantity_available'] ?? 0;
    final originalPrice = (bag['original_price'] ?? 0).toDouble().toInt();
    final customerPrice = (bag['discounted_price'] ?? 0).toDouble().toInt();
    final pickupStart = (bag['pickup_start_time'] ?? '').toString();
    final pickupEnd = (bag['pickup_end_time'] ?? '').toString();
    final payout = _calculatePayout(customerPrice);
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppTheme.primary.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            size.toString().toUpperCase(),
                            style: TextStyle(color: AppTheme.primary, fontSize: 11, fontWeight: FontWeight.w600),
                          ),
                        ),
                        const SizedBox(width: 8),
                        if (pickupStart.isNotEmpty && pickupEnd.isNotEmpty)
                          Row(
                            children: [
                              Icon(Icons.access_time, size: 14, color: AppTheme.textMuted),
                              const SizedBox(width: 4),
                              Text(
                                '${_formatTime12Hour(pickupStart)} - ${_formatTime12Hour(pickupEnd)}',
                                style: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
                              ),
                            ],
                          ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text('Worth ₹$originalPrice+', style: Theme.of(context).textTheme.bodySmall),
                  ],
                ),
              ),
              
              IconButton(
                onPressed: () => _deleteBag(bagId, title),
                icon: const Icon(Icons.delete_outline, size: 20),
                color: AppTheme.error.withValues(alpha: 0.8),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
              ),
            ],
          ),
          
          const SizedBox(height: 12),
          Divider(color: AppTheme.border, height: 1),
          const SizedBox(height: 12),
          
          Row(
            children: [
              // Quantity Controls
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceLight,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _buildSmallButton(Icons.remove, () => _updateQuantity(bagId, quantity, -1), enabled: quantity > 1),
                    Container(
                      width: 36,
                      alignment: Alignment.center,
                      child: Text('$quantity', style: const TextStyle(color: AppTheme.textPrimary, fontWeight: FontWeight.bold, fontSize: 16)),
                    ),
                    _buildSmallButton(Icons.add, () => _updateQuantity(bagId, quantity, 1), enabled: true),
                  ],
                ),
              ),
              
              const Spacer(),
              
              // Pricing (Restaurant Payout Only)
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text('₹$payout', style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold, fontSize: 20)),
                  Text('You get', style: const TextStyle(color: AppTheme.textMuted, fontSize: 11)),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSmallButton(IconData icon, VoidCallback onTap, {required bool enabled}) {
    return GestureDetector(
      onTap: enabled ? onTap : null,
      child: Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(color: AppTheme.surface, borderRadius: BorderRadius.circular(8)),
        child: Icon(icon, color: enabled ? AppTheme.textPrimary : AppTheme.textMuted.withValues(alpha: 0.5), size: 18),
      ),
    );
  }
}
