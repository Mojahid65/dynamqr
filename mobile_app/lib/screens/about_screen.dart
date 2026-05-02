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
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('About Developer'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const SizedBox(height: 24),
            CircleAvatar(
              radius: 60,
              backgroundColor: Colors.indigo.shade100,
              child: const Icon(Icons.person, size: 60, color: Colors.indigo),
            ),
            const SizedBox(height: 24),
            const Text(
              'Mojahid Hassan',
              style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'Indie Developer & Creator',
              style: TextStyle(fontSize: 16, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600),
            ),
            const SizedBox(height: 32),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: isDark ? Colors.grey.shade800 : Colors.grey.shade200),
              ),
              child: const Text(
                'DynamQR is built to make QR technology smarter, more flexible, and accessible for everyone. '
                'The goal is simple: your QR code should never be static. You should have full control to update, manage, and optimize your links anytime.\n\n'
                'Built with ❤️ for simplicity, speed, and freedom.',
                style: TextStyle(fontSize: 15, height: 1.5),
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(height: 32),
            const Text(
              'Connect with me',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.language, color: Colors.blue),
              title: const Text('Website'),
              subtitle: const Text('mojahidhassan.in'),
              onTap: () => _launchUrl('https://www.mojahidhassan.in/'),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              tileColor: Theme.of(context).cardColor,
            ),
            const SizedBox(height: 8),
            ListTile(
              leading: Icon(Icons.code, color: isDark ? Colors.white : Colors.black),
              title: const Text('GitHub'),
              subtitle: const Text('@Mojahid65'),
              onTap: () => _launchUrl('https://github.com/Mojahid65'),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              tileColor: Theme.of(context).cardColor,
            ),
            const SizedBox(height: 8),
            ListTile(
              leading: const Icon(Icons.camera_alt, color: Colors.pink),
              title: const Text('Instagram'),
              subtitle: const Text('@mojahid.in'),
              onTap: () => _launchUrl('https://www.instagram.com/mojahid.in/'),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              tileColor: Theme.of(context).cardColor,
            ),
          ],
        ),
      ),
    );
  }
}
