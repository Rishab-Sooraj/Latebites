import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/theme.dart';
import '../providers/location_provider.dart';
import '../services/location_service.dart';
import 'bag_detail_screen.dart';

/// Customer home screen - Browse nearby restaurants and rescue bags
class CustomerHomeScreen extends ConsumerStatefulWidget {
  const CustomerHomeScreen({super.key});
  
  @override
  ConsumerState<CustomerHomeScreen> createState() => _CustomerHomeScreenState();
}

class _CustomerHomeScreenState extends ConsumerState<CustomerHomeScreen> {
  List<Map<String, dynamic>> _restaurants = [];
  List<Map<String, dynamic>> _rescueBags = [];
  bool _isLoading = true;
  String? _error;
  
  @override
  void initState() {
    super.initState();
    _loadData();
  }
  
  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    
    try {
      // Get user location
      final locationState = ref.read(locationProvider);
      
      // Fetch approved restaurants
      final restaurantsResponse = await Supabase.instance.client
          .from('restaurants')
          .select('*')
          .eq('status', 'approved');
      
      // Fetch active rescue bags with restaurant info
      final bagsResponse = await Supabase.instance.client
          .from('rescue_bags')
          .select('''
            *,
            restaurants!inner (
              id,
              name,
              address_line1,
              city,
              latitude,
              longitude,
              is_active,
              verified
            )
          ''')
          .eq('is_active', true)
          .gt('quantity_available', 0)
          .gte('available_date', DateTime.now().toIso8601String().split('T')[0]);
      
      // Calculate distances if location available
      if (locationState.position != null) {
        for (var bag in bagsResponse) {
          if (bag['restaurants'] != null) {
            final restaurant = bag['restaurants'];
            if (restaurant['latitude'] != null && restaurant['longitude'] != null) {
              final distance = LocationService.calculateDistance(
                startLat: locationState.position!.latitude,
                startLng: locationState.position!.longitude,
                endLat: double.parse(restaurant['latitude'].toString()),
                endLng: double.parse(restaurant['longitude'].toString()),
              );
              bag['distance'] = distance;
            }
          }
        }
        
        // Sort by distance
        bagsResponse.sort((a, b) {
          final distA = a['distance'] ?? 999999;
          final distB = b['distance'] ?? 999999;
          return distA.compareTo(distB);
        });
      }
      
      setState(() {
        _restaurants = List<Map<String, dynamic>>.from(restaurantsResponse);
        _rescueBags = List<Map<String, dynamic>>.from(bagsResponse);
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
    final locationState = ref.watch(locationProvider);
    
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: CustomScrollView(
        slivers: [
          // App Bar
          SliverAppBar(
            floating: true,
            backgroundColor: AppTheme.background,
            elevation: 0,
            title: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'LateBites',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontStyle: FontStyle.italic,
                  ),
                ),
                if (locationState.address != null)
                  Text(
                    locationState.address!.split(',').first,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppTheme.mutedForeground,
                    ),
                  ),
              ],
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.location_on_outlined),
                onPressed: () {
                  ref.read(locationProvider.notifier).getCurrentLocation();
                },
              ),
              IconButton(
                icon: const Icon(Icons.person_outline),
                onPressed: () {
                  // TODO: Navigate to profile
                },
              ),
            ],
          ),
          
          // Content
          if (_isLoading)
            const SliverFillRemaining(
              child: Center(
                child: CircularProgressIndicator(color: AppTheme.orange),
              ),
            )
          else if (_error != null)
            SliverFillRemaining(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.error_outline,
                      size: 64,
                      color: AppTheme.error,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Error loading data',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _error!,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppTheme.mutedForeground,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: _loadData,
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            )
          else if (_rescueBags.isEmpty)
            SliverFillRemaining(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.shopping_bag_outlined,
                      size: 64,
                      color: AppTheme.mutedForeground,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'No rescue bags available',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Check back later for fresh surplus!',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppTheme.mutedForeground,
                      ),
                    ),
                  ],
                ),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.all(16),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final bag = _rescueBags[index];
                    return _buildRescueBagCard(bag, index);
                  },
                  childCount: _rescueBags.length,
                ),
              ),
            ),
        ],
      ),
    );
  }
  
  Widget _buildRescueBagCard(Map<String, dynamic> bag, int index) {
    final restaurant = bag['restaurants'];
    final size = bag['size'] as String;
    final originalPrice = bag['original_price'];
    final discountedPrice = bag['discounted_price'];
    final quantityAvailable = bag['quantity_available'];
    final title = bag['title'] ?? 'Rescue Bag';
    final distance = bag['distance'];
    final pickupDate = DateTime.parse(bag['available_date']);
    final pickupStartTime = bag['pickup_start_time'];
    final pickupEndTime = bag['pickup_end_time'];
    
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.borderLight),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () async {
            final result = await Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => BagDetailScreen(bag: bag),
              ),
            );
            
            // Reload if booking was successful
            if (result == true) {
              _loadData();
            }
          },
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Restaurant Name & Distance
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        restaurant['name'],
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    if (distance != null)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryLight,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.location_on,
                              size: 14,
                              color: AppTheme.primary,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              LocationService.formatDistance(distance),
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                                color: AppTheme.primary,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
                
                const SizedBox(height: 4),
                
                // Address
                Text(
                  restaurant['address_line1'],
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppTheme.mutedForeground,
                  ),
                ),
                
                const SizedBox(height: 8),
                
                // Title
                Text(
                  title,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                ),
                
                const SizedBox(height: 16),
                
                // Bag Details
                Row(
                  children: [
                    // Size Badge
                    _buildBadge(
                      icon: Icons.shopping_bag_outlined,
                      label: '${size[0].toUpperCase()}${size.substring(1)}',
                      color: AppTheme.orange,
                      bgColor: AppTheme.orangeLight,
                    ),
                    
                    const SizedBox(width: 12),
                    
                    // Quantity Badge
                    _buildBadge(
                      icon: Icons.inventory_2_outlined,
                      label: '$quantityAvailable left',
                      color: quantityAvailable <= 3 ? AppTheme.error : AppTheme.primary,
                      bgColor: quantityAvailable <= 3 
                          ? AppTheme.error.withOpacity(0.1)
                          : AppTheme.primaryLight,
                    ),
                  ],
                ),
                
                const SizedBox(height: 16),
                
                // Price & Value
                Row(
                  children: [
                    // Price
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'PRICE',
                          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            color: AppTheme.mutedForeground,
                            letterSpacing: 1.2,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '₹${discountedPrice.toStringAsFixed(0)}',
                          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            color: AppTheme.orange,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    
                    const SizedBox(width: 32),
                    
                    // Original Value
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'WORTH',
                          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            color: AppTheme.mutedForeground,
                            letterSpacing: 1.2,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '₹${originalPrice.toStringAsFixed(0)}',
                          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            color: AppTheme.primary,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    
                    const Spacer(),
                    
                    // Savings Badge
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: AppTheme.success.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '${((1 - discountedPrice / originalPrice) * 100).toStringAsFixed(0)}% OFF',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.success,
                        ),
                      ),
                    ),
                  ],
                ),
                
                const SizedBox(height: 16),
                
                // Pickup Window
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.muted,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.access_time,
                        size: 16,
                        color: AppTheme.foreground,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Pickup: $pickupStartTime - $pickupEndTime',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),

              ],
            ),
          ),
        ),
      ),
    )
        .animate()
        .fadeIn(
          delay: Duration(milliseconds: index * 100),
          duration: AppTheme.slowAnimation,
        )
        .slideY(begin: 0.2, end: 0);
  }
  
  Widget _buildBadge({
    required IconData icon,
    required String label,
    required Color color,
    required Color bgColor,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: color,
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
