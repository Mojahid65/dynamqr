import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';
import '../core/google_auth_service.dart';
import '../widgets/qr_list_item.dart';
import 'scanner_screen.dart';
import 'about_screen.dart';
import 'privacy_policy_screen.dart';
import 'terms_screen.dart';
import 'package:provider/provider.dart';
import '../providers/theme_provider.dart';
import '../services/update_service.dart';
import 'package:lottie/lottie.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => DashboardScreenState();
}

class DashboardScreenState extends State<DashboardScreen> {
  final _supabase = Supabase.instance.client;
  final _searchController = SearchController();
  List<dynamic> _qrCodes = [];
  String _searchQuery = '';
  bool _isLoading = true;
  String? _newlyCreatedQrId;

  @override
  void initState() {
    super.initState();
    _fetchQRCodes();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      UpdateService().checkForUpdates(context);
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchQRCodes({bool fromCreate = false}) async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) return;

      final data = await _supabase
          .from('qr_codes')
          .select()
          .eq('user_id', user.id)
          .order('created_at', ascending: false);
      if (mounted) {
        setState(() {
          _qrCodes = data.where((item) {
            final config = item['design_config'] as Map<String, dynamic>?;
            return config?['is_link'] != true;
          }).toList();
          
          if (fromCreate && _qrCodes.isNotEmpty) {
            _newlyCreatedQrId = _qrCodes.first['id'];
            HapticFeedback.heavyImpact();
            SystemSound.play(SystemSoundType.click);
            
            // clear the animation flag after some time so it doesn't re-animate
            // if the list is rebuilt for other reasons
            Future.delayed(const Duration(seconds: 2), () {
              if (mounted) setState(() => _newlyCreatedQrId = null);
            });
          }
          
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  /// Public refresh hook used by the parent NavigationScreen's FAB.
  void refresh({bool fromCreate = false}) => _fetchQRCodes(fromCreate: fromCreate);

  Future<void> _signOut() async {
    // Disconnect Google + Supabase together so a future "Continue with
    // Google" flow re-shows the chooser instead of silently restoring
    // the session the user just signed out of.
    await GoogleAuthService.instance.signOut(supabase: _supabase);
    if (mounted) context.go('/login');
  }

  Future<void> _deleteQrCode(String id) async {
    final messenger = ScaffoldMessenger.of(context);
    final cs = Theme.of(context).colorScheme;
    try {
      await _supabase.from('qr_codes').delete().eq('id', id);
      if (mounted) {
        _fetchQRCodes();
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (context) {
            Future.delayed(const Duration(seconds: 2), () {
              if (Navigator.of(context).canPop()) {
                Navigator.of(context).pop();
              }
            });
            return Dialog(
              backgroundColor: Colors.transparent,
              elevation: 0,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Lottie.asset(
                    'assets/googleicon/animations/183ba51d-d684-480c-98ec-5d83e69c690a.json',
                    width: 200,
                    height: 200,
                    repeat: false,
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Text(
                      'Deleted Successfully!',
                      style: TextStyle(
                        color: Colors.green,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      }
    } catch (e) {
      if (mounted) {
        messenger.showSnackBar(
          SnackBar(
            content: Text('Failed to delete: $e'),
            backgroundColor: cs.errorContainer,
          ),
        );
      }
    }
  }

  List<dynamic> get _filteredQrCodes {
    if (_searchQuery.isEmpty) return _qrCodes;
    final q = _searchQuery.toLowerCase();
    return _qrCodes.where((qr) {
      final url = (qr['destination_url'] ?? '').toString().toLowerCase();
      final keyword = (qr['keyword'] ?? '').toString().toLowerCase();
      final code = (qr['short_code'] ?? '').toString().toLowerCase();
      return url.contains(q) || keyword.contains(q) || code.contains(q);
    }).toList();
  }

  Widget _buildDrawer(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    final user = _supabase.auth.currentUser;
    final email = user?.email ?? 'Guest';
    final initial =
        email.isNotEmpty ? email.characters.first.toUpperCase() : '?';

    return Drawer(
      child: SafeArea(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(28, 24, 16, 16),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 22,
                    backgroundColor: cs.primaryContainer,
                    child: Text(
                      initial,
                      style: tt.titleMedium?.copyWith(
                        color: cs.onPrimaryContainer,
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
                          'DynamQR',
                          style: tt.titleMedium
                              ?.copyWith(fontWeight: FontWeight.w600),
                        ),
                        Text(
                          email,
                          style: tt.bodySmall
                              ?.copyWith(color: cs.onSurfaceVariant),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const Divider(indent: 28, endIndent: 28, height: 1),
            const SizedBox(height: 8),
            _DrawerTile(
              icon: Icons.home_rounded,
              label: 'Home',
              selected: true,
              onTap: () => Navigator.pop(context),
            ),
            _DrawerTile(
              icon: Icons.info_outline_rounded,
              label: 'About Developer',
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const AboutScreen()),
                );
              },
            ),
            _DrawerTile(
              icon: Icons.share_outlined,
              label: 'Share App',
              onTap: () {
                Navigator.pop(context);
                SharePlus.instance.share(ShareParams(
                  text:
                      'Check out DynamQR, the smartest way to manage dynamic QR codes! https://dynamqr.vercel.app',
                ));
              },
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(28, 16, 28, 8),
              child: Text(
                'LEGAL',
                style: tt.labelSmall?.copyWith(
                  color: cs.onSurfaceVariant,
                  letterSpacing: 1.2,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            _DrawerTile(
              icon: Icons.privacy_tip_outlined,
              label: 'Privacy Policy',
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(
                      builder: (_) => const PrivacyPolicyScreen()),
                );
              },
            ),
            _DrawerTile(
              icon: Icons.description_outlined,
              label: 'Terms of Service',
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const TermsScreen()),
                );
              },
            ),
            const Divider(indent: 28, endIndent: 28, height: 24),
            Consumer<ThemeProvider>(
              builder: (context, tp, _) {
                return Padding(
                  padding: const EdgeInsets.fromLTRB(28, 0, 28, 8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'APPEARANCE',
                        style: tt.labelSmall?.copyWith(
                          color: cs.onSurfaceVariant,
                          letterSpacing: 1.2,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 8),
                      // Subtitle showing current selection so it never
                      // looks ambiguous with icon-only segments.
                      Text(
                        switch (tp.themeMode) {
                          ThemeMode.light => 'Light mode',
                          ThemeMode.dark => 'Dark mode',
                          ThemeMode.system => 'System default',
                        },
                        style: tt.bodySmall
                            ?.copyWith(color: cs.onSurface),
                      ),
                      const SizedBox(height: 12),
                      // Icon-only segmented control to avoid label
                      // truncation/overflow inside the narrow drawer.
                      Center(
                        child: SegmentedButton<ThemeMode>(
                          showSelectedIcon: false,
                          segments: const [
                            ButtonSegment(
                              value: ThemeMode.light,
                              icon: Icon(Icons.light_mode_outlined),
                              tooltip: 'Light',
                            ),
                            ButtonSegment(
                              value: ThemeMode.system,
                              icon: Icon(Icons.brightness_auto_outlined),
                              tooltip: 'System',
                            ),
                            ButtonSegment(
                              value: ThemeMode.dark,
                              icon: Icon(Icons.dark_mode_outlined),
                              tooltip: 'Dark',
                            ),
                          ],
                          selected: {tp.themeMode},
                          onSelectionChanged: (s) =>
                              tp.setTheme(s.first),
                          style: ButtonStyle(
                            visualDensity: VisualDensity.compact,
                            tapTargetSize:
                                MaterialTapTargetSize.shrinkWrap,
                            padding: const WidgetStatePropertyAll(
                              EdgeInsets.symmetric(
                                  horizontal: 14, vertical: 8),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
            const SizedBox(height: 16),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () {
                    Navigator.pop(context);
                    _signOut();
                  },
                  icon: Icon(Icons.logout_rounded, color: cs.error),
                  label: Text(
                    'Log Out',
                    style: TextStyle(color: cs.error),
                  ),
                  style: OutlinedButton.styleFrom(
                    side: BorderSide(color: cs.error.withValues(alpha: 0.5)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    final filtered = _filteredQrCodes;

    return Scaffold(
      drawer: _buildDrawer(context),
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: _fetchQRCodes,
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverAppBar.large(
                pinned: true,
                title: const Text('Your QR Codes'),
              ),
              SliverToBoxAdapter(child: _buildSummaryCard(context)),
              SliverToBoxAdapter(child: _buildSearchBar(context)),
              if (_isLoading)
                const SliverFillRemaining(
                  hasScrollBody: false,
                  child: Padding(
                    padding: EdgeInsets.only(top: 80),
                    child: Center(child: CircularProgressIndicator()),
                  ),
                )
              else if (filtered.isEmpty)
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: _EmptyState(
                    icon: _searchQuery.isNotEmpty
                        ? Icons.search_off_rounded
                        : Icons.qr_code_2_outlined,
                    title: _searchQuery.isNotEmpty
                        ? 'No matches'
                        : 'No QR codes yet',
                    description: _searchQuery.isNotEmpty
                        ? 'Try a different keyword.'
                        : 'Tap "Create QR" to make your first dynamic QR code.',
                  ),
                )
              else ...[
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                  sliver: SliverToBoxAdapter(
                    child: Row(
                      children: [
                        Text(
                          '${filtered.length} ${filtered.length == 1 ? 'code' : 'codes'}',
                          style: tt.labelLarge?.copyWith(
                            color: cs.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 120),
                  sliver: SliverList.separated(
                    itemCount: filtered.length,
                    separatorBuilder: (context, index) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final qr = filtered[index];
                      Widget child = QrListItemWidget(
                        qr: qr,
                        onRefresh: _fetchQRCodes,
                        onDelete: _deleteQrCode,
                      );
                      
                      if (_newlyCreatedQrId == qr['id']) {
                        child = TweenAnimationBuilder<Offset>(
                          key: ValueKey('anim-${qr['id']}'),
                          tween: Tween(begin: const Offset(-1.0, 0.0), end: Offset.zero),
                          duration: const Duration(milliseconds: 600),
                          curve: Curves.easeOutCubic,
                          builder: (context, offset, child) {
                            return FractionalTranslation(
                              translation: offset,
                              child: child,
                            );
                          },
                          child: child,
                        );
                      }
                      
                      return child;
                    },
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
      floatingActionButton: null,
    );
  }

  Widget _buildSummaryCard(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    final total = _qrCodes.length;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: cs.primaryContainer,
          borderRadius: BorderRadius.circular(28),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: cs.primary.withValues(alpha: 0.18),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(
                Icons.qr_code_2_rounded,
                color: cs.onPrimaryContainer,
                size: 28,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Total QR Codes',
                    style: tt.labelLarge?.copyWith(
                      color: cs.onPrimaryContainer.withValues(alpha: 0.85),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '$total',
                    style: tt.displaySmall?.copyWith(
                      color: cs.onPrimaryContainer,
                      fontWeight: FontWeight.w700,
                      letterSpacing: -1,
                      height: 1,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    total == 0
                        ? 'Tap "Create QR" to get started'
                        : 'Manage and customize your codes',
                    style: tt.bodySmall?.copyWith(
                      color: cs.onPrimaryContainer.withValues(alpha: 0.85),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchBar(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: SearchAnchor.bar(
        searchController: _searchController,
        barHintText: 'Search by URL, keyword, or code',
        barElevation: const WidgetStatePropertyAll(0),
        barLeading: const Icon(Icons.search_rounded),
        barTrailing: _searchQuery.isNotEmpty
            ? [
                IconButton(
                  icon: const Icon(Icons.close_rounded),
                  onPressed: () {
                    _searchController.clear();
                    setState(() => _searchQuery = '');
                  },
                ),
              ]
            : const [],
        onChanged: (q) => setState(() => _searchQuery = q),
        suggestionsBuilder: (context, controller) {
          final query = controller.text.toLowerCase();
          final results = _qrCodes.where((qr) {
            final url = (qr['destination_url'] ?? '').toString().toLowerCase();
            final keyword = (qr['keyword'] ?? '').toString().toLowerCase();
            final code = (qr['short_code'] ?? '').toString().toLowerCase();
            return url.contains(query) ||
                keyword.contains(query) ||
                code.contains(query);
          }).take(8);
          return [
            for (final qr in results)
              ListTile(
                leading: const Icon(Icons.qr_code_2_outlined),
                title: Text(qr['destination_url'] ?? '',
                    maxLines: 1, overflow: TextOverflow.ellipsis),
                subtitle: Text('/${qr['keyword'] ?? qr['short_code']}'),
                onTap: () {
                  controller.closeView(qr['destination_url']);
                  setState(() => _searchQuery = qr['destination_url']);
                },
              ),
          ];
        },
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;

  const _EmptyState({
    required this.icon,
    required this.title,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(32, 56, 32, 80),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(28),
            decoration: BoxDecoration(
              color: cs.primaryContainer,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, size: 56, color: cs.onPrimaryContainer),
          ),
          const SizedBox(height: 20),
          Text(
            title,
            style: tt.titleLarge?.copyWith(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 8),
          Text(
            description,
            textAlign: TextAlign.center,
            style: tt.bodyMedium?.copyWith(
              color: cs.onSurfaceVariant,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}


class _DrawerTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool selected;

  const _DrawerTile({
    required this.icon,
    required this.label,
    required this.onTap,
    this.selected = false,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
      child: Material(
        color: selected ? cs.secondaryContainer : Colors.transparent,
        borderRadius: BorderRadius.circular(28),
        child: InkWell(
          borderRadius: BorderRadius.circular(28),
          onTap: onTap,
          child: Padding(
            padding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(
              children: [
                Icon(
                  icon,
                  size: 22,
                  color: selected ? cs.onSecondaryContainer : cs.onSurfaceVariant,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Text(
                    label,
                    style:
                        Theme.of(context).textTheme.labelLarge?.copyWith(
                              color: selected
                                  ? cs.onSecondaryContainer
                                  : cs.onSurface,
                              fontWeight: selected
                                  ? FontWeight.w600
                                  : FontWeight.w500,
                            ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
