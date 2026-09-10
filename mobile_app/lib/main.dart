import 'package:dynamic_color/dynamic_color.dart';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_native_splash/flutter_native_splash.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:receive_sharing_intent/receive_sharing_intent.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:in_app_review/in_app_review.dart';
import 'core/app_theme.dart';
import 'core/constants.dart';
import 'core/google_auth_service.dart';
import 'core/google_sign_in_config.dart';
import 'screens/login_screen.dart';
import 'screens/create_qr_screen.dart';
import 'screens/create_link_screen.dart';
import 'screens/edit_qr_screen.dart';
import 'screens/onboarding_screen.dart';
import 'screens/permissions_screen.dart';
import 'screens/qr_fullscreen_screen.dart';
import 'screens/auth_callback_screen.dart';
import 'screens/main_navigation_screen.dart';
import 'screens/scanner_screen.dart';
import 'screens/brand_splash_screen.dart';
import 'screens/analytics_screen.dart';
import 'screens/screen_scan_result_screen.dart';
import 'package:provider/provider.dart';
import 'providers/theme_provider.dart';
import 'core/notification_service.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:quick_actions/quick_actions.dart';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

/// App-wide GoRouter instance, exposed so non-widget code (auth services,
/// background tasks) can navigate without needing a BuildContext.
late GoRouter appRouter;

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint('Handling a background message: ${message.messageId}');
}

Future<void> main() async {
  // Hold the native (Android 12+) splash screen until the first frame is
  // ready. We never show a second Flutter-side splash on top of it.
  final widgetsBinding = WidgetsFlutterBinding.ensureInitialized();
  FlutterNativeSplash.preserve(widgetsBinding: widgetsBinding);

  // Edge-to-edge for Material You feel on Android 15+
  SystemChrome.setSystemUIChangeCallback((systemOverlaysAreVisible) async {});
  SystemChrome.setEnabledSystemUIMode(
    SystemUiMode.edgeToEdge,
  );

  await GoogleSignInConfig.load();

  // Initialize the modern Credential Manager-based Google sign-in SDK and
  // attempt a silent (no UI) restore of the user's previously selected
  // Google account in the background. If it succeeds, the auth state
  // change will redirect the router away from the login screen.
  unawaited(_initializeGoogleAuth());

  await Firebase.initializeApp(
    options: const FirebaseOptions(
      apiKey: 'AIzaSyCTodm0VtHRYePLVVX_fWENZv5ZN52K-DM',
      appId: '1:715971039552:android:8e17ce22e292cc6b46eaa5',
      messagingSenderId: '715971039552',
      projectId: 'dynamqr',
      storageBucket: 'dynamqr.firebasestorage.app',
    ),
  );

  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

  await NotificationService().init();
  FirebaseMessaging.onMessage.listen((RemoteMessage message) async {
    final notification = message.notification;
    if (notification == null) return;
    
    String? imageUrl = notification.android?.imageUrl ?? 
                       notification.apple?.imageUrl ?? 
                       message.data['imageUrl'] ?? 
                       message.data['image'];
    String? link = message.data['link'] ?? message.data['url'];
    
    await NotificationService().showNotification(
      title: notification.title ?? 'DynamQR',
      body: notification.body ?? 'You have a new notification.',
      imageUrl: imageUrl,
      link: link,
    );
  });

  // Handle notification tap when the app is in the background
  FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) async {
    String? link = message.data['link'] ?? message.data['url'];
    if (link != null && link.startsWith('http')) {
      final url = Uri.parse(link);
      if (await canLaunchUrl(url)) {
        await launchUrl(url, mode: LaunchMode.externalApplication);
      }
    }
  });

  // Handle notification tap when the app is completely terminated
  final initialMessage = await FirebaseMessaging.instance.getInitialMessage();
  if (initialMessage != null) {
    String? link = initialMessage.data['link'] ?? initialMessage.data['url'];
    if (link != null && link.startsWith('http')) {
      final url = Uri.parse(link);
      if (await canLaunchUrl(url)) {
        await launchUrl(url, mode: LaunchMode.externalApplication);
      }
    }
  }

  unawaited(_subscribeToAnnouncementsIfAuthorized());

  await Supabase.initialize(url: supabaseUrl, anonKey: supabaseAnonKey);

  // Block banned users.
  try {
    final session = Supabase.instance.client.auth.currentSession;
    if (session != null) {
      final profile = await Supabase.instance.client
          .from('profiles')
          .select('is_banned')
          .eq('id', session.user.id)
          .maybeSingle();
      if (profile != null && profile['is_banned'] == true) {
        await Supabase.instance.client.auth.signOut();
      }
    }
  } catch (e) {
    debugPrint('Failed to check ban status: $e');
  }

  bool maintenanceMode = false;
  try {
    final settingsResponse = await Supabase.instance.client
        .from('app_settings')
        .select('maintenance_mode')
        .eq('id', 1)
        .maybeSingle();
    if (settingsResponse != null) {
      maintenanceMode = settingsResponse['maintenance_mode'] as bool? ?? false;
    }
  } catch (e) {
    debugPrint('Failed to load settings: $e');
  }

  if (maintenanceMode) {
    runApp(const _MaintenanceApp());
    // Maintenance mode is also a valid first frame; let the splash go.
    FlutterNativeSplash.remove();
    return;
  }

  final prefs = await SharedPreferences.getInstance();
  
  int appOpens = prefs.getInt('app_opens') ?? 0;
  appOpens++;
  await prefs.setInt('app_opens', appOpens);
  
  if (appOpens == 3 || appOpens == 10) {
    Future.delayed(const Duration(seconds: 3), () async {
      try {
        final InAppReview inAppReview = InAppReview.instance;
        if (await inAppReview.isAvailable()) {
          inAppReview.requestReview();
        }
      } catch (e) {
        debugPrint('Review prompt failed: $e');
      }
    });
  }

  final hasCompletedOnboarding =
      prefs.getBool('has_completed_onboarding') ?? false;
  final hasCompletedPermissions =
      prefs.getBool('has_completed_permissions') ?? false;

  runApp(
    ChangeNotifierProvider(
      create: (_) => ThemeProvider(),
      child: MyApp(
        initialHasCompletedOnboarding: hasCompletedOnboarding,
        initialHasCompletedPermissions: hasCompletedPermissions,
      ),
    ),
  );
}

