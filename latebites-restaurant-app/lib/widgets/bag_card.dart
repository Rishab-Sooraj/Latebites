import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../models/restaurant_config.dart';

class BagCard extends StatelessWidget {
  final BagInfo bag;
  final int quantity;
  final int sold;
  final bool isLocked;
  final VoidCallback onIncrement;
  final VoidCallback onDecrement;

  const BagCard({
    super.key,
    required this.bag,
    required this.quantity,
    required this.sold,
    required this.isLocked,
    required this.onIncrement,
    required this.onDecrement,
  });

  Color get _sizeColor {
    switch (bag.size) {
      case 'small':
        return AppTheme.primary;
      case 'medium':
        return AppTheme.warning;
      case 'large':
        return AppTheme.error;
      default:
        return AppTheme.primary;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        children: [
          // Header Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(Icons.shopping_bag, color: _sizeColor, size: 24),
                  const SizedBox(width: 12),
                  Text(
                    '${bag.size[0].toUpperCase()}${bag.size.substring(1)} Bag',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: bag.category == 'veg'
                          ? Colors.green.withOpacity(0.1)
                          : Colors.red.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          bag.category == 'veg' ? Icons.eco : Icons.restaurant,
                          size: 12,
                          color: bag.category == 'veg' ? Colors.green : Colors.red,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          bag.category == 'veg' ? 'Veg' : 'Non-Veg',
                          style: TextStyle(
                            fontSize: 10,
                            color: bag.category == 'veg' ? Colors.green : Colors.red,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              
              // Quantity Controls
              Row(
                children: [
                  _buildQuantityButton(
                    icon: Icons.remove,
                    onPressed: quantity > 0 && !isLocked ? onDecrement : null,
                  ),
                  Container(
                    width: 48,
                    alignment: Alignment.center,
                    child: Text(
                      '$quantity',
                      style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  _buildQuantityButton(
                    icon: Icons.add,
                    onPressed: !isLocked ? onIncrement : null,
                  ),
                ],
              ),
            ],
          ),
          
          const SizedBox(height: 16),
          const Divider(color: AppTheme.border, height: 1),
          const SizedBox(height: 16),
          
          // Price Info Row
          Row(
            children: [
              _buildPriceInfo(context, 'Customer Pays', '₹${bag.price}', AppTheme.textPrimary),
              _buildPriceInfo(context, 'Min Value', '₹${bag.minValue}', AppTheme.textSecondary),
              _buildPriceInfo(context, 'You Get', '₹${bag.payout}', AppTheme.primary),
            ],
          ),
          
          // Sold info
          if (sold > 0) ...[
            const SizedBox(height: 12),
            const Divider(color: AppTheme.border, height: 1),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Sold',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                Text(
                  '$sold / $quantity',
                  style: TextStyle(
                    color: AppTheme.primary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildQuantityButton({
    required IconData icon,
    required VoidCallback? onPressed,
  }) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: AppTheme.surfaceLight,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(
          icon,
          color: onPressed != null ? AppTheme.textPrimary : AppTheme.textMuted.withOpacity(0.5),
          size: 20,
        ),
      ),
    );
  }

  Widget _buildPriceInfo(BuildContext context, String label, String value, Color valueColor) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              color: valueColor,
              fontWeight: FontWeight.w600,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }
}
