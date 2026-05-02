import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:go_router/go_router.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:share_plus/share_plus.dart';
import '../core/constants.dart';
import '../widgets/qr_list_item.dart';
import 'scanner_screen.dart';
import 'create_qr_screen.dart';
import 'about_screen.dart';
import 'privacy_policy_screen.dart';
import 'terms_screen.dart';
import 'package:provider/provider.dart';
import '../providers/theme_provider.dart';
import '../services/update_service.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _supabase = Supabase.instance.client;
  List<dynamic> _qrCodes = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchQRCodes();
    
    // Check for updates shortly after screen loads
    WidgetsBinding.instance.addPostFrameCallback((_) {
      UpdateService().checkForUpdates(context);
    });
  }

  Future<void> _fetchQRCodes() async {
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
          _qrCodes = data;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _signOut() async {
    await _supabase.auth.signOut();
    if (mounted) context.go('/login');
  }

  Future<void> _deleteQrCode(String id) async {
    try {
      await _supabase.from('qr_codes').delete().eq('id', id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('QR Code deleted'), backgroundColor: Colors.green),
        );
        _fetchQRCodes();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to delete QR Code: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  // Removed _showAboutDialog as we now use AboutScreen

  Widget _buildDrawer() {
    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          const DrawerHeader(
            decoration: BoxDecoration(
              color: Colors.indigo,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Icon(Icons.qr_code_scanner, size: 48, color: Colors.white),
                SizedBox(height: 8),
                Text(
                  'DynamQR',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          ListTile(
            leading: const Icon(Icons.home),
            title: const Text('Home'),
            onTap: () {
              Navigator.pop(context);
            },
          ),
          ListTile(
            leading: const Icon(Icons.info_outline),
            title: const Text('About Developer'),
            onTap: () {
              Navigator.pop(context);
              Navigator.push(context, MaterialPageRoute(builder: (context) => const AboutScreen()));
            },
          ),
          ListTile(
            leading: const Icon(Icons.favorite_border, color: Colors.pink),
            title: const Text('Donate'),
            onTap: () async {
              Navigator.pop(context);
              final url = Uri.parse('https://www.mojahidhassan.in/donate');
              try {
                await launchUrl(url, mode: LaunchMode.externalApplication);
              } catch (e) {
                debugPrint('Could not launch donate url: $e');
              }
            },
          ),
          ListTile(
            leading: const Icon(Icons.share),
            title: const Text('Share App'),
            onTap: () {
              Navigator.pop(context);
              Share.share('Check out DynamQR, the smartest way to manage dynamic QR codes! https://dynamqr.vercel.app');
            },
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.privacy_tip_outlined),
            title: const Text('Privacy Policy'),
            onTap: () {
              Navigator.pop(context);
              Navigator.push(context, MaterialPageRoute(builder: (context) => const PrivacyPolicyScreen()));
            },
          ),
          ListTile(
            leading: const Icon(Icons.description_outlined),
            title: const Text('Terms of Service'),
            onTap: () {
              Navigator.pop(context);
              Navigator.push(context, MaterialPageRoute(builder: (context) => const TermsScreen()));
            },
          ),
          const Divider(),
          Consumer<ThemeProvider>(
            builder: (context, themeProvider, child) {
              return ListTile(
                leading: Icon(
                  themeProvider.themeMode == ThemeMode.dark ? Icons.dark_mode :
                  themeProvider.themeMode == ThemeMode.light ? Icons.light_mode : Icons.brightness_auto,
                ),
                title: const Text('Theme'),
                subtitle: Text(
                  themeProvider.themeMode == ThemeMode.dark ? 'Dark Mode' :
                  themeProvider.themeMode == ThemeMode.light ? 'Light Mode' : 'System Default',
                ),
                trailing: PopupMenuButton<ThemeMode>(
                  onSelected: (mode) => themeProvider.setTheme(mode),
                  itemBuilder: (context) => const [
                    PopupMenuItem(value: ThemeMode.system, child: Text('System Default')),
                    PopupMenuItem(value: ThemeMode.light, child: Text('Light Mode')),
                    PopupMenuItem(value: ThemeMode.dark, child: Text('Dark Mode')),
                  ],
                ),
              );
            },
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.logout, color: Colors.red),
            title: const Text('Log Out', style: TextStyle(color: Colors.red)),
            onTap: () {
              Navigator.pop(context);
              _signOut();
            },
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('DynamQR', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _signOut,
          ),
        ],
      ),
      drawer: _buildDrawer(),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _qrCodes.isEmpty
              ? _buildEmptyState()
              : _buildList(),
      floatingActionButton: Column(
        mainAxisAlignment: MainAxisAlignment.end,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          FloatingActionButton.extended(
            heroTag: 'scan_qr',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const ScannerScreen()),
              );
            },
            icon: const Icon(Icons.qr_code_scanner),
            label: const Text('Scan QR'),
            backgroundColor: isDark ? Colors.grey.shade900 : Colors.white,
            foregroundColor: isDark ? Colors.indigo.shade200 : Colors.indigo,
          ),
          const SizedBox(height: 16),
          FloatingActionButton.extended(
            heroTag: 'create_qr',
            onPressed: () async {
              final result = await showModalBottomSheet<bool>(
                context: context,
                isScrollControlled: true,
                backgroundColor: Colors.transparent,
                builder: (context) => const CreateQrScreen(),
              );
              if (result == true) {
                _fetchQRCodes();
              }
            },
            icon: const Icon(Icons.add),
            label: const Text('Create QR'),
            backgroundColor: Colors.indigo,
            foregroundColor: Colors.white,
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.qr_code_scanner, size: 80, color: Colors.indigo.shade200),
          const SizedBox(height: 16),
          const Text('No QR codes yet', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          const Text('Create your first dynamic QR code\nto start sharing links.'),
        ],
      ),
    );
  }

  Widget _buildList() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _qrCodes.length,
      itemBuilder: (context, index) {
        final qr = _qrCodes[index];
        return QrListItemWidget(
          qr: qr,
          onRefresh: _fetchQRCodes,
          onDelete: _deleteQrCode,
        );
      },
    );
  }
}
