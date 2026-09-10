import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class UsersTab extends StatefulWidget {
  const UsersTab({super.key});

  @override
  State<UsersTab> createState() => _UsersTabState();
}

class _UsersTabState extends State<UsersTab> {
  List<dynamic> users = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchUsers();
  }

  Future<void> _fetchUsers() async {
    try {
      final res = await Supabase.instance.client
          .from('profiles')
          .select('*')
          .order('created_at', ascending: false);
      if (mounted) {
        setState(() {
          users = res;
          isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => isLoading = false);
      }
    }
  }

  Future<void> _toggleBan(String userId, bool currentStatus) async {
    try {
      await Supabase.instance.client
          .from('profiles')
          .update({'is_banned': !currentStatus})
          .eq('id', userId);
      _fetchUsers();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) return const Center(child: CircularProgressIndicator());

    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: users.length,
      itemBuilder: (context, index) {
        final user = users[index];
        final isBanned = user['is_banned'] ?? false;
        final hasPushToken = user['push_token'] != null;
        
        return Card(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          elevation: 0,
          color: Theme.of(context).colorScheme.surfaceContainer,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
            side: BorderSide(
              color: isBanned 
                ? Colors.redAccent.withValues(alpha: 0.3) 
                : Theme.of(context).colorScheme.outlineVariant,
            )
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 24,
                  backgroundColor: isBanned 
                    ? Colors.redAccent.withValues(alpha: 0.2) 
                    : Theme.of(context).colorScheme.primaryContainer,
                  child: Icon(
                    isBanned ? Icons.block : Icons.person,
                    color: isBanned ? Colors.redAccent : Theme.of(context).colorScheme.primary,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        user['email'] ?? 'Unknown Email',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          if (hasPushToken) ...[
                            Icon(Icons.notifications_active, size: 14, color: Theme.of(context).colorScheme.primary),
                            const SizedBox(width: 4),
                            Text('Push Enabled', style: TextStyle(fontSize: 10, color: Theme.of(context).colorScheme.primary)),
                          ] else ...[
                            const Icon(Icons.notifications_off, size: 14, color: Colors.grey),
                            const SizedBox(width: 4),
                            const Text('No Push', style: TextStyle(fontSize: 10, color: Colors.grey)),
                          ]
                        ],
                      )
                    ],
                  ),
                ),
                Column(
                  children: [
                    Text(isBanned ? 'BANNED' : 'ACTIVE', 
                      style: TextStyle(
                        fontSize: 10, 
                        fontWeight: FontWeight.bold,
                        color: isBanned ? Colors.redAccent : Colors.green
                      )
                    ),
                    Switch(
                      value: !isBanned,
                      onChanged: (val) => _toggleBan(user['id'], isBanned),
                      activeColor: Colors.green,
                      inactiveThumbColor: Colors.redAccent,
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
