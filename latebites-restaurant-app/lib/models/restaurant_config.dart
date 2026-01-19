class RestaurantConfig {
  final String id;
  final String name;
  final bool bagSmallEnabled;
  final bool bagMediumEnabled;
  final bool bagLargeEnabled;
  final String bagSmallCategory;
  final String bagMediumCategory;
  final String bagLargeCategory;
  final int bagSmallPrice;
  final int bagMediumPrice;
  final int bagLargePrice;
  final String defaultPickupStart;
  final String defaultPickupEnd;
  final int reliabilityStrikes;

  RestaurantConfig({
    required this.id,
    required this.name,
    required this.bagSmallEnabled,
    required this.bagMediumEnabled,
    required this.bagLargeEnabled,
    required this.bagSmallCategory,
    required this.bagMediumCategory,
    required this.bagLargeCategory,
    required this.bagSmallPrice,
    required this.bagMediumPrice,
    required this.bagLargePrice,
    required this.defaultPickupStart,
    required this.defaultPickupEnd,
    required this.reliabilityStrikes,
  });

  factory RestaurantConfig.fromJson(Map<String, dynamic> json) {
    return RestaurantConfig(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      bagSmallEnabled: json['bag_small_enabled'] ?? false,
      bagMediumEnabled: json['bag_medium_enabled'] ?? false,
      bagLargeEnabled: json['bag_large_enabled'] ?? false,
      bagSmallCategory: json['bag_small_category'] ?? 'veg',
      bagMediumCategory: json['bag_medium_category'] ?? 'veg',
      bagLargeCategory: json['bag_large_category'] ?? 'veg',
      bagSmallPrice: json['bag_small_price'] ?? 79,
      bagMediumPrice: json['bag_medium_price'] ?? 159,
      bagLargePrice: json['bag_large_price'] ?? 199,
      defaultPickupStart: json['default_pickup_start'] ?? '21:00',
      defaultPickupEnd: json['default_pickup_end'] ?? '21:30',
      reliabilityStrikes: json['reliability_strikes'] ?? 0,
    );
  }

  List<BagInfo> get enabledBags {
    List<BagInfo> bags = [];
    if (bagSmallEnabled) {
      bags.add(BagInfo(
        size: 'small',
        price: bagSmallPrice,
        category: bagSmallCategory,
        minValue: bagSmallPrice == 79 ? 110 : 140,
        payout: bagSmallPrice == 79 ? 63 : 79,
      ));
    }
    if (bagMediumEnabled) {
      bags.add(BagInfo(
        size: 'medium',
        price: bagMediumPrice,
        category: bagMediumCategory,
        minValue: 250,
        payout: 127,
      ));
    }
    if (bagLargeEnabled) {
      bags.add(BagInfo(
        size: 'large',
        price: bagLargePrice,
        category: bagLargeCategory,
        minValue: 320,
        payout: 159,
      ));
    }
    return bags;
  }
}

class BagInfo {
  final String size;
  final int price;
  final String category;
  final int minValue;
  final int payout;

  BagInfo({
    required this.size,
    required this.price,
    required this.category,
    required this.minValue,
    required this.payout,
  });
}
