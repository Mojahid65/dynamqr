const fs = require('fs');
const pathMain = 'C:/Users/mojah/OneDrive/Desktop/Dynamic qr code maker/mobile_app/lib/main.dart';
const pathDashboard = 'C:/Users/mojah/OneDrive/Desktop/Dynamic qr code maker/mobile_app/lib/screens/dashboard_screen.dart';

// --- Update main.dart ---
let mainContent = fs.readFileSync(pathMain, 'utf8');

// Add import
if (!mainContent.includes("import 'package:in_app_review/in_app_review.dart';")) {
    mainContent = mainContent.replace(
        "import 'package:shared_preferences/shared_preferences.dart';",
        "import 'package:shared_preferences/shared_preferences.dart';\nimport 'package:in_app_review/in_app_review.dart';"
    );
}

// Add logic
const prefsLogicOld = `  final prefs = await SharedPreferences.getInstance();
  final hasCompletedOnboarding =`;

const prefsLogicNew = `  final prefs = await SharedPreferences.getInstance();
  
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

  final hasCompletedOnboarding =`;

if (mainContent.includes(prefsLogicOld)) {
    mainContent = mainContent.replace(prefsLogicOld, prefsLogicNew);
    fs.writeFileSync(pathMain, mainContent, 'utf8');
    console.log('main.dart updated');
} else {
    console.log('Could not find prefsLogic in main.dart');
}

// --- Update dashboard_screen.dart ---
let dashContent = fs.readFileSync(pathDashboard, 'utf8');

if (!dashContent.includes("import 'package:in_app_review/in_app_review.dart';")) {
    dashContent = dashContent.replace(
        "import 'package:share_plus/share_plus.dart';",
        "import 'package:share_plus/share_plus.dart';\nimport 'package:in_app_review/in_app_review.dart';"
    );
}

const oldShareBlock = `            _DrawerTile(
              icon: Icons.share_outlined,
              label: 'Share App',
              onTap: () {
                Navigator.pop(context);
                SharePlus.instance.share(ShareParams(
                  text:
                      'Check out DynamQR, the smartest way to manage dynamic QR codes! https://dynamqr.vercel.app',
                ));
              },
            ),`;

const newShareBlock = `            _DrawerTile(
              icon: Icons.share_outlined,
              label: 'Share App',
              onTap: () {
                Navigator.pop(context);
                SharePlus.instance.share(ShareParams(
                  text:
                      'Check out DynamQR, the smartest way to manage dynamic QR codes! Download here: https://play.google.com/store/apps/details?id=com.dynamqr.mojahidx.in',
                ));
              },
            ),
            _DrawerTile(
              icon: Icons.star_rate_rounded,
              label: 'Rate Us',
              onTap: () {
                Navigator.pop(context);
                InAppReview.instance.openStoreListing(appStoreId: 'com.dynamqr.mojahidx.in');
              },
            ),`;

if (dashContent.includes(oldShareBlock)) {
    dashContent = dashContent.replace(oldShareBlock, newShareBlock);
    fs.writeFileSync(pathDashboard, dashContent, 'utf8');
    console.log('dashboard_screen.dart updated');
} else {
    console.log('Could not find share block in dashboard_screen.dart');
}
