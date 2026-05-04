import 'dart:io' show Platform;

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:shared_preferences/shared_preferences.dart';

class PermissionsScreen extends StatefulWidget {
  final VoidCallback? onCompleted;

  const PermissionsScreen({super.key, this.onCompleted});

  @override
  State<PermissionsScreen> createState() => _PermissionsScreenState();
}

class _PermissionsScreenState extends State<PermissionsScreen> {
  bool _isLoading = false;

  Future<void> _requestPermissions() async {
    setState(() => _isLoading = true);
    try {
      await Permission.camera.request();
      await _requestMediaPermission();
      await FirebaseMessaging.instance.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );
      await FirebaseMessaging.instance.subscribeToTopic('announcements');

      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('has_completed_permissions', true);
      widget.onCompleted?.call();

      if (mounted) {
        context.go('/login');
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _requestMediaPermission() async {
    if (Platform.isAndroid) {
      final photosStatus = await Permission.photos.status;
      if (!photosStatus.isGranted) {
        await Permission.photos.request();
      }
      final storageStatus = await Permission.storage.status;
      if (!storageStatus.isGranted) {
        await Permission.storage.request();
      }
      return;
    }

    await Permission.photos.request();
  }

  Future<void> _skipForNow() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('has_completed_permissions', true);
    widget.onCompleted?.call();
    if (mounted) {
      context.go('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 480),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Icon(
                    Icons.verified_user_outlined,
                    size: 72,
                    color: isDark ? Colors.indigo.shade200 : Colors.indigo,
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'Enable Permissions',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'Allow permissions to unlock scanning, saving QR images, and important app alerts.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: isDark
                          ? Colors.grey.shade300
                          : Colors.grey.shade700,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 24),
                  _permissionCard(
                    context,
                    icon: Icons.camera_alt_outlined,
                    title: 'Camera',
                    subtitle: 'Scan QR codes quickly.',
                  ),
                  const SizedBox(height: 12),
                  _permissionCard(
                    context,
                    icon: Icons.photo_library_outlined,
                    title: 'Photos & Storage',
                    subtitle: 'Save your generated QR images.',
                  ),
                  const SizedBox(height: 12),
                  _permissionCard(
                    context,
                    icon: Icons.notifications_outlined,
                    title: 'Notifications',
                    subtitle: 'Get important updates and alerts.',
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    height: 52,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _requestPermissions,
                      child: _isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Text('Allow & Continue'),
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: _isLoading ? null : _skipForNow,
                    child: const Text('Skip for now'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _permissionCard(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF171717) : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isDark ? Colors.grey.shade800 : Colors.grey.shade300,
        ),
      ),
      child: Row(
        children: [
          Icon(icon, color: isDark ? Colors.indigo.shade200 : Colors.indigo),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 15,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 13,
                    color: isDark ? Colors.grey.shade400 : Colors.grey.shade700,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
