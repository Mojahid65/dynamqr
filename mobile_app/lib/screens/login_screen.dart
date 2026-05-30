import 'dart:async';
import 'dart:io' show Platform;
import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/google_auth_service.dart';
import '../main.dart' show appRouter;

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  bool _isGoogleLoading = false;
  bool _isLogin = true;
  bool _obscurePassword = true;

  GoogleSignInAccount? _suggestedAccount;
  StreamSubscription<Session>? _sessionSub;

  @override
  void initState() {
    super.initState();

    // Reflect any account that's already been resolved (e.g. by the
    // app-level lightweight auth attempt that fires on launch).
    _suggestedAccount = GoogleAuthService.instance.lastAccount;

    // Kick off our own lightweight attempt — harmless if main.dart already
    // did one, and this lets us update the UI when an account appears.
    _scheduleSilentAccountLookup();

    // If a Google sign-in completes silently in the background (e.g. the
    // app-level lightweight auth attempt finishes after this screen
    // builds), navigate home automatically. The explicit "Continue with
    // Google" button does NOT depend on this stream.
    _sessionSub = GoogleAuthService.instance.signInStream.listen((_) {
      if (!mounted) return;
      // Avoid overriding an in-flight explicit sign-in.
      if (_isGoogleLoading) return;
      unawaited(_persistDeviceInfo());
      appRouter.go('/');
    });
  }

  Future<void> _scheduleSilentAccountLookup() async {
    try {
      await GoogleAuthService.instance.attemptAutoSignIn();
      if (!mounted) return;
      setState(() {
        _suggestedAccount = GoogleAuthService.instance.lastAccount;
      });
    } catch (e) {
      debugPrint('login silent auth lookup failed: $e');
    }
  }

  @override
  void dispose() {
    _sessionSub?.cancel();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _persistDeviceInfo() async {
    try {
      final supabase = Supabase.instance.client;
      final user = supabase.auth.currentUser;
      if (user == null) return;

      final deviceInfo = DeviceInfoPlugin();
      String deviceName = 'Unknown';
      String osVersion = 'Unknown';
      if (Platform.isAndroid) {
        final info = await deviceInfo.androidInfo;
        deviceName = '${info.manufacturer} ${info.model}';
        osVersion = info.version.release;
      } else if (Platform.isIOS) {
        final info = await deviceInfo.iosInfo;
        deviceName = info.name;
        osVersion = info.systemVersion;
      }
      await supabase.from('profiles').update({
        'device_name': deviceName,
        'android_version': osVersion,
      }).eq('id', user.id);
    } catch (e) {
      debugPrint('Failed to persist device info: $e');
    }
  }

  Future<void> _showVerificationDialog(String email) async {
    return showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return AlertDialog(
          icon: const Icon(Icons.mark_email_unread_outlined),
          title: const Text('Verify Your Email'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'We sent a verification link to:\n$email',
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 16),
                const Text('Follow these steps to complete registration:'),
                const SizedBox(height: 12),
                _buildStep(1, 'Open your email app'),
                _buildStep(2, 'Find the email from DynamQR'),
                _buildStep(3, 'Click the "Verify Email" link inside'),
                _buildStep(4, 'Return here and log in'),
                const SizedBox(height: 16),
                Text(
                  'Tip: Check your spam folder if you don\'t see it within a few minutes.',
                  style: TextStyle(
                    fontSize: 12,
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ],
            ),
          ),
          actions: <Widget>[
            FilledButton(
              onPressed: () {
                Navigator.of(context).pop();
                setState(() => _isLogin = true);
              },
              child: const Text('Got it'),
            ),
          ],
        );
      },
    );
  }

  Widget _buildStep(int number, String text) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 24,
            height: 24,
            decoration: BoxDecoration(
              color: cs.primaryContainer,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                number.toString(),
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: cs.onPrimaryContainer,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(child: Text(text, style: const TextStyle(height: 1.4))),
        ],
      ),
    );
  }

  Future<void> _submit() async {
    final isValid = _formKey.currentState?.validate() ?? false;
    if (!isValid) return;

    setState(() => _isLoading = true);
    final cs = Theme.of(context).colorScheme;
    final messenger = ScaffoldMessenger.of(context);
    try {
      if (_isLogin) {
        await Supabase.instance.client.auth.signInWithPassword(
          email: _emailController.text.trim(),
          password: _passwordController.text.trim(),
        );

        final userId = Supabase.instance.client.auth.currentUser!.id;

        try {
          final profile = await Supabase.instance.client
              .from('profiles')
              .select('is_banned')
              .eq('id', userId)
              .maybeSingle();
          if (profile != null && profile['is_banned'] == true) {
            await Supabase.instance.client.auth.signOut();
            setState(() => _isLoading = false);
            if (mounted) {
              showDialog(
                context: context,
                builder: (ctx) => AlertDialog(
                  icon: const Icon(Icons.block_rounded),
                  title: const Text('Account Suspended'),
                  content: const Text(
                    'Your account has been suspended by the administrator. Please contact support.',
                  ),
                  actions: [
                    FilledButton(
                      onPressed: () => Navigator.pop(ctx),
                      child: const Text('OK'),
                    ),
                  ],
                ),
              );
            }
            return;
          }
        } catch (e) {
          debugPrint('Failed to check ban status: $e');
        }

        await _persistDeviceInfo();
        if (mounted) context.go('/');
      } else {
        final email = _emailController.text.trim();
        await Supabase.instance.client.auth.signUp(
          email: email,
          password: _passwordController.text.trim(),
        );
        if (mounted) {
          setState(() => _isLoading = false);
          await _showVerificationDialog(email);
        }
      }
    } on AuthException catch (e) {
      if (mounted) {
        messenger.showSnackBar(
          SnackBar(
            content: Text(e.message),
            backgroundColor: cs.errorContainer,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        messenger.showSnackBar(
          SnackBar(
            content: const Text('Unexpected error occurred'),
            backgroundColor: cs.errorContainer,
          ),
        );
      }
    } finally {
      if (mounted && _isLoading) setState(() => _isLoading = false);
    }
  }

  Future<void> _continueWithGoogle() async {
    if (_isLoading || _isGoogleLoading) return;
    final cs = Theme.of(context).colorScheme;
    final messenger = ScaffoldMessenger.of(context);

    setState(() => _isGoogleLoading = true);
    try {
      // Opens the system Credential Manager bottom sheet. On Android 14+
      // this defaults to "continue as <last account>" so the user gets
      // a one-tap experience for previously selected Google accounts.
      final session = await GoogleAuthService.instance.signInExplicit();
      debugPrint(
          'Google sign-in succeeded. session.user=${session.user.id}');

      // Navigate immediately. We deliberately do NOT await
      // _persistDeviceInfo() — that's a fire-and-forget side effect, and
      // a slow network round-trip there must not block the user from
      // reaching the dashboard.
      unawaited(_persistDeviceInfo());

      if (!mounted) return;
      // Use the global appRouter so we don't depend on the LoginScreen's
      // BuildContext being still mounted — and call go() which is
      // navigation-stack-replacing rather than push().
      appRouter.go('/');
    } on GoogleSignInException catch (e) {
      debugPrint('GoogleSignInException ${e.code}: ${e.description}');
      if (mounted && e.code != GoogleSignInExceptionCode.canceled) {
        messenger.showSnackBar(
          SnackBar(
            content: Text(e.description ?? 'Google sign in failed'),
            backgroundColor: cs.errorContainer,
          ),
        );
      }
    } on AuthException catch (e) {
      debugPrint('AuthException: ${e.message}');
      if (mounted) {
        messenger.showSnackBar(
          SnackBar(
            content: Text(e.message),
            backgroundColor: cs.errorContainer,
          ),
        );
      }
    } catch (e, st) {
      debugPrint('Google sign in unexpected error: $e\n$st');
      if (mounted) {
        messenger.showSnackBar(
          SnackBar(
            content: const Text('Google sign in failed. Please try again.'),
            backgroundColor: cs.errorContainer,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isGoogleLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Center(
                      child: Container(
                        height: 88,
                        width: 88,
                        decoration: BoxDecoration(
                          color: cs.primaryContainer,
                          borderRadius: BorderRadius.circular(28),
                        ),
                        child: Icon(
                          Icons.qr_code_2_rounded,
                          size: 44,
                          color: cs.onPrimaryContainer,
                        ),
                      ),
                    ),
                    const SizedBox(height: 28),
                    Text(
                      _isLogin ? 'Welcome back' : 'Create your account',
                      textAlign: TextAlign.center,
                      style: tt.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                        letterSpacing: -0.3,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _isLogin
                          ? 'Sign in to manage your QR codes'
                          : 'Start making dynamic QR codes today',
                      textAlign: TextAlign.center,
                      style: tt.bodyMedium?.copyWith(
                        color: cs.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Continue-as card surfaces the previously selected
                    // Google account when Credential Manager finds one
                    // silently. One tap signs the user back in without
                    // showing the chooser.
                    if (_suggestedAccount != null) ...[
                      _ContinueAsCard(
                        account: _suggestedAccount!,
                        loading: _isGoogleLoading,
                        onTap: (_isLoading || _isGoogleLoading)
                            ? null
                            : _continueWithGoogle,
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(child: Divider(color: cs.outlineVariant)),
                          Padding(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12),
                            child: Text(
                              'OR USE EMAIL',
                              style: tt.labelSmall?.copyWith(
                                letterSpacing: 1.5,
                                color: cs.onSurfaceVariant,
                              ),
                            ),
                          ),
                          Expanded(child: Divider(color: cs.outlineVariant)),
                        ],
                      ),
                      const SizedBox(height: 16),
                    ],

                    TextFormField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      autofillHints: const [AutofillHints.email],
                      validator: (value) {
                        final email = value?.trim() ?? '';
                        if (email.isEmpty) return 'Email is required';
                        if (!email.contains('@') || !email.contains('.')) {
                          return 'Enter a valid email address';
                        }
                        return null;
                      },
                      decoration: const InputDecoration(
                        labelText: 'Email',
                        hintText: 'name@example.com',
                        prefixIcon: Icon(Icons.email_outlined),
                      ),
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: _passwordController,
                      obscureText: _obscurePassword,
                      autofillHints: const [AutofillHints.password],
                      validator: (value) {
                        final password = value?.trim() ?? '';
                        if (password.isEmpty) return 'Password is required';
                        if (!_isLogin && password.length < 6) {
                          return 'Password must be at least 6 characters';
                        }
                        return null;
                      },
                      decoration: InputDecoration(
                        labelText: 'Password',
                        prefixIcon: const Icon(Icons.lock_outline),
                        suffixIcon: IconButton(
                          onPressed: () => setState(
                            () => _obscurePassword = !_obscurePassword,
                          ),
                          icon: Icon(
                            _obscurePassword
                                ? Icons.visibility_off_outlined
                                : Icons.visibility_outlined,
                            size: 20,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    SizedBox(
                      height: 52,
                      child: FilledButton(
                        onPressed: (_isLoading || _isGoogleLoading)
                            ? null
                            : _submit,
                        child: _isLoading
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              )
                            : Text(_isLogin ? 'Sign In' : 'Sign Up'),
                      ),
                    ),

                    // Show the standard "Continue with Google" only when
                    // we don't have a suggested account (otherwise the
                    // continue-as card handles it).
                    if (_suggestedAccount == null) ...[
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(child: Divider(color: cs.outlineVariant)),
                          Padding(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12),
                            child: Text(
                              'OR',
                              style: tt.labelSmall?.copyWith(
                                letterSpacing: 1.5,
                                color: cs.onSurfaceVariant,
                              ),
                            ),
                          ),
                          Expanded(child: Divider(color: cs.outlineVariant)),
                        ],
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        height: 52,
                        child: OutlinedButton.icon(
                          onPressed: (_isLoading || _isGoogleLoading)
                              ? null
                              : _continueWithGoogle,
                          icon: _isGoogleLoading
                              ? const SizedBox(
                                  height: 18,
                                  width: 18,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                  ),
                                )
                              : const _GoogleLogo(),
                          label: Text(
                            _isLogin
                                ? 'Continue with Google'
                                : 'Sign Up with Google',
                          ),
                        ),
                      ),
                    ],

                    const SizedBox(height: 16),
                    Center(
                      child: TextButton(
                        onPressed: (_isLoading || _isGoogleLoading)
                            ? null
                            : () {
                                setState(() => _isLogin = !_isLogin);
                              },
                        child: Text(
                          _isLogin
                              ? 'New here? Sign Up'
                              : 'Already have an account? Sign In',
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// "Continue as <name>" card. Mirrors the modern Google one-tap pattern:
/// shows the user's avatar + email so re-authenticating is one tap.
class _ContinueAsCard extends StatelessWidget {
  final GoogleSignInAccount account;
  final bool loading;
  final VoidCallback? onTap;

  const _ContinueAsCard({
    required this.account,
    required this.loading,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    final initials = _initialsFor(account);
    final photoUrl = account.photoUrl;

    return Material(
      color: cs.primaryContainer,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              CircleAvatar(
                radius: 22,
                backgroundColor: cs.primary,
                foregroundImage: photoUrl != null
                    ? NetworkImage(photoUrl)
                    : null,
                child: Text(
                  initials,
                  style: tt.titleMedium?.copyWith(
                    color: cs.onPrimary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Continue as ${account.displayName ?? account.email.split('@').first}',
                      style: tt.titleSmall?.copyWith(
                        color: cs.onPrimaryContainer,
                        fontWeight: FontWeight.w700,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      account.email,
                      style: tt.bodySmall?.copyWith(
                        color: cs.onPrimaryContainer
                            .withValues(alpha: 0.85),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              loading
                  ? SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: cs.onPrimaryContainer,
                      ),
                    )
                  : Icon(
                      Icons.arrow_forward_rounded,
                      color: cs.onPrimaryContainer,
                    ),
            ],
          ),
        ),
      ),
    );
  }

  static String _initialsFor(GoogleSignInAccount a) {
    final name = a.displayName ?? a.email;
    if (name.isEmpty) return '?';
    final parts = name.trim().split(RegExp(r'\s+'));
    final letters = parts.take(2).map((p) => p.characters.first).join();
    return letters.toUpperCase();
  }
}

/// Google "G" logo painted with the official 4 brand colors.
/// Self-contained so we don't ship a separate asset for it.
class _GoogleLogo extends StatelessWidget {
  const _GoogleLogo();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 18,
      height: 18,
      child: CustomPaint(painter: _GoogleGPainter()),
    );
  }
}

class _GoogleGPainter extends CustomPainter {
  static const _blue = Color(0xFF4285F4);
  static const _green = Color(0xFF34A853);
  static const _yellow = Color(0xFFFBBC05);
  static const _red = Color(0xFFEA4335);

  @override
  void paint(Canvas canvas, Size size) {
    final s = size.width;
    final stroke = s * 0.22;
    final r = (s - stroke) / 2;
    final c = Offset(s / 2, s / 2);
    final rect = Rect.fromCircle(center: c, radius: r);
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.butt;

    // Four arcs roughly matching the Google logo color distribution.
    canvas.drawArc(rect, _deg(-25), _deg(105), false, paint..color = _blue);
    canvas.drawArc(rect, _deg(80), _deg(75), false, paint..color = _green);
    canvas.drawArc(rect, _deg(155), _deg(75), false, paint..color = _yellow);
    canvas.drawArc(rect, _deg(230), _deg(105), false, paint..color = _red);

    // Horizontal "tail" of the G — a small bar from the center outwards.
    final barPaint = Paint()
      ..color = _blue
      ..style = PaintingStyle.fill;
    final barHeight = stroke;
    final barRect = Rect.fromLTWH(
      c.dx,
      c.dy - barHeight / 2,
      r + stroke / 2,
      barHeight,
    );
    canvas.drawRect(barRect, barPaint);
  }

  double _deg(double d) => d * 3.1415926535 / 180.0;

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
