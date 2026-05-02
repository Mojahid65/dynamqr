import 'package:flutter/material.dart';

class TermsScreen extends StatelessWidget {
  const TermsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Terms of Service'),
      ),
      body: const SingleChildScrollView(
        padding: EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Terms of Service for DynamQR',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 16),
            Text(
              'Last updated: May 2026',
              style: TextStyle(color: Colors.grey),
            ),
            SizedBox(height: 24),
            Text(
              '1. Acceptance of Terms\n\n'
              'By accessing and using DynamQR, you accept and agree to be bound by the terms and provision of this agreement. '
              'In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.\n\n'
              '2. Description of Service\n\n'
              'DynamQR provides users with a platform to create, manage, and track dynamic QR codes. '
              'You understand and agree that the service is provided "AS-IS" and that DynamQR assumes no responsibility for the timeliness, deletion, mis-delivery or failure to store any user communications or personalization settings.\n\n'
              '3. User Account, Password, and Security\n\n'
              'You are responsible for maintaining the confidentiality of the password and account and are fully responsible for all activities that occur under your password or account.\n\n'
              '4. Prohibited Uses\n\n'
              'You agree not to use the service to generate QR codes linking to illegal, harmful, threatening, abusive, harassing, tortious, defamatory, vulgar, obscene, libelous, invasive of another\'s privacy, hateful, or racially, ethnically or otherwise objectionable content.\n\n'
              '5. Modifications to Service\n\n'
              'DynamQR reserves the right at any time and from time to time to modify or discontinue, temporarily or permanently, the service (or any part thereof) with or without notice.\n\n'
              '6. Contact Information\n\n'
              'If you have any questions or concerns about these Terms, please contact us at: hello@mojahidhassan.in',
              style: TextStyle(fontSize: 15, height: 1.5),
            ),
          ],
        ),
      ),
    );
  }
}
