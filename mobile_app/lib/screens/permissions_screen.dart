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
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _requestMediaPermission() async {
    if (Platform.isAndroid) {
      final photosStatus = await Permission.photos.status;
      if (!photosStatus.isGranted) await Permission.photos.request();
      final storageStatus = await Permission.storage.status;
      if (!storageStatus.isGranted) await Permission.storage.request();
      return;
    }
    await Permission.photos.request();
  }

  Future<void> _skipForNow() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('has_completed_permissions', true);
    widget.onCompleted?.call();
    if (mounted) context.go('/login');
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;

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
                  Center(
                    child: Container(
                      width: 96,
                      height: 96,
                      decoration: BoxDecoration(
                        color: cs.primaryContainer,
                        borderRadius: BorderRadius.circular(28),
                      ),
                      child: Icon(
                        Icons.verified_user_rounded,
                        size: 44,
                        color: cs.onPrimaryContainer,
                      ),
                    ),
                  ),
                  const SizedBox(height: 28),
                  Text(
                    'Enable Permissions',
                    textAlign: TextAlign.center,
                    style: tt.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                      letterSpacing: -0.3,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'Allow permissions to scan QR codes, save images, and receive important alerts.',
                    textAlign: TextAlign.center,
                    style: tt.bodyMedium?.copyWith(
                      color: cs.onSurfaceVariant,
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 28),
                  _PermissionTile(
                    icon: Icons.camera_alt_rounded,
                    title: 'Camera',
                    subtitle: 'Scan QR codes quickly',
                  ),
                  const SizedBox(height: 8),
                  _PermissionTile(
                    icon: Icons.photo_library_rounded,
                    title: 'Photos & Storage',
                    subtitle: 'Save your generated QR images',
                  ),
                  const SizedBox(height: 8),
                  _PermissionTile(
                    icon: Icons.notifications_active_rounded,
                    title: 'Notifications',
                    subtitle: 'Get important updates and alerts',
                  ),
                  const SizedBox(height: 28),
                  SizedBox(
                    height: 52,
                    child: FilledButton(
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
                  Center(
                    child: TextButton(
                      onPressed: _isLoading ? null : _skipForNow,
                      child: const Text('Skip for now'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _PermissionTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;

  const _PermissionTile({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cs.surfaceContainerLow,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: cs.outlineVariant),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: cs.secondaryContainer,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: cs.onSecondaryContainer, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: tt.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: tt.bodySmall?.copyWith(
                    color: cs.onSurfaceVariant,
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
