import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  Future<void> _launchUrl(String urlString) async {
    final url = Uri.parse(urlString);
    try {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    } catch (e) {
      debugPrint('Could not launch $urlString: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      body: NestedScrollView(
        headerSliverBuilder: (context, _) => [
          const SliverAppBar.large(
            title: Text('About'),
          ),
        ],
        body: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 8),
              Container(
                width: 96,
                height: 96,
                decoration: BoxDecoration(
                  color: scheme.primaryContainer,
                  borderRadius: BorderRadius.circular(28),
                ),
                child: Icon(
                  Icons.person_rounded,
                  size: 56,
                  color: scheme.onPrimaryContainer,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Mojahid Hassan',
                style: Theme.of(context)
                    .textTheme
                    .headlineSmall
                    ?.copyWith(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 4),
              Text(
                'Indie Developer & Creator',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: scheme.onSurfaceVariant,
                    ),
              ),
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: scheme.surfaceContainerLow,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  'DynamQR makes QR technology smarter, more flexible, and accessible for everyone. '
                  'The goal is simple: your QR code should never be static. You should have full control to update, manage, and optimize your links anytime.\n\n'
                  'Built with care for simplicity, speed, and freedom.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        height: 1.5,
                        color: scheme.onSurfaceVariant,
                      ),
                  textAlign: TextAlign.center,
                ),
              ),
              const SizedBox(height: 24),
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'Connect',
                  style: Theme.of(context)
                      .textTheme
                      .titleMedium
                      ?.copyWith(fontWeight: FontWeight.w600),
                ),
              ),
              const SizedBox(height: 8),
              Card(
                child: Column(
                  children: [
                    ListTile(
                      leading: const Icon(Icons.language_rounded),
                      title: const Text('Website'),
                      subtitle: const Text('mojahidhassan.in'),
                      trailing: const Icon(Icons.open_in_new_rounded, size: 18),
                      onTap: () =>
                          _launchUrl('https://www.mojahidhassan.in/'),
                    ),
                    Divider(height: 1, color: scheme.outlineVariant),
                    ListTile(
                      leading: const Icon(Icons.code_rounded),
                      title: const Text('GitHub'),
                      subtitle: const Text('@Mojahid65'),
                      trailing: const Icon(Icons.open_in_new_rounded, size: 18),
                      onTap: () => _launchUrl('https://github.com/Mojahid65'),
                    ),
                    Divider(height: 1, color: scheme.outlineVariant),
                    ListTile(
                      leading: const Icon(Icons.camera_alt_outlined),
                      title: const Text('Instagram'),
                      subtitle: const Text('@mojahid.in'),
                      trailing: const Icon(Icons.open_in_new_rounded, size: 18),
                      onTap: () =>
                          _launchUrl('https://www.instagram.com/mojahid.in/'),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
