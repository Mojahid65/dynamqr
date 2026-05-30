import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

/// In-app donation screen.
///
/// We render a UPI QR code and the UPI ID directly so users can pay without
/// being sent to an external page. Tapping the "Pay with UPI app" button
/// builds a `upi://pay` deep link that any installed UPI app (GPay, PhonePe,
/// Paytm, BHIM, etc.) can intercept.
class DonateScreen extends StatelessWidget {
  const DonateScreen({super.key});

  static const String _upiId = 'mojahidhassan@upi';
  static const String _payeeName = 'Mojahid Hassan';

  static const List<int> _suggestedAmounts = [49, 99, 199, 499];

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;

    final upiUri = Uri.parse(
      'upi://pay'
      '?pa=$_upiId'
      '&pn=${Uri.encodeComponent(_payeeName)}'
      '&cu=INR'
      '&tn=${Uri.encodeComponent('Support DynamQR')}',
    );

    return Scaffold(
      appBar: AppBar(
        title: const Text('Support DynamQR'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Hero "Buy me a coffee" card using primaryContainer tone.
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: cs.primaryContainer,
                  borderRadius: BorderRadius.circular(28),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: cs.primary.withValues(alpha: 0.18),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Icon(
                        Icons.favorite_rounded,
                        color: cs.onPrimaryContainer,
                        size: 28,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Buy me a coffee ☕',
                            style: tt.titleMedium?.copyWith(
                              color: cs.onPrimaryContainer,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Your support keeps DynamQR running and helps fund new features.',
                            style: tt.bodySmall?.copyWith(
                              color: cs.onPrimaryContainer
                                  .withValues(alpha: 0.85),
                              height: 1.4,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // QR card with the UPI deep link encoded.
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: cs.surfaceContainerLow,
                  borderRadius: BorderRadius.circular(28),
                  border: Border.all(color: cs.outlineVariant),
                ),
                child: Column(
                  children: [
                    Text(
                      'Scan with any UPI app',
                      style: tt.labelLarge?.copyWith(
                        color: cs.onSurfaceVariant,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: QrImageView(
                        data: upiUri.toString(),
                        version: QrVersions.auto,
                        size: 220,
                        backgroundColor: Colors.white,
                        eyeStyle: const QrEyeStyle(
                          eyeShape: QrEyeShape.square,
                          color: Colors.black,
                        ),
                        dataModuleStyle: const QrDataModuleStyle(
                          dataModuleShape: QrDataModuleShape.square,
                          color: Colors.black,
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    // UPI ID pill — tap to copy
                    InkWell(
                      borderRadius: BorderRadius.circular(999),
                      onTap: () {
                        Clipboard.setData(
                            const ClipboardData(text: _upiId));
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                              content: Text('UPI ID copied to clipboard')),
                        );
                      },
                      child: Ink(
                        decoration: BoxDecoration(
                          color: cs.secondaryContainer,
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 10,
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.account_balance_wallet_rounded,
                                size: 16,
                                color: cs.onSecondaryContainer,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                _upiId,
                                style: tt.labelLarge?.copyWith(
                                  color: cs.onSecondaryContainer,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Icon(
                                Icons.copy_rounded,
                                size: 14,
                                color: cs.onSecondaryContainer
                                    .withValues(alpha: 0.7),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _payeeName,
                      style: tt.bodySmall
                          ?.copyWith(color: cs.onSurfaceVariant),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Quick amount chips
              Text(
                'Quick amounts',
                style: tt.labelLarge?.copyWith(
                  color: cs.onSurfaceVariant,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final amount in _suggestedAmounts)
                    ActionChip(
                      avatar: const Icon(Icons.currency_rupee_rounded,
                          size: 16),
                      label: Text('$amount'),
                      onPressed: () => _payWithAmount(context, amount),
                    ),
                  ActionChip(
                    avatar: const Icon(Icons.edit_rounded, size: 16),
                    label: const Text('Custom'),
                    onPressed: () => _askCustomAmount(context),
                  ),
                ],
              ),

              const SizedBox(height: 24),

              // Primary CTA — open default UPI app
              SizedBox(
                height: 54,
                child: FilledButton.icon(
                  onPressed: () => _launchUpi(context, upiUri),
                  icon: const Icon(Icons.payments_rounded),
                  label: const Text(
                    'Pay with UPI app',
                    style: TextStyle(fontSize: 15),
                  ),
                ),
              ),
              const SizedBox(height: 10),

              // Share UPI link
              SizedBox(
                height: 50,
                child: OutlinedButton.icon(
                  onPressed: () => SharePlus.instance.share(
                    ShareParams(
                      text:
                          'Support DynamQR by paying $_payeeName at $_upiId',
                    ),
                  ),
                  icon: const Icon(Icons.share_outlined, size: 18),
                  label: const Text('Share UPI link'),
                ),
              ),

              const SizedBox(height: 24),

              // Disclosure
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: cs.surfaceContainerHigh,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.info_outline_rounded,
                        size: 18, color: cs.onSurfaceVariant),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Donations are voluntary and non-refundable. '
                        'No goods or services are provided in exchange.',
                        style: tt.bodySmall?.copyWith(
                          color: cs.onSurfaceVariant,
                          height: 1.4,
                        ),
                      ),
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

  Future<void> _launchUpi(BuildContext context, Uri uri) async {
    final messenger = ScaffoldMessenger.of(context);
    final cs = Theme.of(context).colorScheme;
    try {
      final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!ok) throw Exception('No UPI app found');
    } catch (_) {
      messenger.showSnackBar(
        SnackBar(
          content:
              const Text('No UPI app found. The UPI ID is copied instead.'),
          backgroundColor: cs.errorContainer,
        ),
      );
      Clipboard.setData(const ClipboardData(text: _upiId));
    }
  }

  Future<void> _payWithAmount(BuildContext context, num amount) async {
    final uri = Uri.parse(
      'upi://pay'
      '?pa=$_upiId'
      '&pn=${Uri.encodeComponent(_payeeName)}'
      '&am=$amount'
      '&cu=INR'
      '&tn=${Uri.encodeComponent('Support DynamQR')}',
    );
    await _launchUpi(context, uri);
  }

  Future<void> _askCustomAmount(BuildContext context) async {
    final controller = TextEditingController();
    final amount = await showDialog<num?>(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          icon: const Icon(Icons.currency_rupee_rounded),
          title: const Text('Enter amount'),
          content: TextField(
            controller: controller,
            autofocus: true,
            keyboardType:
                const TextInputType.numberWithOptions(decimal: true),
            decoration: const InputDecoration(
              labelText: 'Amount',
              prefixText: '₹ ',
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () {
                final text = controller.text.trim();
                final value = num.tryParse(text);
                if (value != null && value > 0) Navigator.pop(ctx, value);
              },
              child: const Text('Pay'),
            ),
          ],
        );
      },
    );
    if (amount != null && context.mounted) {
      await _payWithAmount(context, amount);
    }
  }
}
