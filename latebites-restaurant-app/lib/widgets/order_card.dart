import 'package:flutter/material.dart';
import 'dart:async';
import '../config/theme.dart';
import '../models/order.dart';
import '../services/restaurant_service.dart';
import 'otp_input.dart';

class OrderCard extends StatefulWidget {
  final Order order;
  final Function(String otp) onVerifyOtp;
  final VoidCallback? onCancelled; // called after a successful cancellation

  const OrderCard({
    super.key,
    required this.order,
    required this.onVerifyOtp,
    this.onCancelled,
  });

  @override
  State<OrderCard> createState() => _OrderCardState();
}

class _OrderCardState extends State<OrderCard> {
  String _otp = '';
  bool _isVerifying = false;
  Timer? _timer;
  DateTime _now = DateTime.now();

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() => _now = DateTime.now());
      }
    });
  }


  Color get _statusColor {
    switch (widget.order.status) {
      case 'pending':
        return AppTheme.warning;
      case 'confirmed':
      case 'ready':
        return Colors.blue;
      case 'completed':
        return AppTheme.primary;
      case 'cancelled':
        return AppTheme.error;
      default:
        return AppTheme.textMuted;
    }
  }

  Future<void> _handleVerify() async {
    if (_otp.length != 4) return;
    
    setState(() => _isVerifying = true);
    await widget.onVerifyOtp(_otp);
    
    if (mounted) {
      setState(() {
        _isVerifying = false;
        _otp = '';
      });
    }
  }

  void _showCancelDialog(BuildContext context) {
    final pickupStartStr = widget.order.pickupStartTime;
    if (pickupStartStr == null) return;

    final parts = pickupStartStr.split(':');
    final now = DateTime.now();

    var pickupStart = DateTime(
        now.year, now.month, now.day, int.parse(parts[0]), int.parse(parts[1]));
    if (pickupStart.isBefore(now)) {
      pickupStart = pickupStart.add(const Duration(days: 1));
    }

    final lockInTime = pickupStart.subtract(const Duration(minutes: 45));
    final isLocked = now.isAfter(lockInTime);

    final reasonController = TextEditingController();
    bool isCancelling = false;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) => StatefulBuilder(
        builder: (dialogContext, setDialogState) {
          return AlertDialog(
            backgroundColor: AppTheme.surface,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            title: Row(
              children: [
                Icon(
                  isLocked ? Icons.warning_amber_rounded : Icons.cancel_outlined,
                  color: AppTheme.error,
                  size: 26,
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Text('Cancel Order', overflow: TextOverflow.ellipsis),
                ),
              ],
            ),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Lock-in warning
                  if (isLocked) ...[
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppTheme.error.withOpacity(0.08),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppTheme.error.withOpacity(0.4)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '⚠️ Lock-in Period Active',
                            style: TextStyle(
                              color: AppTheme.error,
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'Cancelling after lock-in will:\n'
                            '• Issue an automatic penalty strike (${widget.order.shortId})\n'
                            '• Customer refund handled by support\n'
                            '• 3 strikes deactivates your account',
                            style: TextStyle(
                              color: AppTheme.textMuted,
                              fontSize: 12,
                              height: 1.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),
                  ],

                  Text(
                    isLocked
                        ? 'Are you absolutely sure? This will incur a penalty strike.'
                        : 'Are you sure you want to cancel this order?',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 14),

                  // Reason input
                  Text(
                    'Reason for cancellation',
                    style: TextStyle(
                      color: AppTheme.textMuted,
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 6),
                  TextField(
                    controller: reasonController,
                    maxLines: 2,
                    style: const TextStyle(color: AppTheme.textPrimary, fontSize: 13),
                    decoration: InputDecoration(
                      hintText: 'e.g. Ran out of stock, kitchen issue…',
                      hintStyle: TextStyle(color: AppTheme.textMuted, fontSize: 12),
                      filled: true,
                      fillColor: AppTheme.surfaceLight,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: BorderSide(color: AppTheme.border),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: BorderSide(color: AppTheme.border),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: BorderSide(color: AppTheme.error.withOpacity(0.6)),
                      ),
                      contentPadding: const EdgeInsets.all(10),
                    ),
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: isCancelling ? null : () => Navigator.pop(dialogContext),
                child: const Text('KEEP ORDER'),
              ),
              ElevatedButton(
                onPressed: isCancelling
                    ? null
                    : () async {
                        setDialogState(() => isCancelling = true);

                        final service = RestaurantService();
                        final result = await service.cancelOrder(
                          orderId: widget.order.id,
                          reason: reasonController.text.trim().isNotEmpty
                              ? reasonController.text.trim()
                              : null,
                        );

                        if (!dialogContext.mounted) return;
                        Navigator.pop(dialogContext);

                        if (result.success) {
                          _showCancelResult(context, result);
                          widget.onCancelled?.call(); // refresh parent list
                        } else {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(result.error ?? 'Cancellation failed'),
                              backgroundColor: AppTheme.error,
                            ),
                          );
                        }
                      },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.error,
                  foregroundColor: Colors.white,
                  disabledBackgroundColor: AppTheme.error.withOpacity(0.5),
                ),
                child: isCancelling
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text('CANCEL ORDER'),
              ),
            ],
          );
        },
      ),
    );
  }

  /// Shows a result snackbar / dialog after cancellation
  void _showCancelResult(BuildContext context, CancelResult result) {
    if (!result.isAfterLockIn) {
      // Simple success banner
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('✅ Order cancelled. Bag quantity restored.'),
          backgroundColor: Colors.green,
        ),
      );
      return;
    }

    // After lock-in — show a prominent dialog explaining the penalty
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: AppTheme.error, size: 26),
            const SizedBox(width: 10),
            const Text('Order Cancelled'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.error.withOpacity(0.08),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppTheme.error.withOpacity(0.4)),
              ),
              child: Text(
                'Penalty Strike Issued\n'
                'Strike ${result.newStrikeCount}/3 on your account.',
                style: TextStyle(
                  color: AppTheme.error,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                  height: 1.5,
                ),
              ),
            ),
            const SizedBox(height: 12),
            if (result.restaurantDeactivated) ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red.shade900.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.red.shade700),
                ),
                child: const Text(
                  '🚫 Your account has been deactivated due to 3 strikes. '
                  'Please contact Latebites support.',
                  style: TextStyle(color: Colors.redAccent, fontSize: 12, height: 1.5),
                ),
              ),
            ],
            const SizedBox(height: 10),
            Text(
              'The customer will be notified and may contact support for a refund.',
              style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
            ),
          ],
        ),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary,
              foregroundColor: Colors.black,
            ),
            child: const Text('OK, UNDERSTOOD'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Order #${widget.order.shortId}',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            widget.order.bagTitle ?? 'Rescue Bag',
                            style: Theme.of(context).textTheme.titleMedium,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: _statusColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        widget.order.status.toUpperCase(),
                        style: TextStyle(
                          color: _statusColor,
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 1,
                        ),
                      ),
                    ),
                  ],
                ),
                
                const SizedBox(height: 16),
                
                // Details Grid
                Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: _buildDetailItem(
                            context,
                            Icons.person_outline,
                            'Customer',
                            widget.order.customerName ?? 'Unknown',
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildDetailItem(
                            context,
                            Icons.phone_outlined,
                            'Phone',
                            widget.order.customerPhone ?? 'N/A',
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: _buildDetailItem(
                            context,
                            Icons.shopping_bag_outlined,
                            'Quantity',
                            '${widget.order.quantity} bag(s)',
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildDetailItem(
                            context,
                            Icons.access_time,
                            'Pickup',
                            '${widget.order.pickupStartTime?.substring(0, 5) ?? '--'} - ${widget.order.pickupEndTime?.substring(0, 5) ?? '--'}',
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                
                const SizedBox(height: 16),
                
                // Timers
                if (widget.order.isPending && widget.order.pickupStartTime != null) ...[
                  _buildTimers(),
                  const SizedBox(height: 16),
                ],

                // Amount
                Container(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  decoration: BoxDecoration(
                    border: Border(
                      top: BorderSide(color: AppTheme.border),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Total Amount',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                      Text(
                        '₹${widget.order.totalAmount.toStringAsFixed(0)}',
                        style: Theme.of(context).textTheme.headlineMedium,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          // OTP Section (for pending orders)
          if (widget.order.isPending)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                border: Border(
                  top: BorderSide(color: AppTheme.border),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'ENTER CUSTOMER OTP TO COMPLETE',
                    style: TextStyle(
                      color: AppTheme.primary,
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 1.5,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: OtpInput(
                          onChanged: (value) {
                            setState(() => _otp = value);
                          },
                          onCompleted: (_) => _handleVerify(),
                        ),
                      ),
                      const SizedBox(width: 12),
                      SizedBox(
                        height: 56,
                        child: ElevatedButton(
                          onPressed: _otp.length == 4 && !_isVerifying 
                              ? _handleVerify 
                              : null,
                          child: _isVerifying
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.black,
                                  ),
                                )
                              : const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.check, size: 18),
                                    SizedBox(width: 8),
                                    Text('VERIFY'),
                                  ],
                                ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  // Cancel button
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () => _showCancelDialog(context),
                      icon: const Icon(Icons.cancel_outlined, size: 18),
                      label: const Text('CANCEL ORDER'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppTheme.error,
                        side: BorderSide(color: AppTheme.error.withOpacity(0.5)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildDetailItem(
    BuildContext context,
    IconData icon,
    String label,
    String value,
  ) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppTheme.textMuted),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: Theme.of(context).textTheme.bodySmall,
              ),
              Text(
                value,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppTheme.textPrimary,
                ),
                overflow: TextOverflow.ellipsis,
                maxLines: 1,
              ),
            ],
          ),
        ),
      ],
    );
  }
  Widget _buildTimers() {
    final pickupStartStr = widget.order.pickupStartTime!;
    final parts = pickupStartStr.split(':');
    final now = DateTime.now();
    
    // Parse pickup time
    var pickupStart = DateTime(now.year, now.month, now.day, int.parse(parts[0]), int.parse(parts[1]));
    
    // If pickup time is earlier than current time, it means it's tomorrow
    if (pickupStart.isBefore(now)) {
      pickupStart = pickupStart.add(const Duration(days: 1));
    }
    
    final lockInTime = pickupStart.subtract(const Duration(minutes: 45));
    
    final timeToLock = lockInTime.difference(_now);
    final timeToPickup = pickupStart.difference(_now);
    
    final isLocked = timeToLock.isNegative;
    
    // Format duration as H:MM:SS or M:SS
    String formatDuration(Duration d) {
      if (d.isNegative) return '0:00';
      final hours = d.inHours;
      final minutes = d.inMinutes.remainder(60);
      final seconds = d.inSeconds.remainder(60);
      if (hours > 0) {
        return '${hours}h ${minutes.toString().padLeft(2, '0')}m';
      } else if (minutes > 0) {
        return '${minutes}m ${seconds.toString().padLeft(2, '0')}s';
      } else {
        return '${seconds}s';
      }
    }
    
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.surfaceLight,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(
        children: [
          Expanded(
            child: _buildTimerItem(
              icon: isLocked ? Icons.lock : Icons.lock_clock,
              label: 'Lock-in',
              value: isLocked ? 'Locked' : formatDuration(timeToLock),
              color: isLocked ? AppTheme.error : AppTheme.warning,
              isActive: !isLocked,
            ),
          ),
          Container(width: 1, height: 24, color: AppTheme.border),
          Expanded(
            child: _buildTimerItem(
              icon: Icons.timer_outlined,
              label: 'Pickup',
              value: timeToPickup.isNegative ? 'Now!' : formatDuration(timeToPickup),
              color: AppTheme.primary,
              isActive: !timeToPickup.isNegative,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTimerItem({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
    required bool isActive,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(icon, size: 16, color: isActive ? color : AppTheme.textMuted),
        const SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
            Text(
              value,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                color: isActive ? color : AppTheme.textMuted,
              ),
            ),
          ],
        ),
      ],
    );
  }
}
