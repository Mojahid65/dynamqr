import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'dart:math';

class CreateLinkScreen extends StatefulWidget {
  const CreateLinkScreen({super.key});

  @override
  State<CreateLinkScreen> createState() => _CreateLinkScreenState();
}

class _CreateLinkScreenState extends State<CreateLinkScreen> {
  final _formKey = GlobalKey<FormState>();
  final _destinationUrlController = TextEditingController();
  final _keywordController = TextEditingController();
  bool _isLoading = false;

  String _generateShortCode() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    final random = Random();
    final suffix = String.fromCharCodes(
      Iterable.generate(
        4,
        (_) => chars.codeUnitAt(random.nextInt(chars.length)),
      ),
    );
    return 'moja$suffix';
  }

  Future<void> _createLink() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);
    final cs = Theme.of(context).colorScheme;
    final messenger = ScaffoldMessenger.of(context);

    try {
      final user = Supabase.instance.client.auth.currentUser;
      final keyword = _keywordController.text.trim();

      bool inserted = false;
      for (int attempt = 0; attempt < 5; attempt++) {
        final shortCode = _generateShortCode();
        try {
          await Supabase.instance.client.from('qr_codes').insert({
            'user_id': user?.id,
            'destination_url': _destinationUrlController.text.trim(),
            'short_code': shortCode,
            if (keyword.isNotEmpty) 'keyword': keyword,
            'design_config': {'is_link': true},
          });
          inserted = true;
          break;
        } on PostgrestException catch (e) {
          if (e.code == '23505') continue;
          rethrow;
        }
      }
      if (!inserted) {
        throw Exception('Could not generate a unique code. Please try again.');
      }

      if (mounted) {
        messenger.showSnackBar(
          const SnackBar(content: Text('Dynamic link created')),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        messenger.showSnackBar(
          SnackBar(
            content: Text('Failed to create: $e'),
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

    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: cs.tertiaryContainer,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      Icons.add_link_rounded,
                      color: cs.onTertiaryContainer,
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Create Dynamic Link',
                          style: tt.titleMedium
                              ?.copyWith(fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Editable short URL without a QR code',
                          style: tt.bodySmall
                              ?.copyWith(color: cs.onSurfaceVariant),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              TextFormField(
                controller: _destinationUrlController,
                decoration: const InputDecoration(
                  labelText: 'Destination URL',
                  hintText: 'https://example.com',
                  prefixIcon: Icon(Icons.link_rounded),
                ),
                keyboardType: TextInputType.url,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter a destination URL';
                  }
                  if (!value.startsWith('http://') &&
                      !value.startsWith('https://')) {
                    return 'URL must start with http:// or https://';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 14),
              TextFormField(
                controller: _keywordController,
                decoration: const InputDecoration(
                  labelText: 'Label (optional)',
                  hintText: 'e.g. Summer Campaign',
                  prefixIcon: Icon(Icons.label_outline_rounded),
                ),
              ),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: _isLoading ? null : _createLink,
                child: _isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Create Link'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
