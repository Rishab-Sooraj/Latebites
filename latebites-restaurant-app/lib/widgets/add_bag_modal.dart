import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../config/theme.dart';

/// Bag size configuration with value slabs
class BagSize {
  final String id;
  final String name;
  final int minValue;
  final int maxValue;
  final IconData icon;

  const BagSize({
    required this.id,
    required this.name,
    required this.minValue,
    required this.maxValue,
    required this.icon,
  });

  static const List<BagSize> sizes = [
    BagSize(
      id: 'small',
      name: 'Small',
      minValue: 110,
      maxValue: 180,
      icon: Icons.shopping_bag_outlined,
    ),
    BagSize(
      id: 'medium',
      name: 'Medium',
      minValue: 250,
      maxValue: 350,
      icon: Icons.local_mall_outlined,
    ),
    BagSize(
      id: 'large',
      name: 'Large',
      minValue: 350,
      maxValue: 999, // No upper limit for large
      icon: Icons.local_mall,
    ),
  ];

  bool isValueValid(int value) => value >= minValue && value <= maxValue;
  
  String get rangeText => maxValue > 500 
      ? '₹$minValue+' 
      : '₹$minValue - ₹$maxValue';
}

/// Pricing calculator
class PricingEngine {
  /// Calculate customer price from estimated value
  /// Applies 40% discount and rounds DOWN to end in 9 or 0
  static int calculateCustomerPrice(int estimatedValue) {
    // 40% off = 60% of original
    double basePrice = estimatedValue * 0.6;
    
    // Round DOWN to nearest 9 or 0
    int rounded = basePrice.floor();
    int lastDigit = rounded % 10;
    
    if (lastDigit == 9 || lastDigit == 0) {
      return rounded;
    } else if (lastDigit < 5) {
      // Round down to 0
      return rounded - lastDigit;
    } else {
      // Round down to 9
      return rounded - (lastDigit - 9).abs();
    }
  }

  /// Calculate restaurant payout (92% of customer price)
  static int calculateRestaurantPayout(int customerPrice) {
    return (customerPrice * 0.92).floor();
  }

  /// Customer pays bag price + ₹5 platform fee
  static int calculateCustomerTotal(int customerPrice) {
    return customerPrice + 5;
  }
}

class AddBagModal extends StatefulWidget {
  final Function(String size, int estimatedValue, int quantity, String pickupStart, String pickupEnd) onConfirm;

  const AddBagModal({
    super.key,
    required this.onConfirm,
  });

  @override
  State<AddBagModal> createState() => _AddBagModalState();
}

class _AddBagModalState extends State<AddBagModal> {
  BagSize? _selectedSize;
  final TextEditingController _valueController = TextEditingController();
  int _quantity = 5;
  TimeOfDay _pickupStart = const TimeOfDay(hour: 20, minute: 30);
  TimeOfDay _pickupEnd = const TimeOfDay(hour: 21, minute: 30);
  bool _isLoading = false;
  String? _valueError;

  int get _estimatedValue => int.tryParse(_valueController.text) ?? 0;
  int get _customerPrice => PricingEngine.calculateCustomerPrice(_estimatedValue);
  int get _restaurantPayout => PricingEngine.calculateRestaurantPayout(_customerPrice);

  String _formatTimeForDB(TimeOfDay time) {
    return '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}:00';
  }

  String _formatTime12Hour(TimeOfDay time) {
    final hour = time.hourOfPeriod == 0 ? 12 : time.hourOfPeriod;
    final minute = time.minute.toString().padLeft(2, '0');
    final period = time.period == DayPeriod.am ? 'AM' : 'PM';
    return '$hour:$minute $period';
  }

  TimeOfDay get _lockInTime {
    // 45 minutes before pickup start
    int totalMinutes = _pickupStart.hour * 60 + _pickupStart.minute - 45;
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    return TimeOfDay(hour: totalMinutes ~/ 60, minute: totalMinutes % 60);
  }

