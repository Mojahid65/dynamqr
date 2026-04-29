import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:go_router/go_router.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../core/constants.dart';
import '../widgets/qr_list_item.dart';

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
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _qrCodes.isEmpty
              ? _buildEmptyState()
              : _buildList(),
      floatingActionButton: FloatingActionButton.extended(
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
