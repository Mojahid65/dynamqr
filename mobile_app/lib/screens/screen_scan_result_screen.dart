import 'dart:io';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter/services.dart';

class ScreenScanResultScreen extends StatefulWidget {
  final String imagePath;
  final String qrData;

  const ScreenScanResultScreen({
    super.key,
    required this.imagePath,
    required this.qrData,
  });

  @override
  State<ScreenScanResultScreen> createState() => _ScreenScanResultScreenState();
}

class _ScreenScanResultScreenState extends State<ScreenScanResultScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _animation;
  bool _isScanning = true;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );
    _animation = Tween<double>(begin: 0.1, end: 0.9).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: Curves.easeInOutSine,
      ),
    );

    _animationController.repeat(reverse: true);

    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() {
          _isScanning = false;
        });
        _animationController.stop();
        _showResult();
      }
    });
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void _showResult() {
    if (widget.qrData.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No QR Code found on screen.')),
      );
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) context.pop();
      });
      return;
    }

    final isUrl = Uri.tryParse(widget.qrData)?.hasAbsolutePath ?? false;

    showModalBottomSheet(
      context: context,
      isDismissible: false,
      enableDrag: false,
      backgroundColor: Colors.transparent,
      builder: (context) => _buildResultSheet(isUrl),
    );
  }

  Widget _buildResultSheet(bool isUrl) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Icon(
                isUrl ? Icons.link_rounded : Icons.text_snippet_rounded,
                color: Theme.of(context).colorScheme.primary,
                size: 28,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  isUrl ? 'Link Found' : 'Text Found',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(16),
            ),
            child: SelectableText(
              widget.qrData,
              style: Theme.of(context).textTheme.bodyLarge,
            ),
          ),
          const SizedBox(height: 24),
          if (isUrl)
            FilledButton.icon(
              onPressed: () async {
                final url = Uri.parse(widget.qrData);
                if (await canLaunchUrl(url)) {
                  await launchUrl(url, mode: LaunchMode.externalApplication);
                }
                if (mounted) context.pop();
                if (mounted) context.pop();
              },
              icon: const Icon(Icons.open_in_browser),
              label: const Text('Continue in Browser'),
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
            )
          else
            FilledButton.icon(
              onPressed: () {
                Clipboard.setData(ClipboardData(text: widget.qrData));
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Copied to clipboard')),
                );
              },
              icon: const Icon(Icons.copy_rounded),
              label: const Text('Copy Text'),
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
            ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: () {
              context.pop();
              context.pop();
            },
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          if (widget.imagePath.isNotEmpty)
            Image.file(
              File(widget.imagePath),
              fit: BoxFit.cover,
            )
          else
            const Center(child: Text("No screenshot available", style: TextStyle(color: Colors.white))),

          if (_isScanning)
            Container(
              color: Colors.black.withOpacity(0.5),
            ),

          if (_isScanning)
            AnimatedBuilder(
              animation: _animation,
              builder: (context, child) {
                return Positioned(
                  top: MediaQuery.of(context).size.height * _animation.value,
                  left: 0,
                  right: 0,
                  child: Container(
                    height: 4,
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.primary,
                      boxShadow: [
                        BoxShadow(
                          color: Theme.of(context).colorScheme.primary.withOpacity(0.8),
                          blurRadius: 12,
                          spreadRadius: 4,
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),

          Positioned(
            top: MediaQuery.of(context).padding.top + 16,
            left: 16,
            child: IconButton(
              icon: const Icon(Icons.close, color: Colors.white, size: 28),
              onPressed: () => context.pop(),
              style: IconButton.styleFrom(
                backgroundColor: Colors.black54,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