Future<void> _subscribeToAnnouncementsIfAuthorized() async {
  try {
    final settings =
        await FirebaseMessaging.instance.getNotificationSettings();
    if (settings.authorizationStatus == AuthorizationStatus.authorized ||
        settings.authorizationStatus == AuthorizationStatus.provisional) {
      await FirebaseMessaging.instance.subscribeToTopic('announcements');
    }
  } catch (e) {
    debugPrint('FCM subscribe failed: $e');
  }
}

/// Initialize Google Credential Manager and silently restore the last
/// signed-in Google account, if any. Runs unawaited at startup so it
/// never blocks the first frame.
Future<void> _initializeGoogleAuth() async {
  try {
    await GoogleAuthService.instance.initialize();
    // Only try to silently sign in when there's no Supabase session yet.
    if (Supabase.instance.client.auth.currentSession == null) {
      await GoogleAuthService.instance.attemptAutoSignIn();
    }
  } catch (e) {
    debugPrint('Google auto sign-in setup failed: $e');
  }
}

class _MaintenanceApp extends StatelessWidget {
  const _MaintenanceApp();

  @override
  Widget build(BuildContext context) {
    return DynamicColorBuilder(
      builder: (lightDynamic, darkDynamic) {
        final lightScheme = lightDynamic ??
            ColorScheme.fromSeed(
                seedColor: AppTheme.brandSeed, brightness: Brightness.light);
        final darkScheme = darkDynamic ??
            ColorScheme.fromSeed(
                seedColor: AppTheme.brandSeed, brightness: Brightness.dark);
        return MaterialApp(
          debugShowCheckedModeBanner: false,
          theme: AppTheme.light(lightScheme),
          darkTheme: AppTheme.dark(darkScheme),
          themeMode: ThemeMode.system,
          home: const _MaintenanceScreen(),
        );
      },
    );
  }
}

