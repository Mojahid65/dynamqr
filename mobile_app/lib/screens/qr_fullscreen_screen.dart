import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:image_gallery_saver_plus/image_gallery_saver_plus.dart';
import 'package:share_plus/share_plus.dart';
import 'dart:ui' as ui;
import 'package:lottie/lottie.dart';
import '../services/qr_customizer_service.dart';

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

      // Render the QR code on a solid white background canvas
      final size = 2048.0; // Reduced from 4096.0 to prevent memory crashes and improve speed
      final recorder = ui.PictureRecorder();
      final canvas = Canvas(recorder);
      final bgPaint = Paint()..color = Colors.white;
      canvas.drawRect(Rect.fromLTWH(0, 0, size, size), bgPaint);

      final quietZone = size * 0.08;
      final qrSize = size - (quietZone * 2);
      canvas.save();
      canvas.translate(quietZone, quietZone);
      painter.paint(canvas, Size(qrSize, qrSize));
      canvas.restore();

      final picture = recorder.endRecording();
      final img = await picture.toImage(size.toInt(), size.toInt());
      final pngData = await img.toByteData(format: ui.ImageByteFormat.png);

      if (pngData != null) {
        final pngBytes = pngData.buffer.asUint8List();
        
        // Save directly as PNG to bypass the slow and memory-intensive Dart image encoding
        final result = await ImageGallerySaverPlus.saveImage(
          pngBytes,
          quality: 100,
          name:
              "QR_HighRes_${widget.qrData['short_code']}_${DateTime.now().millisecondsSinceEpoch}",
        );
        if (result['isSuccess'] && mounted) {
          showDialog(
            context: context,
            barrierDismissible: false,
            builder: (context) {
              Future.delayed(const Duration(seconds: 2), () {
                if (Navigator.of(context).canPop()) {
                  Navigator.of(context).pop();
                }
              });
              return Dialog(
                backgroundColor: Colors.transparent,
                elevation: 0,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Lottie.asset(
                      'assets/googleicon/animations/dd583ac6-79f0-11ee-aa42-5348a68c3dac.json',
                      width: 200,
                      height: 200,
                      repeat: false,
                    ),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Text(
                        'Saved Successfully!',
                        style: TextStyle(
                          color: Colors.green,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              );
            },
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

    final config = widget.qrData['design_config'] as Map<String, dynamic>? ?? {};
    final theme = config['dotType'] ?? config['theme'] ?? widget.selectedTheme;
    final bgType = config['bgType'] ?? 'color';
    final bgImage = config['bgImage'] ?? '';
    final bgOpacity = (config['bgOpacity'] as num?)?.toDouble() ?? 0.85;
    final frameId = config['frameId'] ?? 'none';
    final logoType = config['logoType'] ?? 'none';
    final logoPresetId = config['logoPresetId'] ?? 'link';
    final logoUrl = config['logoUrl'] ?? '';

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.qrData['keyword'] ?? 'QR Preview'),
        actions: [
          IconButton(
            onPressed: _shareLink,
            icon: const Icon(Icons.share_rounded),
            tooltip: 'Share',
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Hero(
                        tag: 'qr-${widget.qrData['id']}',
                        child: CustomizedQrPreview(
                          qrData: widget.shortUrl,
                          size: MediaQuery.of(context).size.width * 0.76,
                          theme: theme,
                          fgColor: widget.selectedColor,
                          eyeColor: widget.selectedEyeColor,
                          bgColor: Colors.white,
                          bgType: bgType,
                          bgImageUrl: bgImage,
                          bgOpacity: bgOpacity,
                          frameId: frameId,
                          logoType: logoType,
                          logoPresetId: logoPresetId,
                          logoUrl: logoUrl,
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
