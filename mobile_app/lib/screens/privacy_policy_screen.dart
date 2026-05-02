import 'package:flutter/material.dart';

class PrivacyPolicyScreen extends StatelessWidget {
  const PrivacyPolicyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Privacy Policy'),
      ),
      body: const SingleChildScrollView(
        padding: EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Privacy Policy for DynamQR',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 16),
            Text(
              'Last updated: May 2026',
              style: TextStyle(color: Colors.grey),
            ),
            SizedBox(height: 24),
            Text(
              '1. Introduction\n\n'
              'Welcome to DynamQR. We respect your privacy and are committed to protecting your personal data. '
              'This privacy policy will inform you as to how we look after your personal data when you use our mobile application '
              'and tell you about your privacy rights and how the law protects you.\n\n'
              '2. The Data We Collect About You\n\n'
              'We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:\n'
              '• Identity Data includes email address and name if provided during authentication.\n'
              '• Technical Data includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location.\n'
              '• Usage Data includes information about how you use our app, the links you create and scan.\n\n'
              '3. How We Use Your Personal Data\n\n'
              'We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:\n'
              '• Where we need to perform the contract we are about to enter into or have entered into with you.\n'
              '• Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.\n'
              '• Where we need to comply with a legal obligation.\n\n'
              '4. Data Security\n\n'
              'We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorised way, altered or disclosed.\n\n'
              '5. Contact Us\n\n'
              'If you have any questions about this privacy policy or our privacy practices, please contact us at: hello@mojahidhassan.in',
              style: TextStyle(fontSize: 15, height: 1.5),
            ),
          ],
        ),
      ),
    );
  }
}
