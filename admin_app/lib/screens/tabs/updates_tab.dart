import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class UpdatesTab extends StatefulWidget {
  const UpdatesTab({super.key});

  @override
  State<UpdatesTab> createState() => _UpdatesTabState();
}

class _UpdatesTabState extends State<UpdatesTab> {
  List<dynamic> updates = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchUpdates();
  }

  Future<void> _fetchUpdates() async {
    try {
      final res = await Supabase.instance.client
          .from('app_updates')
          .select('*')
          .order('version_code', ascending: false);
      if (mounted) {
        setState(() {
          updates = res;
          isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => isLoading = false);
      }
    }
  }

  void _showPublishUpdateModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => _PublishUpdateForm(onSuccess: _fetchUpdates),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) return const Center(child: CircularProgressIndicator());

    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showPublishUpdateModal,
        icon: const Icon(Icons.publish),
        label: const Text('Publish Update'),
      ),
      body: ListView.builder(
        itemCount: updates.length,
        padding: const EdgeInsets.only(bottom: 80),
        itemBuilder: (context, index) {
          final up = updates[index];
          return Card(
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: ListTile(
              leading: const Icon(Icons.system_update, size: 32),
              title: Text('v${up['version_name']} (${up['version_code']})', style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text(up['release_notes'] ?? 'No Release Notes'),
              trailing: up['is_mandatory'] == true 
                  ? Chip(label: const Text('Mandatory', style: TextStyle(color: Colors.white, fontSize: 10)), backgroundColor: Colors.redAccent.shade400, visualDensity: VisualDensity.compact) 
                  : null,
            ),
          );
        },
      ),
    );
  }
}

class _PublishUpdateForm extends StatefulWidget {
  final VoidCallback onSuccess;
  const _PublishUpdateForm({required this.onSuccess});

  @override
  State<_PublishUpdateForm> createState() => _PublishUpdateFormState();
}

class _PublishUpdateFormState extends State<_PublishUpdateForm> {
  final _versionCodeCtrl = TextEditingController();
  final _versionNameCtrl = TextEditingController();
  final _updateUrlCtrl = TextEditingController();
  final _releaseNotesCtrl = TextEditingController();
  bool _isMandatory = false;
  bool _isSubmitting = false;

  Future<void> _publish() async {
    final vCode = int.tryParse(_versionCodeCtrl.text.trim());
    final vName = _versionNameCtrl.text.trim();
    final url = _updateUrlCtrl.text.trim();
    final notes = _releaseNotesCtrl.text.trim();

    if (vCode == null || vName.isEmpty || url.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill all required fields correctly.')));
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      await Supabase.instance.client.from('app_updates').insert([{
        'version_code': vCode,
        'version_name': vName,
        'update_url': url,
        'release_notes': notes,
        'is_mandatory': _isMandatory,
      }]);
      if (mounted) {
        Navigator.pop(context);
        widget.onSuccess();
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Update published successfully!')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 16, right: 16, top: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('Publish New Update', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _versionCodeCtrl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Version Code (e.g. 15)'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: TextField(
                  controller: _versionNameCtrl,
                  decoration: const InputDecoration(labelText: 'Version Name (e.g. 1.0.4)'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _updateUrlCtrl,
            decoration: const InputDecoration(labelText: 'Update URL (App Store/Play Store)'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _releaseNotesCtrl,
            decoration: const InputDecoration(labelText: 'Release Notes'),
            maxLines: 3,
          ),
          const SizedBox(height: 12),
          SwitchListTile(
            title: const Text('Is Mandatory Update?'),
            value: _isMandatory,
            onChanged: (val) => setState(() => _isMandatory = val),
            activeColor: Colors.redAccent,
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _isSubmitting ? null : _publish,
            child: _isSubmitting ? const CircularProgressIndicator() : const Text('Publish Update'),
          ),
        ],
      ),
    );
  }
}
