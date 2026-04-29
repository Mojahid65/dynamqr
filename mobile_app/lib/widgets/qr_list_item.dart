import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:screenshot/screenshot.dart';
import 'package:image_gallery_saver_plus/image_gallery_saver_plus.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:go_router/go_router.dart';
import '../core/constants.dart';

class QrListItemWidget extends StatefulWidget {
  final Map<String, dynamic> qr;
  final VoidCallback onRefresh;
  final Function(String id) onDelete;

  const QrListItemWidget({
    super.key,
    required this.qr,
    required this.onRefresh,
    required this.onDelete,
  });

  @override
  State<QrListItemWidget> createState() => _QrListItemWidgetState();
}

class _QrListItemWidgetState extends State<QrListItemWidget> {
  final ScreenshotController _screenshotController = ScreenshotController();
  String _selectedTheme = 'Classic';

  final List<String> _themes = ['Classic', 'Rounded', 'Thin', 'Smooth', 'Circles'];

  QrDataModuleStyle _getModuleStyle() {
    switch (_selectedTheme) {
      case 'Rounded':
        return const QrDataModuleStyle(dataModuleShape: QrDataModuleShape.circle, color: Colors.black);
      case 'Thin':
        return const QrDataModuleStyle(dataModuleShape: QrDataModuleShape.square, color: Colors.black); // thin requires custom paint or smaller size but square is fallback
      case 'Smooth':
        return const QrDataModuleStyle(dataModuleShape: QrDataModuleShape.circle, color: Colors.black);
      case 'Circles':
        return const QrDataModuleStyle(dataModuleShape: QrDataModuleShape.circle, color: Colors.black);
      case 'Classic':
      default:
        return const QrDataModuleStyle(dataModuleShape: QrDataModuleShape.square, color: Colors.black);
    }
  }

  QrEyeStyle _getEyeStyle() {
    switch (_selectedTheme) {
      case 'Rounded':
        return const QrEyeStyle(eyeShape: QrEyeShape.circle, color: Colors.black);
      case 'Smooth':
        return const QrEyeStyle(eyeShape: QrEyeShape.circle, color: Colors.black);
      case 'Circles':
        return const QrEyeStyle(eyeShape: QrEyeShape.circle, color: Colors.black);
      case 'Classic':
      case 'Thin':
      default:
        return const QrEyeStyle(eyeShape: QrEyeShape.square, color: Colors.black);
    }
  }

  Future<void> _downloadQr() async {
    final status = await Permission.storage.request();
    if (status.isGranted || await Permission.photos.request().isGranted) {
      try {
        final Uint8List? image = await _screenshotController.capture();
        if (image != null) {
          final result = await ImageGallerySaverPlus.saveImage(
            image,
            quality: 100,
            name: "QR_${widget.qr['short_code']}_${DateTime.now().millisecondsSinceEpoch}",
          );
          if (result['isSuccess']) {
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('QR Code saved to gallery!'), backgroundColor: Colors.green),
              );
            }
          } else {
            throw Exception('Failed to save');
          }
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error saving image: $e'), backgroundColor: Colors.red),
          );
        }
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Storage permission is required to save images.'), backgroundColor: Colors.orange),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final shortUrl = 'https://dynamqr.vercel.app/${widget.qr['short_code']}';

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      color: Colors.white,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Screenshot(
                  controller: _screenshotController,
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      border: Border.all(color: Colors.grey.shade200),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: QrImageView(
                      data: shortUrl,
                      version: QrVersions.auto,
                      size: 100.0,
                      backgroundColor: Colors.white,
                      eyeStyle: _getEyeStyle(),
                      dataModuleStyle: _getModuleStyle(),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.qr['destination_url'],
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.indigo.shade50,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          '/${widget.qr['keyword'] ?? widget.qr['short_code']}',
                          style: TextStyle(color: Colors.indigo.shade700, fontSize: 12, fontWeight: FontWeight.w600),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          IconButton(
                            icon: const Icon(Icons.download, size: 20, color: Colors.indigo),
                            onPressed: _downloadQr,
                            constraints: const BoxConstraints(),
                            padding: const EdgeInsets.all(8),
                          ),
                          IconButton(
                            icon: const Icon(Icons.edit, size: 20, color: Colors.grey),
                            onPressed: () async {
                              final result = await context.push('/edit', extra: widget.qr);
                              if (result == true) {
                                widget.onRefresh();
                              }
                            },
                            constraints: const BoxConstraints(),
                            padding: const EdgeInsets.all(8),
                          ),
                          IconButton(
                            icon: const Icon(Icons.delete, size: 20, color: Colors.grey),
                            onPressed: () {
                              showDialog(
                                context: context,
                                builder: (context) => AlertDialog(
                                  title: const Text('Delete QR Code?'),
                                  content: const Text('Are you sure you want to delete this QR code? This action cannot be undone.'),
                                  actions: [
                                    TextButton(
                                      onPressed: () => Navigator.pop(context),
                                      child: const Text('Cancel'),
                                    ),
                                    TextButton(
                                      onPressed: () {
                                        Navigator.pop(context);
                                        widget.onDelete(widget.qr['id']);
                                      },
                                      child: const Text('Delete', style: TextStyle(color: Colors.red)),
                                    ),
                                  ],
                                ),
                              );
                            },
                            constraints: const BoxConstraints(),
                            padding: const EdgeInsets.all(8),
                          ),
                        ],
                      )
                    ],
                  ),
                ),
              ],
            ),
            const Divider(height: 32),
            Row(
              children: [
                const Text('Theme:', style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(width: 16),
                Expanded(
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: _themes.map((theme) {
                        final isSelected = _selectedTheme == theme;
                        return Padding(
                          padding: const EdgeInsets.only(right: 8.0),
                          child: ChoiceChip(
                            label: Text(theme),
                            selected: isSelected,
                            onSelected: (selected) {
                              if (selected) {
                                setState(() {
                                  _selectedTheme = theme;
                                });
                              }
                            },
                            selectedColor: Colors.indigo.shade100,
                            labelStyle: TextStyle(
                              color: isSelected ? Colors.indigo.shade900 : Colors.black87,
                              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