class _MaintenanceScreen extends StatelessWidget {
  const _MaintenanceScreen();

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: cs.primaryContainer,
                  shape: BoxShape.circle,
                ),
                child: Icon(Icons.engineering_rounded,
                    size: 48, color: cs.onPrimaryContainer),
              ),
              const SizedBox(height: 24),
              Text(
                'Under Maintenance',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(height: 12),
              Text(
                'We are performing scheduled maintenance to improve your experience. Please check back later.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: cs.onSurfaceVariant,
                      height: 1.5,
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class MyApp extends StatefulWidget {
  final bool initialHasCompletedOnboarding;
  final bool initialHasCompletedPermissions;

  const MyApp({
    super.key,
    required this.initialHasCompletedOnboarding,
    required this.initialHasCompletedPermissions,
  });

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  late bool _hasCompletedOnboarding;
  late bool _hasCompletedPermissions;
  bool _splashRemoved = false;
  late final _AuthRefreshNotifier _authRefresh;

  /// Memoized router. Without this we'd rebuild GoRouter on every theme
  /// provider notification, losing in-flight redirect listeners.
  late final GoRouter _router;
  late final StreamSubscription<AuthState> _navAuthSub;
  late StreamSubscription _intentDataStreamSubscription;
  final MobileScannerController _scannerController = MobileScannerController();
  final GlobalKey<ScaffoldMessengerState> scaffoldMessengerKey = GlobalKey<ScaffoldMessengerState>();

  Future<void> _handleSharedImage(String path) async {
    try {
      final capture = await _scannerController.analyzeImage(path);
      if (capture != null && capture.barcodes.isNotEmpty) {
        final String? rawValue = capture.barcodes.first.rawValue;
        if (rawValue != null) {
          final uri = Uri.tryParse(rawValue);
          if (uri != null && (uri.scheme == 'http' || uri.scheme == 'https')) {
            await launchUrl(uri, mode: LaunchMode.externalApplication);
          } else {
             scaffoldMessengerKey.currentState?.showSnackBar(SnackBar(content: Text('Scanned: $rawValue')));
          }
          return;
        }
      }
      scaffoldMessengerKey.currentState?.showSnackBar(
        const SnackBar(content: Text('QR not detected')),
      );
    } catch (e) {
      debugPrint('Error scanning shared image: $e');
    }
  }

  @override
  void initState() {
    super.initState();
    _hasCompletedOnboarding = widget.initialHasCompletedOnboarding;
    _hasCompletedPermissions = widget.initialHasCompletedPermissions;
    _authRefresh = _AuthRefreshNotifier();
    _router = _buildRouter();
    appRouter = _router;

    const quickActions = QuickActions();
    quickActions.initialize((String shortcutType) {
      if (shortcutType == 'scan') {
        appRouter.push('/scan');
      } else if (shortcutType == 'create_link') {
        appRouter.push('/create_link');
      }
    });
    quickActions.setShortcutItems(<ShortcutItem>[
      const ShortcutItem(type: 'scan', localizedTitle: 'Scan QR Code'),
      const ShortcutItem(type: 'create_link', localizedTitle: 'Create Link'),
    ]);

    // Belt-and-suspenders: when Supabase emits a SIGNED_IN event, force
    // navigation off /login. The router's refreshListenable should already
    // do this, but we observed cases where the router was recreated by
    // theme/dynamic-color rebuilds and the listener didn't fire in time.
    _navAuthSub = Supabase.instance.client.auth.onAuthStateChange
        .listen((authState) async {
      if (authState.event == AuthChangeEvent.signedIn ||
          authState.event == AuthChangeEvent.initialSession ||
          authState.event == AuthChangeEvent.tokenRefreshed) {
        
        try {
          final token = await FirebaseMessaging.instance.getToken();
          if (token != null) {
            final session = Supabase.instance.client.auth.currentSession;
            if (session != null) {
              await Supabase.instance.client
                  .from('profiles')
                  .update({'push_token': token})
                  .eq('id', session.user.id);
            }
          }
        } catch (e) {
          debugPrint('Failed to save push token: $e');
        }

        // Defer to the next frame so route state is settled.
        WidgetsBinding.instance.addPostFrameCallback((_) {
          final loc = _router.routerDelegate.currentConfiguration.uri.path;
          if (loc == '/login' || loc == '/auth/callback') {
            _router.go('/');
          }
        });
      }
    });

    // Handle sharing intents while running
    _intentDataStreamSubscription = ReceiveSharingIntent.getMediaStream().listen((List<SharedMediaFile> value) {
      if (value.isNotEmpty) {
        _handleSharedImage(value.first.path);
      }
    }, onError: (err) {
      debugPrint("getIntentDataStream error: $err");
    });

    // Handle sharing intent on cold start
    ReceiveSharingIntent.getInitialMedia().then((List<SharedMediaFile> value) {
      if (value.isNotEmpty) {
        _handleSharedImage(value.first.path);
      }
      ReceiveSharingIntent.reset();
    });

    // Remove the native splash as soon as the first frame is rendered.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_splashRemoved) {
        FlutterNativeSplash.remove();
        _splashRemoved = true;
      }
    });

    FirebaseMessaging.instance.onTokenRefresh.listen((token) async {
      try {
        final session = Supabase.instance.client.auth.currentSession;
        if (session != null) {
          await Supabase.instance.client
              .from('profiles')
              .update({'push_token': token})
              .eq('id', session.user.id);
        }
      } catch (e) {
        debugPrint('Failed to refresh push token: $e');
      }
    });
  }

  @override
  void dispose() {
    _intentDataStreamSubscription.cancel();
    _scannerController.dispose();
    _navAuthSub.cancel();
    _authRefresh.dispose();
    super.dispose();
  }

  void _handleOnboardingCompleted() {
    if (_hasCompletedOnboarding) return;
    setState(() => _hasCompletedOnboarding = true);
  }

  void _handlePermissionsCompleted() {
    if (_hasCompletedPermissions) return;
    setState(() => _hasCompletedPermissions = true);
  }

  GoRouter _buildRouter() {
    return GoRouter(
      initialLocation: _hasCompletedOnboarding ? '/' : '/onboarding',
      // Re-evaluate redirects whenever Supabase auth state changes.
      refreshListenable: _authRefresh,
      redirect: (context, state) {
        final session = Supabase.instance.client.auth.currentSession;
        final loc = state.matchedLocation;
        final goingToLogin = loc == '/login';
        final goingToOnboarding = loc == '/onboarding';
        final goingToPermissions = loc == '/permissions';

        if (!_hasCompletedOnboarding && !goingToOnboarding) {
          return '/onboarding';
        }
        if (_hasCompletedOnboarding && goingToOnboarding) {
          return _hasCompletedPermissions ? '/' : '/permissions';
        }
        if (_hasCompletedOnboarding &&
            !_hasCompletedPermissions &&
            !goingToPermissions) {
          return '/permissions';
        }
        if (_hasCompletedPermissions && goingToPermissions) {
          return session == null ? '/login' : '/';
        }
        if (session == null &&
            !goingToLogin &&
            !goingToOnboarding &&
            !goingToPermissions) {
          return '/login';
        }
        if (session != null && goingToLogin) return '/';
        return null;
      },
      routes: [
        GoRoute(
          path: '/onboarding',
          builder: (context, state) =>
              OnboardingScreen(onCompleted: _handleOnboardingCompleted),
        ),
        GoRoute(
          path: '/permissions',
          builder: (context, state) =>
              PermissionsScreen(onCompleted: _handlePermissionsCompleted),
        ),
        GoRoute(
          path: '/',
          builder: (context, state) => const MainNavigationScreen(),
        ),
        GoRoute(
          path: '/scan',
          builder: (context, state) => const ScannerScreen(),
        ),
        GoRoute(
          path: '/login',
          builder: (context, state) => const LoginScreen(),
        ),
        GoRoute(
          path: '/auth/callback',
          builder: (context, state) => const AuthCallbackScreen(),
        ),
        GoRoute(
          path: '/create',
          builder: (context, state) => const CreateQrScreen(),
        ),
        GoRoute(
          path: '/create_link',
          builder: (context, state) => const CreateLinkScreen(),
        ),
        GoRoute(
          path: '/edit',
          builder: (context, state) {
            final qrData = state.extra as Map<String, dynamic>;
            return EditQrScreen(qrData: qrData);
          },
        ),
        GoRoute(
          path: '/qr_fullscreen',
          builder: (context, state) {
            final args = state.extra as Map<String, dynamic>;
            return QrFullscreenScreen(
              qrData: args['qrData'],
              shortUrl: args['shortUrl'],
              selectedTheme: args['selectedTheme'],
              selectedColor: args['selectedColor'],
              selectedEyeColor: args['selectedEyeColor'],
            );
          },
        ),
        GoRoute(
          path: '/analytics',
          builder: (context, state) {
            final qrData = state.extra as Map<String, dynamic>;
            return AnalyticsScreen(qrData: qrData);
          },
        ),
        GoRoute(
          path: '/screen_scan_result',
          builder: (context, state) {
            final imagePath = state.uri.queryParameters['imagePath'] ?? '';
            final data = state.uri.queryParameters['data'] ?? '';
            return ScreenScanResultScreen(imagePath: imagePath, qrData: data);
          },
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<ThemeProvider>(
      builder: (context, themeProvider, _) {
        return DynamicColorBuilder(
          builder: (lightDynamic, darkDynamic) {
            final lightScheme = lightDynamic?.harmonized() ??
                ColorScheme.fromSeed(
                  seedColor: AppTheme.brandSeed,
                  brightness: Brightness.light,
                );
            final darkScheme = darkDynamic?.harmonized() ??
                ColorScheme.fromSeed(
                  seedColor: AppTheme.brandSeed,
                  brightness: Brightness.dark,
                );

            return MaterialApp.router(
              scaffoldMessengerKey: scaffoldMessengerKey,
              title: 'DynamQR',
              debugShowCheckedModeBanner: false,
              themeMode: themeProvider.themeMode,
              theme: AppTheme.light(lightScheme),
              darkTheme: AppTheme.dark(darkScheme),
              themeAnimationDuration: const Duration(milliseconds: 480),
              themeAnimationCurve: Curves.easeOutCubic,
              routerConfig: _router,
              builder: (context, child) {
                if (child == null) return const SizedBox.shrink();
                return _OneShotBrandSplashOverlay(child: child);
              },
            );
          },
        );
      },
    );
  }
}

class _OneShotBrandSplashOverlay extends StatefulWidget {
  final Widget child;

  const _OneShotBrandSplashOverlay({required this.child});

  @override
  State<_OneShotBrandSplashOverlay> createState() =>
      _OneShotBrandSplashOverlayState();
}

class _OneShotBrandSplashOverlayState
    extends State<_OneShotBrandSplashOverlay> {
  static bool _alreadyShown = false;

  late final bool _showSplash;

  @override
  void initState() {
    super.initState();
    _showSplash = !_alreadyShown;
    _alreadyShown = true;
  }

  @override
  Widget build(BuildContext context) {
    if (!_showSplash) return widget.child;
    return BrandSplashScreen(destination: widget.child);
  }
}

class _AuthRefreshNotifier extends ChangeNotifier {
  late final StreamSubscription<AuthState> _sub;

  _AuthRefreshNotifier() {
    _sub = Supabase.instance.client.auth.onAuthStateChange.listen((_) {
      notifyListeners();
    });
  }

  @override
  void dispose() {
    _sub.cancel();
    super.dispose();
  }
}
