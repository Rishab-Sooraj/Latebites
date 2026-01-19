/// Order model
class Order {
  final String id;
  final String customerId;
  final String rescueBagId;
  final String restaurantId;
  final int quantity;
  final double totalPrice;
  final String status;
  final String pickupTime;
  final String paymentMethod;
  final String paymentStatus;
  final String pickupOtp;
  final String? qrCode;
  final String? cancellationReason;
  final String createdAt;
  final String updatedAt;
  
  // Joined data
  final String? bagTitle;
  final String? pickupStartTime;
  final String? pickupEndTime;
  final String? customerName;
  final String? customerPhone;

  Order({
    required this.id,
    required this.customerId,
    required this.rescueBagId,
    required this.restaurantId,
    required this.quantity,
    required this.totalPrice,
    required this.status,
    required this.pickupTime,
    required this.paymentMethod,
    required this.paymentStatus,
    required this.pickupOtp,
    this.qrCode,
    this.cancellationReason,
    required this.createdAt,
    required this.updatedAt,
    this.bagTitle,
    this.pickupStartTime,
    this.pickupEndTime,
    this.customerName,
    this.customerPhone,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    final rescueBag = json['rescue_bags'] as Map<String, dynamic>?;
    final customer = json['customers'] as Map<String, dynamic>?;
    
    return Order(
      id: json['id'] ?? '',
      customerId: json['customer_id'] ?? '',
      rescueBagId: json['rescue_bag_id'] ?? '',
      restaurantId: json['restaurant_id'] ?? '',
      quantity: json['quantity'] ?? 1,
      totalPrice: (json['total_price'] ?? 0).toDouble(),
      status: json['status'] ?? 'pending',
      pickupTime: json['pickup_time'] ?? '',
      paymentMethod: json['payment_method'] ?? 'pay_at_pickup',
      paymentStatus: json['payment_status'] ?? 'pending',
      pickupOtp: json['pickup_otp'] ?? '',
      qrCode: json['qr_code'],
      cancellationReason: json['cancellation_reason'],
      createdAt: json['created_at'] ?? '',
      updatedAt: json['updated_at'] ?? '',
      bagTitle: rescueBag?['title'],
      pickupStartTime: rescueBag?['pickup_start_time'],
      pickupEndTime: rescueBag?['pickup_end_time'],
      customerName: customer?['name'],
      customerPhone: customer?['phone'],
    );
  }

  /// Short ID for display (first 8 chars)
  String get shortId => id.length >= 8 ? id.substring(0, 8).toUpperCase() : id.toUpperCase();
  
  /// Total amount to display
  double get totalAmount => totalPrice;

  /// Status checks
  bool get isPending => status == 'pending' || status == 'confirmed' || status == 'ready';
  bool get isCompleted => status == 'completed';
  bool get isCancelled => status == 'cancelled';
}
