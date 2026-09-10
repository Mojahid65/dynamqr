import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class SettingsTab extends StatefulWidget {
  const SettingsTab({super.key});

  @override
  State<SettingsTab> createState() => _SettingsTabState();
}

class _SettingsTabState extends State<SettingsTab> {
  bool maintenanceMode = false;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchSettings();
  }

  Future<void> _fetchSettings() async {
    try {
      final res = await Supabase.instance.client
          .from('app_settings')
          .select('maintenance_mode')
          .eq('id', 1)
          .maybeSingle();
      if (mounted) {
        setState(() {
          maintenanceMode = res?['maintenance_mode'] ?? false;
          isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => isLoading = false);
      }
    }
  }

  Future<void> _toggleMaintenance(bool val) async {
    try {
      await Supabase.instance.client
          .from('app_settings')
          .update({'maintenance_mode': val})
          .eq('id', 1);
      if (mounted) {
        setState(() => maintenanceMode = val);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) return const Center(child: CircularProgressIndicator());

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        SwitchListTile(
          title: const Text('Maintenance Mode'),
          subtitle: const Text('Prevent users from accessing the app'),
          value: maintenanceMode,
          onChanged: _toggleMaintenance,
          activeColor: Colors.redAccent,
        ),
      ],
    );
  }
}
