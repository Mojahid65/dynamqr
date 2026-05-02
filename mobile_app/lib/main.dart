import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'core/constants.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/create_qr_screen.dart';
import 'screens/edit_qr_screen.dart';
import 'screens/onboarding_screen.dart';
import 'screens/qr_fullscreen_screen.dart';
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

  await FirebaseMessaging.instance.requestPermission(
    alert: true,
    announcement: false,
    badge: true,
    carPlay: false,
    criticalAlert: false,
    provisional: false,
    sound: true,
  );

  await FirebaseMessaging.instance.subscribeToTopic('announcements');

  await NotificationService().init();
  
  await Supabase.initialize(
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
  );

  final prefs = await SharedPreferences.getInstance();
  final hasCompletedOnboarding = prefs.getBool('has_completed_onboarding') ?? false;

  runApp(
    ChangeNotifierProvider(
      create: (_) => ThemeProvider(),
      child: MyApp(hasCompletedOnboarding: hasCompletedOnboarding),
    ),
  );
}

class MyApp extends StatelessWidget {
  final bool hasCompletedOnboarding;

  const MyApp({super.key, required this.hasCompletedOnboarding});

  @override
  Widget build(BuildContext context) {
    final router = GoRouter(
      initialLocation: hasCompletedOnboarding ? '/' : '/onboarding',
      redirect: (context, state) {
        final session = Supabase.instance.client.auth.currentSession;
        final isGoingToLogin = state.matchedLocation == '/login';
        final isGoingToOnboarding = state.matchedLocation == '/onboarding';
        
        if (!hasCompletedOnboarding && !isGoingToOnboarding) {
            return '/onboarding';
        }

        if (hasCompletedOnboarding && isGoingToOnboarding) {
            return '/';
        }

        if (session == null && !isGoingToLogin && !isGoingToOnboarding) {
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
          builder: (context, state) => const OnboardingScreen(),
        ),
        GoRoute(
          path: '/',
          builder: (context, state) => const DashboardScreen(),
        ),
        GoRoute(
          path: '/login',
          builder: (context, state) => const LoginScreen(),
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
        textTheme: GoogleFonts.interTextTheme(
          ThemeData.light().textTheme,
        ),
      ),
      darkTheme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.indigo,
          brightness: Brightness.dark,
        ).copyWith(
          surface: Colors.black, // AMOLED dark surface
          onSurface: Colors.white,
        ),
        scaffoldBackgroundColor: Colors.black, // AMOLED dark scaffold
        cardColor: const Color(0xFF121212), // Slightly lighter for cards to contrast
        useMaterial3: true,
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.black,
          surfaceTintColor: Colors.black,
        ),
        textTheme: GoogleFonts.interTextTheme(
          ThemeData.dark().textTheme,
        ),
      ),
      routerConfig: router,
        );
      },
    );
  }
}
