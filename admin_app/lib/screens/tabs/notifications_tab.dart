import 'dart:io';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:image_picker/image_picker.dart';
import 'package:cached_network_image/cached_network_image.dart';

class NotificationsTab extends StatefulWidget {
  const NotificationsTab({super.key});

  @override
  State<NotificationsTab> createState() => _NotificationsTabState();
}

class _NotificationsTabState extends State<NotificationsTab> {
  List<dynamic> history = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchHistory();
  }

  Future<void> _fetchHistory() async {
    try {
      final res = await Supabase.instance.client
          .from('notifications_history')
          .select('*')
          .order('created_at', ascending: false);
      if (mounted) {
        setState(() {
          history = res;
          isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => isLoading = false);
      }
    }
  }

  void _showSendNotificationModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => _SendNotificationForm(onSuccess: _fetchHistory),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) return const Center(child: CircularProgressIndicator());

    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showSendNotificationModal,
        icon: const Icon(Icons.send),
        label: const Text('Send Notification'),
      ),
      body: ListView.builder(
        itemCount: history.length,
        padding: const EdgeInsets.only(bottom: 80),
        itemBuilder: (context, index) {
          final h = history[index];
          final hasImage = h['image_url'] != null && h['image_url'].toString().isNotEmpty;
          return Card(
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (hasImage)
                  ClipRRect(
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                    child: CachedNetworkImage(
                      imageUrl: h['image_url'],
                      height: 150,
                      width: double.infinity,
                      fit: BoxFit.cover,
                      errorWidget: (context, url, error) => const Icon(Icons.error),
                    ),
                  ),
                ListTile(
                  leading: hasImage ? null : const Icon(Icons.notifications, size: 32),
                  title: Text(h['title'] ?? 'No Title', style: const TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: Text(h['body'] ?? 'No Body'),
                ),
                Padding(
                  padding: const EdgeInsets.only(left: 16, bottom: 12),
                  child: Text(
                    'Sent to: ${(h['target_users'] as List?)?.join(', ') ?? 'All'}',
                    style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant),
                  ),
                )
              ],
            ),
          );
        },
      ),
    );
  }
}

class _SendNotificationForm extends StatefulWidget {
  final VoidCallback onSuccess;
  const _SendNotificationForm({required this.onSuccess});

  @override
  State<_SendNotificationForm> createState() => _SendNotificationFormState();
}

class _SendNotificationFormState extends State<_SendNotificationForm> {
  final _titleCtrl = TextEditingController();
  final _bodyCtrl = TextEditingController();
  File? _selectedImage;
  bool _isSubmitting = false;
  
  List<Map<String, dynamic>> _allProfiles = [];
  List<Map<String, dynamic>> _selectedUsers = [];

  @override
  void initState() {
    super.initState();
    _fetchProfiles();
  }

