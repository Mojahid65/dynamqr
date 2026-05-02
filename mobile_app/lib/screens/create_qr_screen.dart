import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:go_router/go_router.dart';
import 'dart:math';

class CreateQrScreen extends StatefulWidget {
  const CreateQrScreen({super.key});

  @override
  State<CreateQrScreen> createState() => _CreateQrScreenState();
}

class _CreateQrScreenState extends State<CreateQrScreen> {
  final _formKey = GlobalKey<FormState>();
  final _destinationUrlController = TextEditingController();
  final _keywordController = TextEditingController();
  bool _isLoading = false;

  String _generateShortCode() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    final random = Random();
    return String.fromCharCodes(Iterable.generate(
        6, (_) => chars.codeUnitAt(random.nextInt(chars.length))));
  }

  Future<void> _createQrCode() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final user = Supabase.instance.client.auth.currentUser;
      final keyword = _keywordController.text.trim();
      final shortCode = keyword.isNotEmpty ? keyword : _generateShortCode();

      await Supabase.instance.client.from('qr_codes').insert({
        'user_id': user?.id,
        'destination_url': _destinationUrlController.text.trim(),
        'keyword': keyword.isNotEmpty ? keyword : null,
        'short_code': shortCode,
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('QR Code created successfully!'), backgroundColor: Colors.green),
        );
        context.pop(true); // Return true to indicate success and trigger reload
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to create QR Code: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _destinationUrlController.dispose();
    _keywordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 24),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade600,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Create Dynamic QR', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(24.0),
                decoration: BoxDecoration(
                  color: Theme.of(context).cardColor,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: isDark ? Colors.grey.shade800 : Colors.grey.shade200),
                ),
                child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  'QR Code Details',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 24),
                TextFormField(
                  controller: _destinationUrlController,
                  decoration: const InputDecoration(
                    labelText: 'Destination URL *',
                    hintText: 'https://example.com',
                    prefixIcon: Icon(Icons.link),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.all(Radius.circular(12)),
                    ),
                  ),
                  keyboardType: TextInputType.url,
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Destination URL is required';
                    }
                    if (!value.trim().startsWith('http://') && !value.trim().startsWith('https://')) {
                      return 'URL must start with http:// or https://';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _keywordController,
                  decoration: const InputDecoration(
                    labelText: 'Custom Keyword (Optional)',
                    hintText: 'e.g., my-campaign',
                    prefixIcon: Icon(Icons.short_text),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.all(Radius.circular(12)),
                    ),
                  ),
                ),
                const SizedBox(height: 32),
                ElevatedButton(
                  onPressed: _isLoading ? null : _createQrCode,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.indigo,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: _isLoading
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Text('Create QR Code', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
        ),
      ],
    ),
  ),
),
);
}
}
