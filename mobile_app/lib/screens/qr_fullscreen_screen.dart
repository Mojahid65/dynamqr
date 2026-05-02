import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:image_gallery_saver_plus/image_gallery_saver_plus.dart';

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
        return QrDataModuleStyle(dataModuleShape: QrDataModuleShape.circle, color: widget.selectedColor);
      case 'Thin':
        return QrDataModuleStyle(dataModuleShape: QrDataModuleShape.square, color: widget.selectedColor);
      case 'Smooth':
        return QrDataModuleStyle(dataModuleShape: QrDataModuleShape.circle, color: widget.selectedColor);
      case 'Circles':
        return QrDataModuleStyle(dataModuleShape: QrDataModuleShape.circle, color: widget.selectedColor);
      case 'Classic':
      default:
        return QrDataModuleStyle(dataModuleShape: QrDataModuleShape.square, color: widget.selectedColor);
    }
  }

  QrEyeStyle _getEyeStyle() {
    switch (widget.selectedTheme) {
      case 'Rounded':
        return QrEyeStyle(eyeShape: QrEyeShape.circle, color: widget.selectedEyeColor);
      case 'Smooth':
        return QrEyeStyle(eyeShape: QrEyeShape.circle, color: widget.selectedEyeColor);
      case 'Circles':
        return QrEyeStyle(eyeShape: QrEyeShape.circle, color: widget.selectedEyeColor);
      case 'Classic':
      case 'Thin':
      default:
        return QrEyeStyle(eyeShape: QrEyeShape.square, color: widget.selectedEyeColor);
    }
  }

  Future<void> _exportHighQuality() async {
    setState(() => _isExporting = true);
    try {
      final painter = QrPainter(
        data: widget.shortUrl,
        version: QrVersions.auto,
        eyeStyle: _getEyeStyle(),
        dataModuleStyle: _getModuleStyle(),
        color: widget.selectedColor,
        emptyColor: Colors.white,
      );
      
      // Export at extremely high resolution for printing (4096px)
      final picData = await painter.toImageData(4096);
      if (picData != null) {
        final result = await ImageGallerySaverPlus.saveImage(
          picData.buffer.asUint8List(),
          quality: 100,
          name: "QR_HighRes_${widget.qrData['short_code']}_${DateTime.now().millisecondsSinceEpoch}",
        );
        if (result['isSuccess'] && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('High Quality QR Code saved to gallery!'), 
              backgroundColor: Colors.green,
              behavior: SnackBarBehavior.floating,
            ),
          );
        } else {
          throw Exception('Failed to save');
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error saving image. Ensure storage permissions are granted.'), 
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isExporting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    // We force a dark background for the fullscreen view or use scaffold background.
    // The QR code itself remains on a white background for scanability.
    return Scaffold(
      backgroundColor: Colors.black, // AMOLED dark background
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
        title: const Text('QR Code', style: TextStyle(color: Colors.white)),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: Center(
                child: Hero(
                  tag: 'qr-${widget.qrData['id']}',
                  child: Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: Colors.white, // Keep QR background white
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: QrImageView(
                      data: widget.shortUrl,
                      version: QrVersions.auto,
                      size: MediaQuery.of(context).size.width * 0.8,
                      backgroundColor: Colors.white,
                      eyeStyle: _getEyeStyle(),
                      dataModuleStyle: _getModuleStyle(),
                    ),
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(32.0),
              child: Column(
                children: [
                  Text(
                    widget.qrData['destination_url'],
                    style: const TextStyle(color: Colors.white70, fontSize: 16),
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton.icon(
                      onPressed: _isExporting ? null : _exportHighQuality,
                      icon: _isExporting 
                        ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Icon(Icons.high_quality, size: 28),
                      label: Text(
                        _isExporting ? 'Exporting...' : 'Export High Quality',
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: widget.selectedColor,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
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
