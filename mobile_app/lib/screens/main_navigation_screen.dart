import 'package:flutter/material.dart';
import 'package:in_app_update/in_app_update.dart';
import 'create_qr_screen.dart';
import 'create_link_screen.dart';
import 'dashboard_screen.dart';
import 'dynamic_links_screen.dart';
import 'scanner_screen.dart';

/// Top-level scaffold that owns the persistent NavigationBar AND the
/// Create FAB. Hosting the FAB here (instead of inside each child screen)
/// guarantees correct positioning above the NavigationBar — the inner
/// screens were previously placing their FABs in their own Scaffold which
/// floated them behind the parent's nav bar.
class MainNavigationScreen extends StatefulWidget {
  final int initialIndex;

  const MainNavigationScreen({super.key, this.initialIndex = 0});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  late int _currentIndex;

  // Lift refresh callbacks up so the parent FAB can ask the active screen
  // to reload after a create flow finishes.
  final GlobalKey<DashboardScreenState> _dashboardKey =
      GlobalKey<DashboardScreenState>();
  final GlobalKey<DynamicLinksScreenState> _linksKey =
      GlobalKey<DynamicLinksScreenState>();

  late final List<Widget> _screens = [
    DashboardScreen(key: _dashboardKey),
    DynamicLinksScreen(key: _linksKey),
  ];

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _checkForUpdate();
  }

  Future<void> _checkForUpdate() async {
    try {
      AppUpdateInfo updateInfo = await InAppUpdate.checkForUpdate();
      if (updateInfo.updateAvailability == UpdateAvailability.updateAvailable) {
        if (updateInfo.flexibleUpdateAllowed) {
          await InAppUpdate.startFlexibleUpdate();
          await InAppUpdate.completeFlexibleUpdate();
        } else if (updateInfo.immediateUpdateAllowed) {
          await InAppUpdate.performImmediateUpdate();
        }
      }
    } catch (e) {
      debugPrint('Failed to check for updates: $e');
    }
  }

  Future<void> _onCreatePressed() async {
    if (_currentIndex == 0) {
      final result = await showModalBottomSheet<bool>(
        context: context,
        isScrollControlled: true,
        useSafeArea: true,
        builder: (_) => const CreateQrScreen(),
      );
      if (result == true) _dashboardKey.currentState?.refresh(fromCreate: true);
    } else {
      final result = await showModalBottomSheet<bool>(
        context: context,
        isScrollControlled: true,
        useSafeArea: true,
        builder: (_) => const CreateLinkScreen(),
      );
      if (result == true) _linksKey.currentState?.refresh();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: false,
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
      floatingActionButton: FloatingActionButton.extended(
        heroTag: 'fab_primary',
        icon: Icon(
          _currentIndex == 0
              ? Icons.add_rounded
              : Icons.add_link_rounded,
        ),
        label: Text(_currentIndex == 0 ? 'Create QR' : 'Create Link'),
        onPressed: _onCreatePressed,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex == 1 ? 2 : 0,
        onDestinationSelected: (i) {
          FocusManager.instance.primaryFocus?.unfocus();
          if (i == 1) {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => const ScannerScreen(),
              ),
            );
            return;
          }
          final newIndex = i == 2 ? 1 : 0;
          if (newIndex != _currentIndex) {
            setState(() => _currentIndex = newIndex);
          }
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.qr_code_2_outlined),
            selectedIcon: Icon(Icons.qr_code_2_rounded),
            label: 'QR Codes',
          ),
          NavigationDestination(
            icon: Icon(Icons.qr_code_scanner_rounded),
            label: 'Scan QR',
          ),
          NavigationDestination(
            icon: Icon(Icons.link_outlined),
            selectedIcon: Icon(Icons.link_rounded),
            label: 'Links',
          ),
        ],
      ),
    );
  }
}
