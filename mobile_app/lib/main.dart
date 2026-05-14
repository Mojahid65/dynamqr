import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'core/constants.dart';
import 'core/google_sign_in_config.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/create_qr_screen.dart';
import 'screens/edit_qr_screen.dart';
import 'screens/onboarding_screen.dart';
import 'screens/permissions_screen.dart';
import 'screens/qr_fullscreen_screen.dart';
import 'screens/auth_callback_screen.dart';
import 'screens/animated_splash_screen.dart';
import 'screens/main_navigation_screen.dart';
import 'screens/scanner_screen.dart';
import 'package:provider/provider.dart';
import 'providers/theme_provider.dart';
import 'core/notification_service.dart';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint("Handling a background message: ${message.messageId}");
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await GoogleSignInConfig.load();

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
    await NotificationService().showNotification(
      title: notification.title ?? 'DynamQR',
      body: notification.body ?? 'You have a new notification.',
    );
  });

  final notificationSettings = await FirebaseMessaging.instance
      .getNotificationSettings();
  if (notificationSettings.authorizationStatus ==
          AuthorizationStatus.authorized ||
      notificationSettings.authorizationStatus ==
          AuthorizationStatus.provisional) {
    await FirebaseMessaging.instance.subscribeToTopic('announcements');
  }

  await Supabase.initialize(url: supabaseUrl, anonKey: supabaseAnonKey);

  bool isBanned = false;
  try {
    final session = Supabase.instance.client.auth.currentSession;
    if (session != null) {
      final profile = await Supabase.instance.client
          .from('profiles')
          .select('is_banned')
          .eq('id', session.user.id)
          .maybeSingle();
      if (profile != null && profile['is_banned'] == true) {
        isBanned = true;
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
    runApp(
      MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: ThemeData.light(useMaterial3: true),
        darkTheme: ThemeData.dark(useMaterial3: true),
        themeMode: ThemeMode.system,
        home: Scaffold(
          body: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: const [
                Icon(Icons.engineering, size: 80, color: Colors.indigo),
                SizedBox(height: 24),
                Text(
                  'Under Maintenance',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
                SizedBox(height: 16),
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 32.0),
                  child: Text(
                    'We are currently performing scheduled maintenance to improve your experience. Please check back later.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 16),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
    return;
  }

  final prefs = await SharedPreferences.getInstance();
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
  bool _showSplash = true;
  bool _isDeepLinkScan = false;

  @override
  void initState() {
    super.initState();
    _hasCompletedOnboarding = widget.initialHasCompletedOnboarding;
    _hasCompletedPermissions = widget.initialHasCompletedPermissions;
    Future<void>.delayed(const Duration(milliseconds: 2400), () {
      if (mounted) {
        setState(() => _showSplash = false);
      }
    });
  }

  void _handleOnboardingCompleted() {
    if (_hasCompletedOnboarding) return;
    setState(() {
      _hasCompletedOnboarding = true;
    });
  }

  void _handlePermissionsCompleted() {
    if (_hasCompletedPermissions) return;
    setState(() {
      _hasCompletedPermissions = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    final router = GoRouter(
      initialLocation: _hasCompletedOnboarding ? '/' : '/onboarding',
      redirect: (context, state) {
        final session = Supabase.instance.client.auth.currentSession;
        final isGoingToLogin = state.matchedLocation == '/login';
        final isGoingToOnboarding = state.matchedLocation == '/onboarding';
        final isGoingToPermissions = state.matchedLocation == '/permissions';
        final isGoingToScan = state.matchedLocation == '/scan';

        if (isGoingToScan) {
          _isDeepLinkScan = true;
        }

        if (!_hasCompletedOnboarding && !isGoingToOnboarding) {
          return '/onboarding';
        }

        if (_hasCompletedOnboarding && isGoingToOnboarding) {
          return _hasCompletedPermissions ? '/' : '/permissions';
        }

        if (_hasCompletedOnboarding &&
            !_hasCompletedPermissions &&
            !isGoingToPermissions) {
          return '/permissions';
        }

        if (_hasCompletedPermissions && isGoingToPermissions) {
          return session == null ? '/login' : '/';
        }

        if (session == null &&
            !isGoingToLogin &&
            !isGoingToOnboarding &&
            !isGoingToPermissions) {
          return '/login';
        }
        if (session != null && isGoingToLogin) {
          return '/';
        }
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
      ],
    );

    return Consumer<ThemeProvider>(
      builder: (context, themeProvider, child) {
        return MaterialApp.router(
          title: 'Dynamic QR Hub',
          themeMode: themeProvider.themeMode,
          theme: ThemeData(
            colorScheme: ColorScheme.fromSeed(
              seedColor: Colors.indigo,
              brightness: Brightness.light,
            ),
            useMaterial3: true,
            scaffoldBackgroundColor: Colors.grey.shade50,
            textTheme: GoogleFonts.interTextTheme(ThemeData.light().textTheme),
          ),
          darkTheme: ThemeData(
            colorScheme:
                ColorScheme.fromSeed(
                  seedColor: Colors.indigo,
                  brightness: Brightness.dark,
                ).copyWith(
                  surface: Colors.black, // AMOLED dark surface
                  onSurface: Colors.white,
                ),
            scaffoldBackgroundColor: Colors.black, // AMOLED dark scaffold
            cardColor: const Color(
              0xFF121212,
            ), // Slightly lighter for cards to contrast
            useMaterial3: true,
            appBarTheme: const AppBarTheme(
              backgroundColor: Colors.black,
              surfaceTintColor: Colors.black,
            ),
            textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme),
          ),
          routerConfig: router,
          builder: (context, child) {
            return Stack(
              children: [
                if (child != null) child,
                if (_showSplash && !_isDeepLinkScan)
                  const Positioned.fill(child: AnimatedSplashScreen()),
              ],
            );
          },
        );
      },
    );
  }
}
