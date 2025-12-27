import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../config/theme.dart';
import '../widgets/reveal_text.dart';
import '../widgets/parallax_image.dart';
import '../widgets/section_wrapper.dart';
import '../widgets/custom_button.dart';
import 'onboarding_screen.dart';

/// Home screen - Mobile adaptation of the landing page
class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: CustomScrollView(
        slivers: [
          // App Bar
          SliverAppBar(
            floating: true,
            snap: true,
            backgroundColor: AppTheme.background,
            elevation: 0,
            title: Text(
              'Latebites',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontStyle: FontStyle.italic,
                    letterSpacing: -0.5,
                  ),
            ),
            actions: [
              TextButton(
                onPressed: () {
                  // Scroll to onboard section
                },
                child: Text(
                  'ONBOARD',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: AppTheme.mutedForeground,
                      ),
                ),
              ),
            ],
          ),
          
          // Content
          SliverList(
            delegate: SliverChildListDelegate([
              _buildHeroSection(context),
              _buildProblemSection(context),
              _buildBeliefSection(context),
              _buildWhatWeDoSection(context),
              _buildImpactSection(context),
              _buildVisionSection(context),
              _buildHowWeWorkSection(context),
              _buildFoundersSection(context),
              _buildOnboardingSection(context),
              _buildClosingSection(context),
            ]),
          ),
        ],
      ),
    );
  }
  
  /// 1. HERO SECTION
  Widget _buildHeroSection(BuildContext context) {
    return SectionWrapper(
      fullHeight: true,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'LATEBITES',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    letterSpacing: 5,
                  ),
            )
                .animate()
                .fadeIn(duration: AppTheme.cinematicAnimation)
                .slideY(begin: -0.2, end: 0),
            const SizedBox(height: AppTheme.spacingXl),
            RevealHeading(
              text: 'Surplus is a gift, not a burden.',
              delay: const Duration(milliseconds: 200),
            ),
            const SizedBox(height: AppTheme.spacingLg),
            RevealBody(
              text: 'A manifesto for intentional food rescue.',
              delay: const Duration(milliseconds: 800),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppTheme.spacing3xl),
            Text(
              'SCROLL TO BREATHE',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: AppTheme.mutedForeground.withOpacity(0.4),
                    letterSpacing: 2,
                  ),
            )
                .animate()
                .fadeIn(
                  delay: const Duration(milliseconds: 1500),
                  duration: const Duration(milliseconds: 2000),
                ),
          ],
        ),
      ),
    );
  }
  
  /// 2. THE PROBLEM
  Widget _buildProblemSection(BuildContext context) {
    return SectionWrapper(
      backgroundColor: AppTheme.secondary.withOpacity(0.2),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const RevealHeading(
            text: 'The silent departure.',
            isItalic: true,
          ),
          const SizedBox(height: AppTheme.spacingXl),
          const RevealBody(
            text: 'Every night, in every city, perfectly good food quietly disappears. It\'s not because it lacks value, but because we lack a way to value it in its final hours.',
          ),
          const SizedBox(height: AppTheme.spacingLg),
          Container(
            padding: const EdgeInsets.only(left: AppTheme.spacingMd),
            decoration: const BoxDecoration(
              border: Border(
                left: BorderSide(color: AppTheme.primary, width: 2),
              ),
            ),
            child: const RevealBody(
              text: 'This isn\'t a failure of production. It\'s a failure of presence.',
            ),
          ),
          const SizedBox(height: AppTheme.spacingXl),
          const ParallaxImage(
            imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1074',
            aspectRatio: 4 / 5,
          ),
        ],
      ),
    );
  }
  
  /// 3. OUR BELIEF
  Widget _buildBeliefSection(BuildContext context) {
    return SectionWrapper(
      child: Column(
        children: [
          const RevealHeading(
            text: 'Rescue carries dignity. Discounts carry desperation.',
          ),
          const SizedBox(height: AppTheme.spacing2xl),
          _buildBeliefCard(
            context,
            'Dignity',
            'We respect the craft of every kitchen. Surplus is proof of hard work, not a mistake to be hidden.',
            0,
          ),
          const SizedBox(height: AppTheme.spacingLg),
          _buildBeliefCard(
            context,
            'Transparency',
            'Honesty over hype. We share what is left, exactly as it is, with those who intend to rescue it.',
            1,
          ),
          const SizedBox(height: AppTheme.spacingLg),
          _buildBeliefCard(
            context,
            'Intention',
            'Impact should feel calm. We don\'t rush the process; we enable a meaningful handover.',
            2,
          ),
        ],
      ),
    );
  }
  
  Widget _buildBeliefCard(BuildContext context, String title, String description, int index) {
    return Container(
      padding: const EdgeInsets.all(AppTheme.spacingLg),
      child: Column(
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontStyle: FontStyle.italic,
                  color: AppTheme.primary,
                ),
          )
              .animate()
              .fadeIn(delay: Duration(milliseconds: 200 * index)),
          const SizedBox(height: AppTheme.spacingMd),
          RevealBody(
            text: description,
            textAlign: TextAlign.center,
            delay: Duration(milliseconds: 200 * index + 100),
          ),
        ],
      ),
    );
  }
  
  /// 4. WHAT WE DO
  Widget _buildWhatWeDoSection(BuildContext context) {
    return SectionWrapper(
      backgroundColor: AppTheme.primary,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const ParallaxImage(
            imageUrl: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&q=80&w=687',
            aspectRatio: 4 / 5,
            startGrayscale: false,
          ),
          const SizedBox(height: AppTheme.spacing2xl),
          Text(
            'End-of-day intentionality.',
            style: Theme.of(context).textTheme.displaySmall?.copyWith(
                  color: AppTheme.primaryForeground,
                ),
          ),
          const SizedBox(height: AppTheme.spacingXl),
          _buildWhatWeDoItem('We identify surplus as the kitchen closes.'),
          _buildWhatWeDoItem('We enable local pickup for those who care.'),
          _buildWhatWeDoItem('We ensure nothing goes into the dark.'),
          const SizedBox(height: AppTheme.spacingXl),
          Container(
            padding: const EdgeInsets.only(top: AppTheme.spacingLg),
            decoration: BoxDecoration(
              border: Border(
                top: BorderSide(
                  color: AppTheme.primaryForeground.withOpacity(0.2),
                  width: 1,
                ),
              ),
            ),
            child: Text(
              'PICKUP ONLY. LIMITED QUANTITY. ZERO WASTE.',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: AppTheme.primaryForeground.withOpacity(0.8),
                    letterSpacing: 3,
                  ),
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildWhatWeDoItem(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppTheme.spacingMd),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w300,
          color: AppTheme.primaryForeground,
          height: 1.6,
        ),
      ),
    );
  }
  
  /// 5. OUR IMPACT
  Widget _buildImpactSection(BuildContext context) {
    return SectionWrapper(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const RevealHeading(
            text: 'A shift in breathing.',
            isItalic: true,
          ),
          const SizedBox(height: AppTheme.spacingXl),
          const RevealBody(
            text: 'When we rescue food, we don\'t just save calories. We save the water, the soil, the labor, and the spirit that went into its creation.',
          ),
          const SizedBox(height: AppTheme.spacing2xl),
          _buildImpactCard(
            context,
            'Environmental',
            'Reducing the methane footprint of our cities, one night at a time.',
            'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&q=80&w=1170',
          ),
          const SizedBox(height: AppTheme.spacing2xl),
          _buildImpactCard(
            context,
            'Cultural',
            'Rekindling the Indian value of \'Prasad\'—that food is sacred and never to be wasted.',
            'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1170',
          ),
        ],
      ),
    );
  }
  
  Widget _buildImpactCard(BuildContext context, String label, String text, String imageUrl) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ParallaxImage(
          imageUrl: imageUrl,
          aspectRatio: 1,
        ),
        const SizedBox(height: AppTheme.spacingLg),
        Text(
          label.toUpperCase(),
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: AppTheme.primary,
                fontWeight: FontWeight.bold,
                letterSpacing: 3,
              ),
        ),
        const SizedBox(height: AppTheme.spacingMd),
        Text(
          text,
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w300,
              ),
        ),
      ],
    );
  }
  
  /// 6. OUR VISION
  Widget _buildVisionSection(BuildContext context) {
    return SectionWrapper(
      backgroundColor: AppTheme.secondary.withOpacity(0.1),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const RevealHeading(
            text: 'Cities that breathe together.',
          ),
          const SizedBox(height: AppTheme.spacingXl),
          const RevealBody(
            text: 'We envision a future where consumption is conscious, production is surgical, and waste is a relic of the past. A future where we respect the effort as much as the outcome.',
          ),
          const SizedBox(height: AppTheme.spacingXl),
          Container(
            height: 1,
            color: AppTheme.primary.withOpacity(0.3),
          )
              .animate()
              .scaleX(
                begin: 0,
                end: 1,
                duration: AppTheme.cinematicAnimation,
                alignment: Alignment.centerLeft,
              ),
        ],
      ),
    );
  }
  
  /// 7. HOW WE WORK
  Widget _buildHowWeWorkSection(BuildContext context) {
    return SectionWrapper(
      backgroundColor: AppTheme.secondary.withOpacity(0.1),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const RevealHeading(
            text: 'The mechanics of care.',
          ),
          const SizedBox(height: AppTheme.spacingLg),
          const RevealBody(
            text: 'Intention without execution is just philosophy. Here\'s how we turn care into action.',
          ),
          const SizedBox(height: AppTheme.spacing2xl),
          Text(
            'Three sizes. One promise.',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontStyle: FontStyle.italic,
                ),
          ),
          const SizedBox(height: AppTheme.spacingXl),
          _buildBagCard('Small', 'Perfect for one', '50% off or more', 0),
          const SizedBox(height: AppTheme.spacingMd),
          _buildBagCard('Medium', 'Ideal for two', '50% off or more', 1),
          const SizedBox(height: AppTheme.spacingMd),
          _buildBagCard('Large', 'Made for sharing', '50% off or more', 2),
          const SizedBox(height: AppTheme.spacingXl),
          const RevealBody(
            text: 'Each calibrated to different appetites, different moments. But every bag carries the same guarantee: 50% off or more.',
          ),
        ],
      ),
    );
  }
  
  Widget _buildBagCard(String size, String description, String discount, int index) {
    return Container(
      padding: const EdgeInsets.all(AppTheme.spacingLg),
      decoration: BoxDecoration(
        color: AppTheme.background,
        border: Border.all(color: AppTheme.primary.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    size,
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  Text(
                    description,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: AppTheme.primary.withOpacity(0.2),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppTheme.spacingMd),
          Container(
            height: 1,
            color: AppTheme.primary.withOpacity(0.1),
          ),
          const SizedBox(height: AppTheme.spacingMd),
          Text(
            discount,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: AppTheme.primary,
                  fontWeight: FontWeight.w500,
                ),
          ),
        ],
      ),
    )
        .animate()
        .fadeIn(delay: Duration(milliseconds: 100 * index))
        .slideY(begin: 0.2, end: 0, delay: Duration(milliseconds: 100 * index));
  }
  
  /// 8. FOUNDERS
  Widget _buildFoundersSection(BuildContext context) {
    return SectionWrapper(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const RevealHeading(
            text: 'Rooted in friendship.',
            isItalic: true,
          ),
          const SizedBox(height: AppTheme.spacingLg),
          const RevealBody(
            text: 'Latebites was born in Coimbatore from a shared observation by three friends. We believe technology should serve tradition, and innovation should protect dignity.',
          ),
          const SizedBox(height: AppTheme.spacing2xl),
          _buildFounderCard('Rishab.S', 'Founder', 0),
          const SizedBox(height: AppTheme.spacingLg),
          _buildFounderCard('Nimai Krishna', 'Founder', 1),
          const SizedBox(height: AppTheme.spacingLg),
          _buildFounderCard('Nitishwar Murrgesh', 'Founder', 2),
        ],
      ),
    );
  }
  
  Widget _buildFounderCard(String name, String role, int index) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AspectRatio(
          aspectRatio: 4 / 5,
          child: Container(
            decoration: BoxDecoration(
              color: AppTheme.secondary.withOpacity(0.3),
              border: Border.all(color: AppTheme.primary.withOpacity(0.05)),
            ),
            child: Center(
              child: Text(
                'PHOTO COMING SOON',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppTheme.mutedForeground.withOpacity(0.2),
                      fontStyle: FontStyle.italic,
                      letterSpacing: 3,
                    ),
              ),
            ),
          ),
        ),
        const SizedBox(height: AppTheme.spacingMd),
        Text(
          name,
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        Text(
          role.toUpperCase(),
          style: Theme.of(context).textTheme.labelSmall,
        ),
      ],
    )
        .animate()
        .fadeIn(delay: Duration(milliseconds: 200 * index))
        .slideY(begin: 0.2, end: 0, delay: Duration(milliseconds: 200 * index));
  }
  
  /// 9. ONBOARDING
  Widget _buildOnboardingSection(BuildContext context) {
    return SectionWrapper(
      backgroundColor: AppTheme.secondary.withOpacity(0.2),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const RevealHeading(
            text: 'Join the Latebites movement.',
          ),
          const SizedBox(height: AppTheme.spacingLg),
          const RevealBody(
            text: 'We\'re looking for partner restaurants who value their craft and care about their surplus. Rescue your effort with us in Coimbatore.',
          ),
          const SizedBox(height: AppTheme.spacingXl),
          PremiumButton(
            text: 'Apply to Rescue',
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (context) => const OnboardingScreen(),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
  
  /// 10. CLOSING
  Widget _buildClosingSection(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height,
      color: Colors.black,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'Latebites.',
              style: Theme.of(context).textTheme.displayLarge?.copyWith(
                    color: Colors.white,
                    fontStyle: FontStyle.italic,
                    fontSize: 72,
                  ),
            )
                .animate()
                .fadeIn(duration: AppTheme.cinematicAnimation),
            const SizedBox(height: AppTheme.spacingLg),
            Text(
              'We\'re just getting started.',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: Colors.white.withOpacity(0.6),
                    fontStyle: FontStyle.italic,
                  ),
            )
                .animate()
                .fadeIn(
                  delay: const Duration(milliseconds: 500),
                  duration: AppTheme.cinematicAnimation,
                ),
            const SizedBox(height: AppTheme.spacing2xl),
            Text(
              '© 2024 LATEBITES — COIMBATORE, INDIA',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: Colors.white.withOpacity(0.3),
                    fontSize: 9,
                    letterSpacing: 3,
                  ),
            )
                .animate()
                .fadeIn(
                  delay: const Duration(milliseconds: 1000),
                  duration: const Duration(milliseconds: 2000),
                ),
          ],
        ),
      ),
    );
  }
}
