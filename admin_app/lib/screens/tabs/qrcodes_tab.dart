import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class QRCodesTab extends StatefulWidget {
  const QRCodesTab({super.key});

  @override
  State<QRCodesTab> createState() => _QRCodesTabState();
}

class _QRCodesTabState extends State<QRCodesTab> {
  List<dynamic> qrCodes = [];
  Map<String, String> userEmails = {};
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchQRCodes();
  }

  Future<void> _fetchQRCodes() async {
    try {
      final supabase = Supabase.instance.client;
      
      // Fetch QRs and Profiles concurrently
      final Future<List<dynamic>> qrsFuture = supabase
          .from('qr_codes')
          .select('*')
          .order('created_at', ascending: false);
          
      final Future<List<dynamic>> profilesFuture = supabase
          .from('profiles')
          .select('id, email');

      final results = await Future.wait([qrsFuture, profilesFuture]);
      
      final qrs = results[0];
      final profiles = results[1];

      final Map<String, String> emailMap = {};
      for (var p in profiles) {
        if (p['id'] != null && p['email'] != null) {
          emailMap[p['id'].toString()] = p['email'].toString();
        }
      }

      if (mounted) {
        setState(() {
          qrCodes = qrs;
          userEmails = emailMap;
          isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => isLoading = false);
      }
    }
  }

  Future<void> _editDestination(String qrId, String currentUrl) async {
    final controller = TextEditingController(text: currentUrl);
    final newUrl = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Edit Destination URL'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(labelText: 'URL'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(ctx, controller.text), child: const Text('Save')),
        ],
      ),
    );

    if (newUrl != null && newUrl.isNotEmpty && newUrl != currentUrl) {
      try {
        await Supabase.instance.client
            .from('qr_codes')
            .update({'destination_url': newUrl})
            .eq('id', qrId);
        _fetchQRCodes();
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) return const Center(child: CircularProgressIndicator());

    return ListView.builder(
      itemCount: qrCodes.length,
      itemBuilder: (context, index) {
        final qr = qrCodes[index];
        final ownerEmail = userEmails[qr['user_id']?.toString()] ?? 'Unknown User';
        
        return ListTile(
          leading: const Icon(Icons.qr_code),
          title: Text(qr['short_code'] ?? 'No Code'),
          subtitle: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(qr['destination_url'] ?? 'No URL'),
              Text('Owner: $ownerEmail', style: TextStyle(color: Theme.of(context).colorScheme.primary, fontSize: 12)),
            ],
          ),
          trailing: IconButton(
            icon: const Icon(Icons.edit),
            onPressed: () => _editDestination(qr['id'], qr['destination_url']),
          ),
        );
      },
    );
  }
}
