const fs = require('fs');

const mainPath = 'C:/Users/mojah/OneDrive/Desktop/Dynamic qr code maker/mobile_app/lib/main.dart';
const manifestPath = 'C:/Users/mojah/OneDrive/Desktop/Dynamic qr code maker/mobile_app/android/app/src/main/AndroidManifest.xml';

// 1. Patch AndroidManifest.xml
let manifest = fs.readFileSync(manifestPath, 'utf8');
const intentFilter = `            <intent-filter>
                <action android:name="android.intent.action.SEND" />
                <category android:name="android.intent.category.DEFAULT" />
                <data android:mimeType="image/*" />
            </intent-filter>
            <intent-filter android:autoVerify="true">`;

if (!manifest.includes('android.intent.action.SEND')) {
    manifest = manifest.replace('<intent-filter android:autoVerify="true">', intentFilter);
    fs.writeFileSync(manifestPath, manifest, 'utf8');
    console.log('Manifest patched');
}

// 2. Patch main.dart
let main = fs.readFileSync(mainPath, 'utf8');
if (!main.includes("import 'package:receive_sharing_intent/receive_sharing_intent.dart';")) {
    main = main.replace("import 'package:shared_preferences/shared_preferences.dart';", "import 'package:shared_preferences/shared_preferences.dart';\nimport 'package:receive_sharing_intent/receive_sharing_intent.dart';\nimport 'package:mobile_scanner/mobile_scanner.dart';\nimport 'package:url_launcher/url_launcher.dart';");
}

if (!main.includes('final GlobalKey<ScaffoldMessengerState> scaffoldMessengerKey')) {
    main = main.replace('late final GoRouter appRouter;', 'late final GoRouter appRouter;\nfinal GlobalKey<ScaffoldMessengerState> scaffoldMessengerKey = GlobalKey<ScaffoldMessengerState>();');
}

const stateVars = `  late final StreamSubscription<AuthState> _navAuthSub;
  late StreamSubscription _intentDataStreamSubscription;
  final MobileScannerController _scannerController = MobileScannerController();

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
  }`;

if (!main.includes('_intentDataStreamSubscription')) {
    main = main.replace('  late final StreamSubscription<AuthState> _navAuthSub;', stateVars);
}

const initLogic = `    // Handle sharing intents while running
    _intentDataStreamSubscription = ReceiveSharingIntent.instance.getMediaStream().listen((List<SharedMediaFile> value) {
      if (value.isNotEmpty) {
        _handleSharedImage(value.first.path);
      }
    }, onError: (err) {
      debugPrint("getIntentDataStream error: $err");
    });

    // Handle sharing intent on cold start
    ReceiveSharingIntent.instance.getInitialMedia().then((List<SharedMediaFile> value) {
      if (value.isNotEmpty) {
        _handleSharedImage(value.first.path);
      }
      ReceiveSharingIntent.instance.reset();
    });

    // Remove the native splash`;

if (!main.includes('ReceiveSharingIntent.instance')) {
    main = main.replace('    // Remove the native splash', initLogic);
}

const disposeLogic = `  @override
  void dispose() {
    _intentDataStreamSubscription.cancel();
    _scannerController.dispose();
    _navAuthSub.cancel();
    _authRefresh.dispose();
    super.dispose();
  }`;

if (!main.includes('_intentDataStreamSubscription.cancel()')) {
    main = main.replace(`  @override
  void dispose() {
    _navAuthSub.cancel();
    _authRefresh.dispose();
    super.dispose();
  }`, disposeLogic);
}

if (!main.includes('scaffoldMessengerKey: scaffoldMessengerKey,')) {
    main = main.replace('return MaterialApp.router(', 'return MaterialApp.router(\n              scaffoldMessengerKey: scaffoldMessengerKey,');
}

fs.writeFileSync(mainPath, main, 'utf8');
console.log('main.dart patched');