  Future<void> _fetchProfiles() async {
    try {
      final data = await Supabase.instance.client
          .from('profiles')
          .select('id, email, avatar_url, push_token')
          .not('push_token', 'is', null);
      if (mounted) {
        setState(() {
          _allProfiles = List<Map<String, dynamic>>.from(data);
        });
      }
    } catch (e) {
      // Ignore
    }
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery, imageQuality: 70);
    if (picked != null) {
      setState(() => _selectedImage = File(picked.path));
    }
  }

  void _showUserPicker() {
    showDialog(
      context: context,
      builder: (ctx) {
        String searchQuery = '';
        return StatefulBuilder(
          builder: (context, setStateDialog) {
            final filtered = _allProfiles.where((p) {
              final email = (p['email'] ?? '').toString().toLowerCase();
              return email.contains(searchQuery.toLowerCase());
            }).toList();

            return AlertDialog(
              title: const Text('Select Users'),
              content: SizedBox(
                width: double.maxFinite,
                height: 400,
                child: Column(
                  children: [
                    TextField(
                      decoration: const InputDecoration(
                        labelText: 'Search by Email',
                        prefixIcon: Icon(Icons.search),
                      ),
                      onChanged: (val) => setStateDialog(() => searchQuery = val),
                    ),
                    const SizedBox(height: 16),
                    Expanded(
                      child: ListView.builder(
                        itemCount: filtered.length,
                        itemBuilder: (context, index) {
                          final user = filtered[index];
                          final isSelected = _selectedUsers.any((u) => u['id'] == user['id']);
                          return CheckboxListTile(
                            value: isSelected,
                            onChanged: (val) {
                              setStateDialog(() {
                                if (val == true) {
                                  _selectedUsers.add(user);
                                } else {
                                  _selectedUsers.removeWhere((u) => u['id'] == user['id']);
                                }
                              });
                              setState(() {});
                            },
                            secondary: CircleAvatar(
                              backgroundImage: user['avatar_url'] != null ? NetworkImage(user['avatar_url']) : null,
                              child: user['avatar_url'] == null ? const Icon(Icons.person) : null,
                            ),
                            title: Text(user['email'] ?? ''),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Done'),
                ),
              ],
            );
          }
        );
      },
    );
  }

  Future<void> _sendPush() async {
    final title = _titleCtrl.text.trim();
    final body = _bodyCtrl.text.trim();
    
    if (title.isEmpty || body.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Title and body required')));
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      String? finalImageUrl;

      if (_selectedImage != null) {
        final ext = _selectedImage!.path.split('.').last;
        final fileName = '${DateTime.now().millisecondsSinceEpoch}.$ext';
        
        await Supabase.instance.client.storage
            .from('notifications')
            .upload(fileName, _selectedImage!);

        finalImageUrl = Supabase.instance.client.storage
            .from('notifications')
            .getPublicUrl(fileName);
      }
      
      final isBroadcast = _selectedUsers.isEmpty;
      List<String>? tokens;
      List<String> targetEmails = [];
      
      if (!isBroadcast) {
        targetEmails = _selectedUsers.map((u) => u['email'] as String).toList();
        tokens = _selectedUsers.map((u) => u['push_token'] as String).toList();
        
        if (tokens.isEmpty) {
          throw 'None of the specified users have valid Push Tokens registered.';
        }
      }

      final payload = {
        'title': title,
        'body': body,
        'imageUrl': finalImageUrl,
        'image': finalImageUrl,
        'tokens': isBroadcast ? null : tokens,
      };

      await Supabase.instance.client.functions.invoke('send_push_notification', body: payload);

      await Supabase.instance.client.from('notifications_history').insert([{
        'title': title,
        'body': body,
        'image_url': finalImageUrl,
        'target_users': isBroadcast ? ['All Users'] : targetEmails,
      }]);

      if (mounted) {
        Navigator.pop(context);
        widget.onSuccess();
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Sent successfully!')));
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
          const Text('Send Push Notification', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          
          ListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(_selectedUsers.isEmpty ? 'Target: Broadcast to All Users' : 'Target: ${_selectedUsers.length} Selected User(s)'),
            subtitle: _selectedUsers.isNotEmpty ? Wrap(
              spacing: 8,
              children: _selectedUsers.map((u) => Chip(
                avatar: CircleAvatar(
                  backgroundImage: u['avatar_url'] != null ? NetworkImage(u['avatar_url']) : null,
                  child: u['avatar_url'] == null ? const Icon(Icons.person, size: 12) : null,
                ),
                label: Text(u['email'] ?? '', style: const TextStyle(fontSize: 10)),
                onDeleted: () => setState(() => _selectedUsers.removeWhere((x) => x['id'] == u['id'])),
              )).toList(),
            ) : null,
            trailing: OutlinedButton.icon(
              onPressed: _showUserPicker,
              icon: const Icon(Icons.person_search),
              label: const Text('Pick Users'),
            ),
          ),
          const Divider(),
          const SizedBox(height: 12),
          
          TextField(
            controller: _titleCtrl,
            decoration: const InputDecoration(labelText: 'Title'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _bodyCtrl,
            decoration: const InputDecoration(labelText: 'Body'),
            maxLines: 3,
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: _pickImage,
            icon: const Icon(Icons.image),
            label: Text(_selectedImage == null ? 'Attach Image' : 'Change Image'),
          ),
          if (_selectedImage != null) ...[
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.file(_selectedImage!, height: 120, fit: BoxFit.cover),
            ),
          ],
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _isSubmitting ? null : _sendPush,
            child: _isSubmitting ? const CircularProgressIndicator() : const Text('Send Notification'),
          ),
        ],
      ),
    );
  }
}
