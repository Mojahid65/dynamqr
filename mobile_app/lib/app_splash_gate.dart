import 'package:flutter/material.dart';

import 'screens/animated_splash_screen.dart';

/// Shows [AnimatedSplashScreen] for at least [minDisplay] before building [child].
class AppSplashGate extends StatefulWidget {
  const AppSplashGate({
    super.key,
    required this.child,
    this.minDisplay = const Duration(milliseconds: 2200),
  });

  final Widget child;
  final Duration minDisplay;

  @override
  State<AppSplashGate> createState() => _AppSplashGateState();
}

class _AppSplashGateState extends State<AppSplashGate> {
  bool _showSplash = true;

  @override
  void initState() {
    super.initState();
    Future<void>.delayed(widget.minDisplay, () {
      if (mounted) setState(() => _showSplash = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    final mediaQuery = MediaQuery.maybeOf(context);

    return Stack(
      children: [
        widget.child,
        if (_showSplash)
          Positioned.fill(
            child: MediaQuery(
              data: mediaQuery ?? MediaQueryData.fromView(View.of(context)),
              child: const Directionality(
                textDirection: TextDirection.ltr,
                child: AnimatedSplashScreen(),
              ),
            ),
          ),
      ],
    );
  }
}
