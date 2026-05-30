import 'package:flutter/material.dart';

/// Branded splash shown briefly after the native Android splash hands off.
///
/// The native (Android 12+) SplashScreen API displays the launcher icon on
/// top of the OS-themed background. Once Flutter's first frame is up, the
/// native splash is removed and this branded widget continues the brand
/// identity for ~1.4 s before fading into the destination screen.
///
/// We keep the brand mark and the "MOJAHIDX" parent-company tag so the
/// transition feels intentional rather than an extra loading step.
class BrandSplashScreen extends StatefulWidget {
  /// The screen to fade into once the splash animation finishes.
  final Widget destination;

  /// Total time the splash is visible before the cross-fade starts.
  final Duration holdDuration;

  const BrandSplashScreen({
    super.key,
    required this.destination,
    this.holdDuration = const Duration(milliseconds: 1400),
  });

  @override
  State<BrandSplashScreen> createState() => _BrandSplashScreenState();
}

class _BrandSplashScreenState extends State<BrandSplashScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _intro;
  late final Animation<double> _logoScale;
  late final Animation<double> _logoFade;
  late final Animation<double> _wordmarkFade;
  late final Animation<double> _wordmarkSlide;
  late final Animation<double> _tagFade;

  bool _showDestination = false;

  @override
  void initState() {
    super.initState();
    _intro = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1100),
    );

    // Logo: scale + fade in
    _logoScale = Tween<double>(begin: 0.78, end: 1.0).animate(
      CurvedAnimation(
        parent: _intro,
        curve: const Interval(0.0, 0.55, curve: Curves.easeOutCubic),
      ),
    );
    _logoFade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _intro,
        curve: const Interval(0.0, 0.45, curve: Curves.easeOut),
      ),
    );

    // Wordmark: slide up + fade
    _wordmarkFade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _intro,
        curve: const Interval(0.35, 0.75, curve: Curves.easeOut),
      ),
    );
    _wordmarkSlide = Tween<double>(begin: 12.0, end: 0.0).animate(
      CurvedAnimation(
        parent: _intro,
        curve: const Interval(0.35, 0.75, curve: Curves.easeOutCubic),
      ),
    );

    // "from MOJAHIDX" tagline
    _tagFade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _intro,
        curve: const Interval(0.6, 1.0, curve: Curves.easeOut),
      ),
    );

    _intro.forward();

    Future.delayed(widget.holdDuration, () {
      if (mounted) setState(() => _showDestination = true);
    });
  }

  @override
  void dispose() {
    _intro.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 420),
      switchInCurve: Curves.easeOutCubic,
      switchOutCurve: Curves.easeInCubic,
      child: _showDestination
          ? KeyedSubtree(
              key: const ValueKey('destination'),
              child: widget.destination,
            )
          : Scaffold(
              key: const ValueKey('brand_splash'),
              backgroundColor: isDark ? Colors.black : cs.surface,
              body: SafeArea(
                child: AnimatedBuilder(
                  animation: _intro,
                  builder: (context, _) {
                    return Stack(
                      children: [
                        // Subtle radial accent in light mode for depth.
                        if (!isDark)
                          Positioned.fill(
                            child: DecoratedBox(
                              decoration: BoxDecoration(
                                gradient: RadialGradient(
                                  center: Alignment.center,
                                  radius: 1.1,
                                  colors: [
                                    cs.primaryContainer
                                        .withValues(alpha: 0.35),
                                    cs.surface,
                                  ],
                                  stops: const [0.0, 0.85],
                                ),
                              ),
                            ),
                          ),
                        Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Spacer(),
                              // Logo
                              Opacity(
                                opacity: _logoFade.value,
                                child: Transform.scale(
                                  scale: _logoScale.value,
                                  child: _LogoMark(
                                    color: cs.primary,
                                    onColor: cs.onPrimary,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 28),
                              // Wordmark
                              Opacity(
                                opacity: _wordmarkFade.value,
                                child: Transform.translate(
                                  offset: Offset(0, _wordmarkSlide.value),
                                  child: Text(
                                    'DynamQR',
                                    style: tt.headlineMedium?.copyWith(
                                      fontWeight: FontWeight.w700,
                                      letterSpacing: -0.6,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 8),
                              Opacity(
                                opacity: _wordmarkFade.value,
                                child: Text(
                                  'Dynamic QR codes for modern brands',
                                  style: tt.bodyMedium?.copyWith(
                                    color: cs.onSurfaceVariant,
                                  ),
                                ),
                              ),
                              const Spacer(),
                              // Parent-company tag
                              Opacity(
                                opacity: _tagFade.value,
                                child: Padding(
                                  padding:
                                      const EdgeInsets.only(bottom: 36.0),
                                  child: Column(
                                    children: [
                                      Container(
                                        height: 3,
                                        width: 28,
                                        decoration: BoxDecoration(
                                          color: cs.primary,
                                          borderRadius:
                                              BorderRadius.circular(2),
                                        ),
                                      ),
                                      const SizedBox(height: 12),
                                      Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.center,
                                        crossAxisAlignment:
                                            CrossAxisAlignment.center,
                                        children: [
                                          Text(
                                            'an',
                                            style: tt.bodySmall?.copyWith(
                                              color: cs.onSurfaceVariant,
                                              letterSpacing: 1.5,
                                            ),
                                          ),
                                          const SizedBox(width: 6),
                                          Text(
                                            'MOJAHIDX',
                                            style: tt.titleSmall?.copyWith(
                                              fontWeight: FontWeight.w800,
                                              letterSpacing: 3.0,
                                              color: cs.onSurface,
                                            ),
                                          ),
                                          const SizedBox(width: 6),
                                          Text(
                                            'product',
                                            style: tt.bodySmall?.copyWith(
                                              color: cs.onSurfaceVariant,
                                              letterSpacing: 1.5,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    );
                  },
                ),
              ),
            ),
    );
  }
}

class _LogoMark extends StatelessWidget {
  final Color color;
  final Color onColor;

  const _LogoMark({required this.color, required this.onColor});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 96,
      height: 96,
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.35),
            blurRadius: 32,
            offset: const Offset(0, 16),
          ),
        ],
      ),
      child: Icon(
        Icons.qr_code_2_rounded,
        size: 50,
        color: onColor,
      ),
    );
  }
}