  Future<void> _selectTime(bool isStart) async {
    final picked = await showTimePicker(
      context: context,
      initialTime: isStart ? _pickupStart : _pickupEnd,
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            timePickerTheme: TimePickerThemeData(
              backgroundColor: AppTheme.surface,
              hourMinuteColor: AppTheme.surfaceLight,
              hourMinuteTextColor: Colors.white,
              dialBackgroundColor: AppTheme.surfaceLight,
              dialHandColor: AppTheme.primary,
              dialTextColor: Colors.white,
              entryModeIconColor: AppTheme.primary,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        if (isStart) {
          _pickupStart = picked;
          // Auto-set end to 1 hour after start
          int endMinutes = picked.hour * 60 + picked.minute + 60;
          if (endMinutes >= 24 * 60) endMinutes -= 24 * 60;
          _pickupEnd = TimeOfDay(hour: endMinutes ~/ 60, minute: endMinutes % 60);
        } else {
          _pickupEnd = picked;
        }
      });
    }
  }

  void _validateValue() {
    if (_selectedSize == null || _estimatedValue == 0) {
      setState(() => _valueError = null);
      return;
    }

    if (!_selectedSize!.isValueValid(_estimatedValue)) {
      setState(() => _valueError = 'Value must be ${_selectedSize!.rangeText} for ${_selectedSize!.name} bags');
    } else {
      setState(() => _valueError = null);
    }
  }

  void _showLockInInfo() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Icon(Icons.lock_clock, color: AppTheme.error, size: 24),
            const SizedBox(width: 10),
            const Text('Lock-In Period', style: TextStyle(color: Colors.white, fontSize: 18)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildInfoRow('⏰', 'Lock-in occurs 45 minutes before pickup'),
            const SizedBox(height: 12),
            _buildInfoRow('✅', 'Before lock-in: Cancel freely, no penalty'),
            const SizedBox(height: 12),
            _buildInfoRow('🔒', 'After lock-in: Must fulfill if surplus exists'),
            const SizedBox(height: 12),
            _buildInfoRow('⚠️', 'Unfulfilled orders may result in reliability strike'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Got it', style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String emoji, String text) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(emoji, style: const TextStyle(fontSize: 16)),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13, height: 1.4),
          ),
        ),
      ],
    );
  }

  void _handleConfirm() {
    if (_selectedSize == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a bag size'), backgroundColor: AppTheme.error),
      );
      return;
    }

    if (_estimatedValue == 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter estimated value'), backgroundColor: AppTheme.error),
      );
      return;
    }

    if (_valueError != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(_valueError!), backgroundColor: AppTheme.error),
      );
      return;
    }

    setState(() => _isLoading = true);

    widget.onConfirm(
      _selectedSize!.id,
      _estimatedValue,
      _quantity,
      _formatTimeForDB(_pickupStart),
      _formatTimeForDB(_pickupEnd),
    );
  }

  @override
  void dispose() {
    _valueController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.9,
      ),
      decoration: const BoxDecoration(
        color: AppTheme.background,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppTheme.border,
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('List Surplus', style: Theme.of(context).textTheme.headlineSmall),
                    const SizedBox(height: 4),
                    Text('Add today\'s rescue bags', style: Theme.of(context).textTheme.bodySmall),
                  ],
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close, color: AppTheme.textMuted),
                ),
              ],
            ),
          ),

          // Content
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Step 1: Select Size
                  Text('1. SELECT BAG SIZE', style: Theme.of(context).textTheme.labelSmall),
                  const SizedBox(height: 12),

                  Row(
                    children: BagSize.sizes.asMap().entries.map((entry) {
                      final size = entry.value;
                      final isSelected = _selectedSize?.id == size.id;

                      return Expanded(
                        child: GestureDetector(
                          onTap: () {
                            setState(() => _selectedSize = size);
                            _validateValue();
                          },
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            margin: EdgeInsets.only(right: entry.key < 2 ? 10 : 0),
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            decoration: BoxDecoration(
                              color: isSelected ? AppTheme.primary.withValues(alpha: 0.15) : AppTheme.surface,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: isSelected ? AppTheme.primary : AppTheme.border,
                                width: isSelected ? 2 : 1,
                              ),
                            ),
                            child: Column(
                              children: [
                                Icon(
                                  size.icon,
                                  color: isSelected ? AppTheme.primary : AppTheme.textMuted,
                                  size: 28,
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  size.name,
                                  style: TextStyle(
                                    color: isSelected ? AppTheme.primary : AppTheme.textPrimary,
                                    fontWeight: FontWeight.w600,
                                    fontSize: 14,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  size.rangeText,
                                  style: TextStyle(
                                    color: AppTheme.textMuted,
                                    fontSize: 10,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ).animate().fadeIn(duration: 300.ms),

                  const SizedBox(height: 24),

                  // Step 2: Enter Value
                  Text('2. ESTIMATED VALUE PER BAG', style: Theme.of(context).textTheme.labelSmall),
                  const SizedBox(height: 12),

                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                    decoration: BoxDecoration(
                      color: AppTheme.surface,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: _valueError != null ? AppTheme.error : AppTheme.border),
                    ),
                    child: Row(
                      children: [
                        Text(
                          '₹',
                          style: TextStyle(
                            color: AppTheme.textPrimary,
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextField(
                            controller: _valueController,
                            keyboardType: TextInputType.number,
                            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                            style: const TextStyle(
                              color: AppTheme.textPrimary,
                              fontSize: 28,
                              fontWeight: FontWeight.bold,
                            ),
                            decoration: const InputDecoration(
                              hintText: '0',
                              hintStyle: TextStyle(color: AppTheme.textMuted),
                              border: InputBorder.none,
                              isDense: true,
                              contentPadding: EdgeInsets.zero,
                            ),
                            onChanged: (value) {
                              _validateValue();
                              setState(() {});
                            },
                          ),
                        ),
                      ],
                    ),
                  ),

                  if (_valueError != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      _valueError!,
                      style: const TextStyle(color: AppTheme.error, fontSize: 12),
                    ),
                  ],

                  const SizedBox(height: 24),

                  // Step 3: Quantity
                  Text('3. NUMBER OF BAGS', style: Theme.of(context).textTheme.labelSmall),
                  const SizedBox(height: 12),

                  Container(
                    padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                    decoration: BoxDecoration(
                      color: AppTheme.surface,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppTheme.border),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        _buildQuantityButton(Icons.remove, () {
                          if (_quantity > 1) setState(() => _quantity--);
                        }, enabled: _quantity > 1),
                        Container(
                          width: 70,
                          alignment: Alignment.center,
                          child: Text(
                            '$_quantity',
                            style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold),
                          ),
                        ),
                        _buildQuantityButton(Icons.add, () {
                          if (_quantity < 50) setState(() => _quantity++);
                        }, enabled: _quantity < 50),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Step 4: Pickup Time
                  Text('4. PICKUP WINDOW', style: Theme.of(context).textTheme.labelSmall),
                  const SizedBox(height: 12),

                  Row(
                    children: [
                      Expanded(child: _buildTimeButton('From', _formatTime12Hour(_pickupStart), () => _selectTime(true))),
                      const SizedBox(width: 12),
                      Expanded(child: _buildTimeButton('To', _formatTime12Hour(_pickupEnd), () => _selectTime(false))),
                    ],
                  ),

                  const SizedBox(height: 12),
                  
                  // Lock-in Warning Box
                  GestureDetector(
                    onTap: () => _showLockInInfo(),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppTheme.error.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppTheme.error.withValues(alpha: 0.3)),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.lock_clock, size: 20, color: AppTheme.error),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Lock-in at ${_formatTime12Hour(_lockInTime)}',
                                  style: TextStyle(
                                    color: AppTheme.error,
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Cannot cancel after this time',
                                  style: TextStyle(color: AppTheme.error.withValues(alpha: 0.7), fontSize: 11),
                                ),
                              ],
                            ),
                          ),
                          Icon(Icons.info_outline, size: 18, color: AppTheme.error.withValues(alpha: 0.6)),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Payout Preview (only show what restaurant receives)
                  if (_estimatedValue > 0 && _valueError == null)
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            AppTheme.primary.withValues(alpha: 0.2),
                            AppTheme.primary.withValues(alpha: 0.08),
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppTheme.primary.withValues(alpha: 0.4)),
                      ),
                      child: Column(
                        children: [
                          Text(
                            'YOU WILL RECEIVE',
                            style: TextStyle(
                              color: AppTheme.primary,
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              letterSpacing: 1.2,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.baseline,
                            textBaseline: TextBaseline.alphabetic,
                            children: [
                              Text(
                                '₹$_restaurantPayout',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 36,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              Text(
                                ' /bag',
                                style: TextStyle(
                                  color: AppTheme.textMuted,
                                  fontSize: 16,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: AppTheme.primary.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              'Total: ₹${_restaurantPayout * _quantity} for $_quantity bags',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ).animate().fadeIn(duration: 300.ms),

                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),

          // Confirm Button
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppTheme.surface,
              border: Border(top: BorderSide(color: AppTheme.border)),
            ),
            child: SafeArea(
              top: false,
              child: SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton(
                  onPressed: _isLoading || _valueError != null ? null : _handleConfirm,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: _isLoading
                      ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : Text(
                          _estimatedValue > 0 && _valueError == null
                              ? 'List $_quantity Bags (₹$_restaurantPayout each)'
                              : 'Enter details to list',
                          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                        ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuantityButton(IconData icon, VoidCallback onTap, {required bool enabled}) {
    return GestureDetector(
      onTap: enabled ? onTap : null,
      child: Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          color: AppTheme.surfaceLight,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(
          icon,
          color: enabled ? AppTheme.textPrimary : AppTheme.textMuted.withValues(alpha: 0.5),
          size: 24,
        ),
      ),
    );
  }

  Widget _buildTimeButton(String label, String time, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppTheme.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppTheme.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: Theme.of(context).textTheme.bodySmall),
            const SizedBox(height: 4),
            Row(
              children: [
                Icon(Icons.access_time, color: AppTheme.primary, size: 18),
                const SizedBox(width: 6),
                Text(
                  time,
                  style: const TextStyle(color: AppTheme.textPrimary, fontSize: 16, fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
