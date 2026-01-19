class DailyListing {
  final String id;
  final String restaurantId;
  final String date;
  final String pickupStart;
  final String pickupEnd;
  final DateTime lockInTime;
  final bool isLocked;
  final int? smallPrice;
  final int smallQuantity;
  final int smallSold;
  final int? mediumPrice;
  final int mediumQuantity;
  final int mediumSold;
  final int? largePrice;
  final int largeQuantity;
  final int largeSold;
  final String status;

  DailyListing({
    required this.id,
    required this.restaurantId,
    required this.date,
    required this.pickupStart,
    required this.pickupEnd,
    required this.lockInTime,
    required this.isLocked,
    this.smallPrice,
    required this.smallQuantity,
    required this.smallSold,
    this.mediumPrice,
    required this.mediumQuantity,
    required this.mediumSold,
    this.largePrice,
    required this.largeQuantity,
    required this.largeSold,
    required this.status,
  });

  factory DailyListing.fromJson(Map<String, dynamic> json) {
    return DailyListing(
      id: json['id'] ?? '',
      restaurantId: json['restaurant_id'] ?? '',
      date: json['date'] ?? '',
      pickupStart: json['pickup_start'] ?? '',
      pickupEnd: json['pickup_end'] ?? '',
      lockInTime: json['lock_in_time'] != null 
          ? DateTime.parse(json['lock_in_time']) 
          : DateTime.now(),
      isLocked: json['is_locked'] ?? false,
      smallPrice: json['small_price'],
      smallQuantity: json['small_quantity'] ?? 0,
      smallSold: json['small_sold'] ?? 0,
      mediumPrice: json['medium_price'],
      mediumQuantity: json['medium_quantity'] ?? 0,
      mediumSold: json['medium_sold'] ?? 0,
      largePrice: json['large_price'],
      largeQuantity: json['large_quantity'] ?? 0,
      largeSold: json['large_sold'] ?? 0,
      status: json['status'] ?? 'active',
    );
  }

  int getQuantity(String size) {
    switch (size) {
      case 'small':
        return smallQuantity;
      case 'medium':
        return mediumQuantity;
      case 'large':
        return largeQuantity;
      default:
        return 0;
    }
  }

  int getSold(String size) {
    switch (size) {
      case 'small':
        return smallSold;
      case 'medium':
        return mediumSold;
      case 'large':
        return largeSold;
      default:
        return 0;
    }
  }

  String getTimeUntilLockIn() {
    final now = DateTime.now();
    final diff = lockInTime.difference(now);
    if (diff.isNegative) return 'Locked';
    final hours = diff.inHours;
    final mins = diff.inMinutes % 60;
    return '${hours}h ${mins}m';
  }
}
