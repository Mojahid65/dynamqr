import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:image_gallery_saver_plus/image_gallery_saver_plus.dart';
import 'package:share_plus/share_plus.dart';

class QrFullscreenScreen extends StatefulWidget {
  final Map<String, dynamic> qrData;
  final String shortUrl;
  final String selectedTheme;
  final Color selectedColor;
  final Color selectedEyeColor;

  const QrFullscreenScreen({
    super.key,
    required this.qrData,
    required this.shortUrl,
    required this.selectedTheme,
    required this.selectedColor,
    required this.selectedEyeColor,
  });

  @override
  State<QrFullscreenScreen> createState() => _QrFullscreenScreenState();
}

class _QrFullscreenScreenState extends State<QrFullscreenScreen> {
  bool _isExporting = false;

  QrDataModuleStyle _getModuleStyle() {
    switch (widget.selectedTheme) {
      case 'Rounded':
      case 'Smooth':
      case 'Circles':
        return QrDataModuleStyle(
          dataModuleShape: QrDataModuleShape.circle,
          color: widget.selectedColor,
        );
      default:
        return QrDataModuleStyle(
          dataModuleShape: QrDataModuleShape.square,
          color: widget.selectedColor,
        );
    }
  }

  QrEyeStyle _getEyeStyle() {
    switch (widget.selectedTheme) {
      case 'Rounded':
      case 'Smooth':
      case 'Circles':
        return QrEyeStyle(
          eyeShape: QrEyeShape.circle,
          color: widget.selectedEyeColor,
        );
      default:
        return QrEyeStyle(
          eyeShape: QrEyeShape.square,
          color: widget.selectedEyeColor,
        );
    }
  }

  Future<void> _exportHighQuality() async {
    setState(() => _isExporting = true);
    final cs = Theme.of(context).colorScheme;
    final messenger = ScaffoldMessenger.of(context);
    try {
      final painter = QrPainter(
        data: widget.shortUrl,
        version: QrVersions.auto,
        eyeStyle: _getEyeStyle(),
        dataModuleStyle: _getModuleStyle(),
      );

      final picData = await painter.toImageData(4096);
      if (picData != null) {
        final result = await ImageGallerySaverPlus.saveImage(
          picData.buffer.asUint8List(),
          quality: 100,
          name:
              "QR_HighRes_${widget.qrData['short_code']}_${DateTime.now().millisecondsSinceEpoch}",
        );
        if (result['isSuccess'] && mounted) {
          messenger.showSnackBar(
            const SnackBar(
              content: Text('High Quality QR Code saved to gallery'),
            ),
          );
        } else {
          throw Exception('Failed to save');
        }
      }
    } catch (_) {
      if (mounted) {
        messenger.showSnackBar(
          SnackBar(
            content: const Text(
                'Could not save image. Ensure storage permissions are granted.'),
            backgroundColor: cs.errorContainer,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isExporting = false);
    }
  }

  void _copyLink() {
    Clipboard.setData(ClipboardData(text: widget.shortUrl));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Link copied to clipboard')),
    );
  }

  void _shareLink() => SharePlus.instance.share(
        ShareParams(text: widget.shortUrl),
      );

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('QR Code'),
        actions: [
          IconButton(
            tooltip: 'Share',
            icon: const Icon(Icons.share_outlined),
            onPressed: _shareLink,
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Hero(
                        tag: 'qr-${widget.qrData['id']}',
                        child: Container(
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(28),
                            boxShadow: [
                              BoxShadow(
                                color: cs.shadow.withValues(alpha: 0.1),
                                blurRadius: 32,
                                offset: const Offset(0, 8),
                              ),
                            ],
                          ),
                          child: QrImageView(
                            data: widget.shortUrl,
                            version: QrVersions.auto,
                            size:
                                MediaQuery.of(context).size.width * 0.72,
                            backgroundColor: Colors.white,
                            eyeStyle: _getEyeStyle(),
                            dataModuleStyle: _getModuleStyle(),
                          ),
                        ),
                      ),
                      const SizedBox(height: 32),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: cs.secondaryContainer,
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.link_rounded,
                              size: 14,
                              color: cs.onSecondaryContainer,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              widget.shortUrl,
                              style: tt.labelMedium?.copyWith(
                                color: cs.onSecondaryContainer,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        widget.qrData['destination_url'] ?? '',
                        style: tt.titleMedium?.copyWith(
                          fontWeight: FontWeight.w500,
                        ),
                        textAlign: TextAlign.center,
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
              child: Column(
                children: [
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: FilledButton.icon(
                      onPressed: _isExporting ? null : _exportHighQuality,
                      icon: _isExporting
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                              ),
                            )
                          : const Icon(Icons.high_quality_rounded),
                      label: Text(
                        _isExporting
                            ? 'Exporting...'
                            : 'Export High Quality',
                        style: const TextStyle(fontSize: 15),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: OutlinedButton.icon(
                      onPressed: _copyLink,
                      icon: const Icon(Icons.copy_rounded, size: 18),
                      label: const Text('Copy Link'),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
