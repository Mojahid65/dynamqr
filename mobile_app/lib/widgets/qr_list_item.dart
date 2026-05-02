import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:screenshot/screenshot.dart';
import 'package:image_gallery_saver_plus/image_gallery_saver_plus.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:go_router/go_router.dart';
import '../core/constants.dart';
import '../core/notification_service.dart';

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
  Color _selectedColor = Colors.black;
  Color _selectedEyeColor = Colors.black;

  final List<String> _themes = ['Classic', 'Rounded', 'Thin', 'Smooth', 'Circles'];
  final Map<String, Color> _colors = {
    'Black': Colors.black,
    'Indigo': Colors.indigo,
    'Emerald': Colors.green,
    'Rose': Colors.pink,
    'Amber': Colors.amber,
  };

  QrDataModuleStyle _getModuleStyle() {
    switch (_selectedTheme) {
      case 'Rounded':
        return QrDataModuleStyle(dataModuleShape: QrDataModuleShape.circle, color: _selectedColor);
      case 'Thin':
        return QrDataModuleStyle(dataModuleShape: QrDataModuleShape.square, color: _selectedColor);
      case 'Smooth':
        return QrDataModuleStyle(dataModuleShape: QrDataModuleShape.circle, color: _selectedColor);
      case 'Circles':
        return QrDataModuleStyle(dataModuleShape: QrDataModuleShape.circle, color: _selectedColor);
      case 'Classic':
      default:
        return QrDataModuleStyle(dataModuleShape: QrDataModuleShape.square, color: _selectedColor);
    }
  }

  QrEyeStyle _getEyeStyle() {
    switch (_selectedTheme) {
      case 'Rounded':
        return QrEyeStyle(eyeShape: QrEyeShape.circle, color: _selectedEyeColor);
      case 'Smooth':
        return QrEyeStyle(eyeShape: QrEyeShape.circle, color: _selectedEyeColor);
      case 'Circles':
        return QrEyeStyle(eyeShape: QrEyeShape.circle, color: _selectedEyeColor);
      case 'Classic':
      case 'Thin':
      default:
        return QrEyeStyle(eyeShape: QrEyeShape.square, color: _selectedEyeColor);
    }
  }

  Future<void> _downloadQr() async {
    try {
      final shortUrl = 'https://dynamqr.vercel.app/${widget.qr['short_code']}';
      final painter = QrPainter(
        data: shortUrl,
        version: QrVersions.auto,
        eyeStyle: _getEyeStyle(),
        dataModuleStyle: _getModuleStyle(),
        color: _selectedColor,
        emptyColor: Colors.white,
      );
      
      final picData = await painter.toImageData(2048);
      if (picData != null) {
        final result = await ImageGallerySaverPlus.saveImage(
          picData.buffer.asUint8List(),
          quality: 100,
          name: "QR_${widget.qr['short_code']}_${DateTime.now().millisecondsSinceEpoch}",
        );
        if (result['isSuccess']) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('QR Code saved to gallery!'), backgroundColor: Colors.green),
            );
          }
          await NotificationService().showNotification(
            title: 'QR Code Saved',
            body: 'Successfully saved QR code for ${widget.qr['destination_url']} to your gallery.',
          );
        } else {
          throw Exception('Failed to save');
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error saving image. Make sure storage permission is granted.'), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final shortUrl = 'https://dynamqr.vercel.app/${widget.qr['short_code']}';
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      color: Theme.of(context).cardColor,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: isDark ? Colors.grey.shade800 : Colors.grey.shade200),
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
                  child: GestureDetector(
                    onTap: () {
                      context.push('/qr_fullscreen', extra: {
                        'qrData': widget.qr,
                        'shortUrl': shortUrl,
                        'selectedTheme': _selectedTheme,
                        'selectedColor': _selectedColor,
                        'selectedEyeColor': _selectedEyeColor,
                      });
                    },
                    child: Hero(
                      tag: 'qr-${widget.qr['id']}',
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          border: Border.all(color: isDark ? Colors.grey.shade800 : Colors.grey.shade200),
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
                            selectedColor: isDark ? Colors.indigo.shade900 : Colors.indigo.shade100,
                            backgroundColor: isDark ? Colors.grey.shade900 : Colors.white,
                            labelStyle: TextStyle(
                              color: isSelected 
                                ? (isDark ? Colors.white : Colors.indigo.shade900)
                                : (isDark ? Colors.grey.shade300 : Colors.black87),
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
            const SizedBox(height: 8),
            Row(
              children: [
                const Text('Color:  ', style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(width: 16),
                Expanded(
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: _colors.entries.map((entry) {
                        final colorName = entry.key;
                        final colorValue = entry.value;
                        final isSelected = _selectedColor == colorValue;
                        return Padding(
                          padding: const EdgeInsets.only(right: 8.0),
                          child: InkWell(
                            onTap: () {
                              setState(() {
                                _selectedColor = colorValue;
                                // If they were the same, keep them linked unless manually changed
                                if (_selectedEyeColor == _selectedColor) {
                                  _selectedEyeColor = colorValue;
                                }
                              });
                            },
                            child: Container(
                              width: 36,
                              height: 36,
                              decoration: BoxDecoration(
                                color: colorValue,
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: isSelected ? Colors.indigo : Colors.transparent,
                                  width: 3,
                                ),
                                boxShadow: [
                                  if (isSelected)
                                    BoxShadow(
                                      color: colorValue.withOpacity(0.4),
                                      blurRadius: 8,
                                      spreadRadius: 2,
                                    )
                                ],
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Text('Eye Color:', style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(width: 16),
                Expanded(
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: _colors.entries.map((entry) {
                        final colorValue = entry.value;
                        final isSelected = _selectedEyeColor == colorValue;
                        return Padding(
                          padding: const EdgeInsets.only(right: 8.0),
                          child: InkWell(
                            onTap: () {
                              setState(() {
                                _selectedEyeColor = colorValue;
                              });
                            },
                            child: Container(
                              width: 36,
                              height: 36,
                              decoration: BoxDecoration(
                                color: colorValue,
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: isSelected ? Colors.indigo : Colors.transparent,
                                  width: 3,
                                ),
                                boxShadow: [
                                  if (isSelected)
                                    BoxShadow(
                                      color: colorValue.withOpacity(0.4),
                                      blurRadius: 8,
                                      spreadRadius: 2,
                                    )
                                ],
                              ),
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
