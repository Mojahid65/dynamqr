import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:go_router/go_router.dart';

class EditQrScreen extends StatefulWidget {
  final Map<String, dynamic> qrData;

  const EditQrScreen({super.key, required this.qrData});

  @override
  State<EditQrScreen> createState() => _EditQrScreenState();
}

class _EditQrScreenState extends State<EditQrScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _destinationUrlController;
  late TextEditingController _keywordController;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _destinationUrlController = TextEditingController(text: widget.qrData['destination_url']);
    _keywordController = TextEditingController(text: widget.qrData['keyword'] ?? widget.qrData['short_code']);
  }

  Future<void> _updateQrCode() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final keyword = _keywordController.text.trim();

      await Supabase.instance.client.from('qr_codes').update({
        'destination_url': _destinationUrlController.text.trim(),
        if (widget.qrData['keyword'] != null || keyword != widget.qrData['short_code'])
          'keyword': keyword.isNotEmpty ? keyword : null,
      }).eq('id', widget.qrData['id']);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('QR Code updated successfully!'), backgroundColor: Colors.green),
        );
        context.pop(true); // Return true to trigger reload
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update QR Code: $e'), backgroundColor: Colors.red),
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
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Dynamic QR'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Container(
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
                  'Update QR Code Details',
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
                    labelText: 'Custom Keyword',
                    hintText: 'e.g., my-campaign',
                    prefixIcon: Icon(Icons.short_text),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.all(Radius.circular(12)),
                    ),
                  ),
                  readOnly: widget.qrData['keyword'] == null, // Maybe only editable if it had one, or allow adding it
                  enabled: widget.qrData['keyword'] != null,
                  // Note: It's better to allow them to edit the keyword if it exists, or just let them change the destination. We'll disable it for simplicity or if they generated a random short code.
                  // For a dynamic QR, usually you update the destination, but the keyword/shortcode is fixed. 
                  // Let's actually disable the keyword edit to prevent breaking existing printed QR codes.
                ),
                if (widget.qrData['keyword'] == null)
                  Padding(
                    padding: const EdgeInsets.only(top: 8.0),
                    child: Text(
                      'Short code (${widget.qrData['short_code']}) cannot be changed.',
                      style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                    ),
                  ),
                const SizedBox(height: 32),
                ElevatedButton(
                  onPressed: _isLoading ? null : _updateQrCode,
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
                      : const Text('Save Changes', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
