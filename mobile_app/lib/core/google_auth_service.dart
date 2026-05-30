import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'google_sign_in_config.dart';

/// Wraps `google_sign_in` v7 (Credential Manager based) and bridges it to
/// Supabase auth.
///
/// Design notes
/// ------------
/// * Both [signInExplicit] and [attemptAutoSignIn] are *imperative* — they
///   await the full Google → Supabase exchange and return the resulting
///   [Session]. The caller can navigate as soon as the future completes.
/// * We do NOT rely on the v7 `authenticationEvents` stream to drive token
///   exchange anymore. The stream is informational (we use it only to keep
///   [lastAccount] in sync); the previous version waited on it and got
///   stuck whenever scope authorization was non-interactive on the first
///   sign-in.
/// * `authorizationForScopes` is non-interactive and returns null when the
///   user has not yet authorized scopes for this app. We fall back to the
///   interactive `authorizeScopes` so the very first Google login still
///   produces an access token (and a Supabase session).
class GoogleAuthService {
  GoogleAuthService._();

  static final GoogleAuthService instance = GoogleAuthService._();

  static const _scopes = <String>['email', 'profile', 'openid'];

  bool _initialized = false;
  StreamSubscription<GoogleSignInAuthenticationEvent>? _eventSub;
  GoogleSignInAccount? _lastAccount;
  final _signInController = StreamController<Session>.broadcast();

  /// Emits whenever a sign-in flow ends with a valid Supabase session.
  /// Useful for screens that want to react to a *silent* sign-in completed
  /// in the background (e.g. while the splash is showing).
  Stream<Session> get signInStream => _signInController.stream;

  /// The most recent Google account observed (silent or explicit).
  GoogleSignInAccount? get lastAccount => _lastAccount;

  /// Initialize the SDK once. Safe to call multiple times.
  Future<void> initialize() async {
    if (_initialized) return;

    final webClientId = GoogleSignInConfig.clientId.trim();

    try {
      if (webClientId.isNotEmpty) {
        await GoogleSignIn.instance.initialize(serverClientId: webClientId);
      } else {
        await GoogleSignIn.instance.initialize();
      }
    } catch (e) {
      debugPrint('GoogleSignIn.initialize failed: $e');
      rethrow;
    }

    // Keep `lastAccount` in sync but don't perform token exchange here —
    // the imperative methods handle that themselves.
    _eventSub = GoogleSignIn.instance.authenticationEvents.listen(
      (event) {
        switch (event) {
          case GoogleSignInAuthenticationEventSignIn():
            _lastAccount = event.user;
          case GoogleSignInAuthenticationEventSignOut():
            _lastAccount = null;
        }
      },
      onError: (Object e) {
        debugPrint('Google authenticationEvents error: $e');
      },
    );

    _initialized = true;
  }

  /// Try to silently re-sign-in with whichever Google account the user
  /// previously chose on this device. Returns the Supabase [Session] when
  /// it succeeds, or `null` if no credential is available / the user
  /// hasn't signed in to this app before.
  ///
  /// No UI is shown.
  Future<Session?> attemptAutoSignIn() async {
    await initialize();
    try {
      final account =
          await GoogleSignIn.instance.attemptLightweightAuthentication();
      if (account == null) return null;
      _lastAccount = account;
      // Lightweight auth path: stay silent. Don't pop interactive scope
      // dialogs, since the whole point of this code path is "no UI".
      return await _exchangeTokensWithSupabase(
        account,
        allowInteractiveAuthorization: false,
      );
    } on GoogleSignInException catch (e) {
      debugPrint('Lightweight auth failed (${e.code}): ${e.description}');
      return null;
    } catch (e) {
      debugPrint('Lightweight auth error: $e');
      return null;
    }
  }

  /// Show the system Credential Manager bottom sheet, then exchange the
  /// resulting Google identity for a Supabase session. Returns the
  /// session on success or throws on cancel / failure.
  Future<Session> signInExplicit() async {
    await initialize();
    final account = await GoogleSignIn.instance.authenticate();
    _lastAccount = account;
    final session = await _exchangeTokensWithSupabase(
      account,
      // Explicit flow: it's fine to pop the scope-consent dialog if needed.
      allowInteractiveAuthorization: true,
    );
    if (session == null) {
      throw const AuthException(
        'Could not establish a Supabase session from Google credentials.',
      );
    }
    return session;
  }

  /// Sign out from Google AND Supabase. We disconnect from Google so the
  /// next attempt forces a chooser instead of silently restoring the
  /// previous account.
  Future<void> signOut({required SupabaseClient supabase}) async {
    try {
      await GoogleSignIn.instance.disconnect();
    } catch (e) {
      debugPrint('Google disconnect failed: $e');
    }
    try {
      await supabase.auth.signOut();
    } catch (e) {
      debugPrint('Supabase signOut failed: $e');
    }
    _lastAccount = null;
  }

  Future<Session?> _exchangeTokensWithSupabase(
    GoogleSignInAccount user, {
    required bool allowInteractiveAuthorization,
  }) async {
    try {
      final googleAuth = user.authentication;
      final idToken = googleAuth.idToken;
      if (idToken == null) {
        debugPrint('Google idToken was null — cannot sign in to Supabase.');
        return null;
      }

      // Try the non-interactive read first. On a fresh sign-in this often
      // returns null because the user hasn't authorized scopes yet.
      var authorization =
          await user.authorizationClient.authorizationForScopes(_scopes);

      if (authorization == null && allowInteractiveAuthorization) {
        try {
          authorization =
              await user.authorizationClient.authorizeScopes(_scopes);
        } on GoogleSignInException catch (e) {
          debugPrint('authorizeScopes failed: ${e.code} ${e.description}');
        } catch (e) {
          debugPrint('authorizeScopes error: $e');
        }
      }

      final accessToken = authorization?.accessToken;

      // Supabase only requires the idToken for the Google provider; the
      // accessToken is optional. So we proceed even when scope
      // authorization couldn't be obtained.
      final response = await Supabase.instance.client.auth.signInWithIdToken(
        provider: OAuthProvider.google,
        idToken: idToken,
        accessToken: accessToken,
      );

      Session? session = response.session ??
          Supabase.instance.client.auth.currentSession;
      // Wait briefly for the client-side session to settle.
      for (int i = 0; i < 30 && session == null; i++) {
        await Future.delayed(const Duration(milliseconds: 100));
        session = Supabase.instance.client.auth.currentSession;
      }
      if (session != null) {
        _signInController.add(session);
      }
      return session;
    } catch (e) {
      debugPrint('Supabase Google token exchange failed: $e');
      rethrow;
    }
  }

  void dispose() {
    _eventSub?.cancel();
    _eventSub = null;
    _signInController.close();
    _initialized = false;
  }
}
