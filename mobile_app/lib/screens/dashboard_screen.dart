import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:go_router/go_router.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:share_plus/share_plus.dart';
import '../core/constants.dart';
import '../widgets/qr_list_item.dart';
import 'scanner_screen.dart';

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
  }

  Future<void> _fetchQRCodes() async {
    try {
      final data = await _supabase
          .from('qr_codes')
          .select()
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

  void _showAboutDialog() {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('About the Developer'),
          content: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('DynamQR is built by Mojahid Hassan, a passionate indie developer focused on creating simple, powerful tools for the digital world. The goal behind this app is to make QR technology smarter, more flexible, and accessible for everyone — from small business owners to creators and developers.\n\nWith DynamQR, the idea is straightforward: your QR code should never be static. You should have full control to update, manage, and optimize your links anytime without reprinting or regenerating codes.\n\nThis project is part of a larger vision to build lightweight, user-friendly web tools that solve real problems without unnecessary complexity or heavy systems.\n\nBuilt with ❤️ for simplicity, speed, and freedom.\n\nFor feedback, suggestions, or collaboration:'),
                const SizedBox(height: 16),
                InkWell(
                  onTap: () {
                    launchUrl(Uri.parse('mailto:hello@mojahidhassan.in'));
                  },
                  child: const Text('hello@mojahidhassan.in', style: TextStyle(color: Colors.indigo, decoration: TextDecoration.underline)),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Close'),
            ),
          ],
        );
      },
    );
  }

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
              _showAboutDialog();
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
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text('DynamQR', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
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
            backgroundColor: Colors.white,
            foregroundColor: Colors.indigo,
          ),
          const SizedBox(height: 16),
          FloatingActionButton.extended(
            heroTag: 'create_qr',
            onPressed: () async {
              final result = await context.push('/create');
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
