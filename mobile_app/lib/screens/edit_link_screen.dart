import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class EditLinkScreen extends StatefulWidget {
  final Map<String, dynamic> linkData;

  const EditLinkScreen({super.key, required this.linkData});

  @override
  State<EditLinkScreen> createState() => _EditLinkScreenState();
}

class _EditLinkScreenState extends State<EditLinkScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _destinationUrlController;
  late TextEditingController _keywordController;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _destinationUrlController =
        TextEditingController(text: widget.linkData['destination_url']);
    _keywordController =
        TextEditingController(text: widget.linkData['keyword'] ?? '');
  }

  Future<void> _updateLink() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);
    final cs = Theme.of(context).colorScheme;
    final messenger = ScaffoldMessenger.of(context);

    try {
      final keyword = _keywordController.text.trim();
      await Supabase.instance.client.from('qr_codes').update({
        'destination_url': _destinationUrlController.text.trim(),
        'keyword': keyword.isNotEmpty ? keyword : null,
      }).eq('id', widget.linkData['id']);

      if (mounted) {
        messenger.showSnackBar(
          const SnackBar(content: Text('Link updated')),
        );
        Navigator.pop(context, true);
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
                      Icons.edit_rounded,
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
                          'Edit Dynamic Link',
                          style: tt.titleMedium
                              ?.copyWith(fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Code: /${widget.linkData['short_code']}',
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
                onPressed: _isLoading ? null : _updateLink,
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
