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
    _destinationUrlController =
        TextEditingController(text: widget.qrData['destination_url']);
    _keywordController = TextEditingController(
      text: widget.qrData['keyword'] ?? widget.qrData['short_code'],
    );
  }

  Future<void> _updateQrCode() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);
    final cs = Theme.of(context).colorScheme;
    final messenger = ScaffoldMessenger.of(context);

    try {
      final keyword = _keywordController.text.trim();
      await Supabase.instance.client.from('qr_codes').update({
        'destination_url': _destinationUrlController.text.trim(),
        'keyword': keyword.isNotEmpty ? keyword : null,
      }).eq('id', widget.qrData['id']);

      if (mounted) {
        messenger.showSnackBar(
          const SnackBar(content: Text('QR Code updated')),
        );
        context.pop(true);
      }
    } catch (e) {
      if (mounted) {
        messenger.showSnackBar(
          SnackBar(
            content: Text('Failed to update: $e'),
            backgroundColor: cs.errorContainer,
          ),
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
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    final keywordEditable = widget.qrData['keyword'] != null;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit QR Code'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: cs.primaryContainer,
                  borderRadius: BorderRadius.circular(28),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: cs.primary.withValues(alpha: 0.18),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        Icons.edit_rounded,
                        color: cs.onPrimaryContainer,
                        size: 22,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Update QR Details',
                            style: tt.titleMedium?.copyWith(
                              color: cs.onPrimaryContainer,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Code: /${widget.qrData['short_code']}',
                            style: tt.bodySmall?.copyWith(
                              color: cs.onPrimaryContainer
                                  .withValues(alpha: 0.85),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              TextFormField(
                controller: _destinationUrlController,
                decoration: const InputDecoration(
                  labelText: 'Destination URL',
                  hintText: 'https://example.com',
                  prefixIcon: Icon(Icons.link_rounded),
                ),
                keyboardType: TextInputType.url,
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Destination URL is required';
                  }
                  if (!value.trim().startsWith('http://') &&
                      !value.trim().startsWith('https://')) {
                    return 'URL must start with http:// or https://';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 14),
              TextFormField(
                controller: _keywordController,
                decoration: InputDecoration(
                  labelText: 'Custom keyword',
                  hintText: 'e.g. my-campaign',
                  prefixIcon: const Icon(Icons.tag_rounded),
                  helperText: keywordEditable
                      ? null
                      : 'Short code cannot be changed once generated',
                ),
                readOnly: !keywordEditable,
                enabled: keywordEditable,
              ),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: _isLoading ? null : _updateQrCode,
                child: _isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Save Changes'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
