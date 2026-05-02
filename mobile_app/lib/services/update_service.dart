import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../widgets/update_dialog.dart';

class UpdateService {
  final _supabase = Supabase.instance.client;

  Future<void> checkForUpdates(BuildContext context) async {
    try {
      // Get current app version
      final packageInfo = await PackageInfo.fromPlatform();
      final currentVersionCode = int.tryParse(packageInfo.buildNumber) ?? 1;

      // Fetch latest update from Supabase
      final response = await _supabase
          .from('app_updates')
          .select()
          .order('version_code', ascending: false)
          .limit(1);

      if (response.isNotEmpty) {
        final latestUpdate = response.first;
        final latestVersionCode = latestUpdate['version_code'] as int;

        if (latestVersionCode > currentVersionCode) {
          // Show update dialog
          if (context.mounted) {
            showDialog(
              context: context,
              barrierDismissible: !(latestUpdate['is_mandatory'] as bool),
              builder: (context) => UpdateDialog(
                versionName: latestUpdate['version_name'] as String,
                releaseNotes: latestUpdate['release_notes'] as String,
                updateUrl: latestUpdate['update_url'] as String,
                isMandatory: latestUpdate['is_mandatory'] as bool,
              ),
            );
          }
        }
      }
    } catch (e) {
      debugPrint('Error checking for updates: $e');
      // Fail silently, don't interrupt user experience if check fails
    }
  }

  static Future<void> openUpdateUrl(String urlString) async {
    try {
      final url = Uri.parse(urlString);
      await launchUrl(url, mode: LaunchMode.externalApplication);
    } catch (e) {
      debugPrint('Could not launch $urlString: $e');
    }
  }
}
