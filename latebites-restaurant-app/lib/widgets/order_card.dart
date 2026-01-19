import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../models/order.dart';
import 'otp_input.dart';

class OrderCard extends StatefulWidget {
  final Order order;
  final Function(String otp) onVerifyOtp;

  const OrderCard({
    super.key,
    required this.order,
    required this.onVerifyOtp,
  });

  @override
  State<OrderCard> createState() => _OrderCardState();
}

class _OrderCardState extends State<OrderCard> {
  String _otp = '';
  bool _isVerifying = false;

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
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Column(
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
                        ),
                      ],
                    ),
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
                
                const SizedBox(height: 20),
                
                // Details Grid
                Row(
                  children: [
                    _buildDetailItem(
                      context,
                      Icons.person_outline,
                      'Customer',
                      widget.order.customerName ?? 'Unknown',
                    ),
                    _buildDetailItem(
                      context,
                      Icons.phone_outlined,
                      'Phone',
                      widget.order.customerPhone ?? 'N/A',
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _buildDetailItem(
                      context,
                      Icons.shopping_bag_outlined,
                      'Quantity',
                      '${widget.order.quantity} bag(s)',
                    ),
                    _buildDetailItem(
                      context,
                      Icons.access_time,
                      'Pickup Time',
                      '${widget.order.pickupStartTime?.substring(0, 5) ?? '--'} - ${widget.order.pickupEndTime?.substring(0, 5) ?? '--'}',
                    ),
                  ],
                ),
                
                const SizedBox(height: 16),
                
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
              padding: const EdgeInsets.all(20),
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
                      const SizedBox(width: 16),
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
    return Expanded(
      child: Row(
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
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
