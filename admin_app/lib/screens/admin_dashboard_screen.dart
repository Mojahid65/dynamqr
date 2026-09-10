import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../providers/theme_provider.dart';
import 'tabs/overview_tab.dart';
import 'tabs/users_tab.dart';
import 'tabs/qrcodes_tab.dart';
import 'tabs/updates_tab.dart';
import 'tabs/notifications_tab.dart';
import 'tabs/settings_tab.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  int _selectedIndex = 0;

  final List<Widget> _pages = const [
    OverviewTab(),
    UsersTab(),
    QRCodesTab(),
    UpdatesTab(),
    NotificationsTab(),
    SettingsTab(),
  ];

  final List<String> _titles = const [
    'Overview',
    'Users',
    'QR Codes',
    'App Updates',
    'Notifications',
    'Settings',
  ];

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final themeProvider = context.watch<ThemeProvider>();

    return Scaffold(
      appBar: AppBar(
        title: Text(_titles[_selectedIndex]),
        actions: [
          IconButton(
            icon: Icon(
              themeProvider.themeMode == ThemeMode.dark ? Icons.light_mode : Icons.dark_mode,
            ),
            onPressed: () => themeProvider.setTheme(themeProvider.themeMode == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark),
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await Supabase.instance.client.auth.signOut();
              if (mounted) context.go('/login');
            },
          ),
        ],
      ),
      body: Row(
        children: [
          if (MediaQuery.of(context).size.width >= 600)
            NavigationRail(
              selectedIndex: _selectedIndex,
              onDestinationSelected: (int index) {
                setState(() => _selectedIndex = index);
              },
              labelType: NavigationRailLabelType.all,
              destinations: const [
                NavigationRailDestination(
                  icon: Icon(Icons.dashboard_outlined),
                  selectedIcon: Icon(Icons.dashboard),
                  label: Text('Overview'),
                ),
                NavigationRailDestination(
                  icon: Icon(Icons.people_outline),
                  selectedIcon: Icon(Icons.people),
                  label: Text('Users'),
                ),
                NavigationRailDestination(
                  icon: Icon(Icons.qr_code_2_outlined),
                  selectedIcon: Icon(Icons.qr_code_2),
                  label: Text('QR Codes'),
                ),
                NavigationRailDestination(
                  icon: Icon(Icons.system_update_outlined),
                  selectedIcon: Icon(Icons.system_update),
                  label: Text('Updates'),
                ),
                NavigationRailDestination(
                  icon: Icon(Icons.notifications_outlined),
                  selectedIcon: Icon(Icons.notifications),
                  label: Text('Alerts'),
                ),
                NavigationRailDestination(
                  icon: Icon(Icons.settings_outlined),
                  selectedIcon: Icon(Icons.settings),
                  label: Text('Settings'),
                ),
              ],
            ),
          Expanded(
            child: _pages[_selectedIndex],
          ),
        ],
      ),
      drawer: MediaQuery.of(context).size.width < 600
          ? Drawer(
              child: ListView(
                padding: EdgeInsets.zero,
                children: [
                  DrawerHeader(
                    decoration: BoxDecoration(
                      color: cs.primaryContainer,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.admin_panel_settings, size: 48, color: cs.onPrimaryContainer),
                        const Spacer(),
                        Text(
                          'DynamQR Admin',
                          style: TextStyle(
                            color: cs.onPrimaryContainer,
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          Supabase.instance.client.auth.currentUser?.email ?? 'Unknown User',
                          style: TextStyle(
                            color: cs.onPrimaryContainer.withOpacity(0.8),
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                  _buildDrawerItem(0, Icons.dashboard_outlined, Icons.dashboard, 'Overview'),
                  _buildDrawerItem(1, Icons.people_outline, Icons.people, 'Users'),
                  _buildDrawerItem(2, Icons.qr_code_2_outlined, Icons.qr_code_2, 'QR Codes'),
                  _buildDrawerItem(3, Icons.system_update_outlined, Icons.system_update, 'App Updates'),
                  _buildDrawerItem(4, Icons.notifications_outlined, Icons.notifications, 'Notifications'),
                  const Divider(),
                  _buildDrawerItem(5, Icons.settings_outlined, Icons.settings, 'Settings'),
                ],
              ),
            )
          : null,
    );
  }

  Widget _buildDrawerItem(int index, IconData icon, IconData selectedIcon, String title) {
    final isSelected = _selectedIndex == index;
    return ListTile(
      leading: Icon(isSelected ? selectedIcon : icon),
      title: Text(title, style: TextStyle(fontWeight: isSelected ? FontWeight.bold : FontWeight.normal)),
      selected: isSelected,
      onTap: () {
        setState(() => _selectedIndex = index);
        Navigator.pop(context); // Close drawer
      },
    );
  }
}
