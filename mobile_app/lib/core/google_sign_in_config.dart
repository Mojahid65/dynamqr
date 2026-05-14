import 'dart:convert';

import 'package:flutter/services.dart';

import 'constants.dart';

/// Resolves the Google OAuth **Web application** client ID for native sign-in.
///
/// Order: compile-time [String.fromEnvironment], [kGoogleWebClientIdOverride],
/// `assets/google_web_client_id.txt`, then `assets/google-services.json`.
class GoogleSignInConfig {
  GoogleSignInConfig._();

  static String _clientId = '';

  static String get clientId => _clientId;

  static Future<void> load() async {
    if (_clientId.isNotEmpty) return;

    const fromEnv = String.fromEnvironment(
      'GOOGLE_WEB_CLIENT_ID',
      defaultValue: '',
    );
    if (fromEnv.trim().isNotEmpty) {
      _clientId = fromEnv.trim();
      return;
    }

    if (kGoogleWebClientIdOverride.trim().isNotEmpty) {
      _clientId = kGoogleWebClientIdOverride.trim();
      return;
    }

    try {
      final raw = await rootBundle.loadString(
        'assets/google_web_client_id.txt',
      );
      for (final line in raw.split(RegExp(r'\r?\n'))) {
        final t = line.trim();
        if (t.isEmpty || t.startsWith('#')) continue;
        if (t.contains('.apps.googleusercontent.com')) {
          _clientId = t;
          return;
        }
      }
    } catch (_) {}

    try {
      final raw = await rootBundle.loadString('assets/google-services.json');
      final parsed = _parseWebClientIdFromFirebaseJson(raw);
      if (parsed != null && parsed.isNotEmpty) {
        _clientId = parsed;
      }
    } catch (_) {}
  }

  static String? _parseWebClientIdFromFirebaseJson(String jsonStr) {
    final dynamic decoded = jsonDecode(jsonStr);
    if (decoded is! Map<String, dynamic>) return null;

    final clients = decoded['client'] as List<dynamic>? ?? [];
    for (final c in clients) {
      if (c is! Map<String, dynamic>) continue;

      final oauth = c['oauth_client'] as List<dynamic>? ?? [];
      for (final o in oauth) {
        if (o is! Map<String, dynamic>) continue;
        if (o['client_type'] == 3) {
          final id = o['client_id'] as String?;
          if (id != null && id.isNotEmpty) return id;
        }
      }

      final services = c['services'] as Map<String, dynamic>?;
      final appinvite = services?['appinvite_service'] as Map<String, dynamic>?;
      final other =
          appinvite?['other_platform_oauth_client'] as List<dynamic>? ?? [];
      for (final o in other) {
        if (o is! Map<String, dynamic>) continue;
        if (o['client_type'] == 3) {
          final id = o['client_id'] as String?;
          if (id != null && id.isNotEmpty) return id;
        }
      }
    }
    return null;
  }
}
