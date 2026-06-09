import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:image_gallery_saver_plus/image_gallery_saver_plus.dart';
import 'package:share_plus/share_plus.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/notification_service.dart';
import 'dart:ui' as ui;
import 'package:image/image.dart' as img_lib;

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
  final _supabase = Supabase.instance.client;
  String _selectedTheme = 'Classic';
  Color _selectedColor = Colors.black;
  Color _selectedEyeColor = Colors.black;
  bool _expanded = false;

  static const List<String> _themes = [
    'Classic',
    'Rounded',
    'Thin',
    'Smooth',
    'Circles',
  ];

  static const Map<String, Color> _colors = {
    'Black': Colors.black,
    'Indigo': Color(0xFF4F46E5),
    'Emerald': Color(0xFF10B981),
    'Rose': Color(0xFFEC4899),
    'Amber': Color(0xFFF59E0B),
  };

  @override
  void initState() {
    super.initState();
    _loadStyleForThisQr();
  }

  /// Load this QR's saved style from its own `design_config` row.
  /// Falls back to the user-level account metadata for legacy data
  /// created before per-QR styles existed.
  Future<void> _loadStyleForThisQr() async {
    final config = widget.qr['design_config'] as Map<String, dynamic>?;

    String? theme;
    String? color;
    String? eyeColor;

    if (config != null) {
      theme = config['theme'] as String?;
      color = config['color'] as String?;
      eyeColor = config['eye_color'] as String?;
    }

    // Legacy fallback to user metadata only when this row has no style yet.
    if (theme == null && color == null && eyeColor == null) {
      final metadata = _supabase.auth.currentUser?.userMetadata;
      if (metadata != null) {
        theme = metadata['qr_theme'] as String?;
        color = metadata['qr_color'] as String?;
        eyeColor = metadata['qr_eye_color'] as String?;
      }
    }

    if (!mounted) return;
    setState(() {
      if (theme != null && _themes.contains(theme)) {
        _selectedTheme = theme;
      }
      _selectedColor = _hexToColor(color) ?? _selectedColor;
      _selectedEyeColor = _hexToColor(eyeColor) ?? _selectedEyeColor;
    });
  }

  /// Persist this QR's style to ITS OWN row's `design_config`.
  /// We merge with any existing config (e.g. `is_link`) so we never lose
  /// other flags. This fixes the bug where customizing one QR was changing
  /// every other QR because we used to write to a single account-wide value.
  Future<void> _saveStyleForThisQr() async {
    try {
      final existing =
          (widget.qr['design_config'] as Map<String, dynamic>?) ?? {};
      final merged = <String, dynamic>{
        ...existing,
        'theme': _selectedTheme,
        'color': _colorToHex(_selectedColor),
        'eye_color': _colorToHex(_selectedEyeColor),
      };
      await _supabase
          .from('qr_codes')
          .update({'design_config': merged}).eq('id', widget.qr['id']);
      // Update the in-memory map so other consumers see the new style without
      // a full refresh.
      widget.qr['design_config'] = merged;
    } catch (e) {
      debugPrint('Failed to save QR style: $e');
    }
  }

  String _colorToHex(Color color) {
    final hex = color.toARGB32().toRadixString(16).padLeft(8, '0');
    return '#$hex';
  }

  Color? _hexToColor(String? hex) {
    if (hex == null || hex.isEmpty) return null;
    final cleaned = hex.replaceFirst('#', '');
    if (cleaned.length != 8) return null;
    final value = int.tryParse(cleaned, radix: 16);
    if (value == null) return null;
    return Color(value);
  }

  QrDataModuleStyle _getModuleStyle() {
    switch (_selectedTheme) {
      case 'Rounded':
      case 'Smooth':
      case 'Circles':
        return QrDataModuleStyle(
          dataModuleShape: QrDataModuleShape.circle,
          color: _selectedColor,
        );
      default:
        return QrDataModuleStyle(
          dataModuleShape: QrDataModuleShape.square,
          color: _selectedColor,
        );
    }
  }

  QrEyeStyle _getEyeStyle() {
    switch (_selectedTheme) {
      case 'Rounded':
      case 'Smooth':
      case 'Circles':
        return QrEyeStyle(
          eyeShape: QrEyeShape.circle,
          color: _selectedEyeColor,
        );
      default:
        return QrEyeStyle(
          eyeShape: QrEyeShape.square,
          color: _selectedEyeColor,
        );
    }
  }

  Future<void> _downloadQr() async {
    final messenger = ScaffoldMessenger.of(context);
    final cs = Theme.of(context).colorScheme;
    try {
      final shortUrl = 'https://dynamqr.vercel.app/${widget.qr['short_code']}';
      final painter = QrPainter(
        data: shortUrl,
        version: QrVersions.auto,
        eyeStyle: _getEyeStyle(),
        dataModuleStyle: _getModuleStyle(),
      );

      final picData = await painter.toImageData(2048); // We keep painter instance
      
      // Render the QR code on a solid white background canvas
      final size = 2048.0;
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
        
        // Convert PNG to JPG
        final decodedImage = img_lib.decodePng(pngBytes);
        if (decodedImage == null) throw Exception('Failed to decode PNG');
        final jpgBytes = img_lib.encodeJpg(decodedImage, quality: 100);

        final result = await ImageGallerySaverPlus.saveImage(
          jpgBytes,
          quality: 100,
          name:
              "QR_${widget.qr['short_code']}_${DateTime.now().millisecondsSinceEpoch}.jpg",
        );
        if (result['isSuccess']) {
          if (mounted) {
            messenger.showSnackBar(
              const SnackBar(content: Text('QR Code saved to gallery')),
            );
          }
          await NotificationService().showNotification(
            title: 'QR Code Saved',
            body:
                'Successfully saved QR code for ${widget.qr['destination_url']} to your gallery.',
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
              'Could not save image. Make sure storage permission is granted.',
            ),
            backgroundColor: cs.errorContainer,
          ),
        );
      }
    }
  }

  void _shareLink() {
    final shortUrl = 'https://dynamqr.vercel.app/${widget.qr['short_code']}';
    SharePlus.instance.share(ShareParams(text: shortUrl));
  }

  void _copyLink() {
    final shortUrl = 'https://dynamqr.vercel.app/${widget.qr['short_code']}';
    Clipboard.setData(ClipboardData(text: shortUrl));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Link copied to clipboard')),
    );
  }

  void _confirmDelete() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        icon: const Icon(Icons.delete_outline_rounded),
        title: const Text('Delete this QR Code?'),
        content: const Text(
          'This action cannot be undone. The destination link will stop working.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton.tonal(
            onPressed: () {
              Navigator.pop(context);
              widget.onDelete(widget.qr['id']);
            },
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    final shortUrl = 'https://dynamqr.vercel.app/${widget.qr['short_code']}';
    final keyword = widget.qr['keyword'] ?? widget.qr['short_code'];

    return Card(
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                GestureDetector(
                  onTap: () {
                    context.push(
                      '/qr_fullscreen',
                      extra: {
                        'qrData': widget.qr,
                        'shortUrl': shortUrl,
                        'selectedTheme': _selectedTheme,
                        'selectedColor': _selectedColor,
                        'selectedEyeColor': _selectedEyeColor,
                      },
                    );
                  },
                  child: Hero(
                    tag: 'qr-${widget.qr['id']}',
                    child: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: cs.outlineVariant),
                      ),
                      child: QrImageView(
                        data: shortUrl,
                        version: QrVersions.auto,
                        size: 88,
                        backgroundColor: Colors.white,
                        eyeStyle: _getEyeStyle(),
                        dataModuleStyle: _getModuleStyle(),
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
                        widget.qr['destination_url'] ?? '',
                        style: tt.titleSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                          height: 1.3,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: cs.secondaryContainer,
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.link_rounded,
                              size: 12,
                              color: cs.onSecondaryContainer,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              '/$keyword',
                              style: tt.labelSmall?.copyWith(
                                color: cs.onSecondaryContainer,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          // Action row
          Padding(
            padding: const EdgeInsets.fromLTRB(8, 0, 8, 8),
            child: Row(
              children: [
                Expanded(
                  child: TextButton.icon(
                    onPressed: _copyLink,
                    icon: const Icon(Icons.copy_rounded, size: 16),
                    label: const FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Text(
                        'Copy',
                        style: TextStyle(fontSize: 12),
                      ),
                    ),
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                  ),
                ),
                Expanded(
                  child: TextButton.icon(
                    onPressed: _shareLink,
                    icon: const Icon(Icons.share_outlined, size: 16),
                    label: const FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Text(
                        'Share',
                        style: TextStyle(fontSize: 12),
                      ),
                    ),
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                  ),
                ),
                Expanded(
                  child: TextButton.icon(
                    onPressed: _downloadQr,
                    icon: const Icon(Icons.download_rounded, size: 16),
                    label: const FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Text(
                        'Save',
                        style: TextStyle(fontSize: 12),
                      ),
                    ),
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                  ),
                ),
                Expanded(
                  child: TextButton.icon(
                    onPressed: () => context.push('/analytics', extra: widget.qr),
                    icon: const Icon(Icons.analytics_outlined, size: 16),
                    label: const FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Text(
                        'Stats',
                        style: TextStyle(fontSize: 12),
                      ),
                    ),
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                  ),
                ),
                IconButton(
                  tooltip: 'Edit',
                  onPressed: () async {
                    final result =
                        await context.push('/edit', extra: widget.qr);
                    if (result == true) widget.onRefresh();
                  },
                  icon: const Icon(Icons.edit_outlined),
                  iconSize: 20,
                  constraints: const BoxConstraints(),
                  padding: const EdgeInsets.all(8),
                ),
                IconButton(
                  tooltip: 'Delete',
                  onPressed: _confirmDelete,
                  color: cs.error,
                  icon: const Icon(Icons.delete_outline_rounded),
                  iconSize: 20,
                  constraints: const BoxConstraints(),
                  padding: const EdgeInsets.all(8),
                ),
              ],
            ),
          ),
          // Customize toggle
          InkWell(
            onTap: () => setState(() => _expanded = !_expanded),
            child: Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  Icon(
                    Icons.palette_outlined,
                    size: 18,
                    color: cs.onSurfaceVariant,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Customize',
                    style: tt.labelLarge?.copyWith(
                      color: cs.onSurfaceVariant,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const Spacer(),
                  AnimatedRotation(
                    duration: const Duration(milliseconds: 200),
                    turns: _expanded ? 0.5 : 0,
                    child: Icon(
                      Icons.keyboard_arrow_down_rounded,
                      color: cs.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
          ),
          AnimatedCrossFade(
            duration: const Duration(milliseconds: 220),
            crossFadeState: _expanded
                ? CrossFadeState.showSecond
                : CrossFadeState.showFirst,
            firstChild: const SizedBox(width: double.infinity),
            secondChild: Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _styleLabel(context, 'Style'),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _themes.map((theme) {
                      final selected = _selectedTheme == theme;
                      return ChoiceChip(
                        label: Text(theme),
                        selected: selected,
                        onSelected: (s) {
                          if (s) {
                            setState(() => _selectedTheme = theme);
                            _saveStyleForThisQr();
                          }
                        },
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 16),
                  _styleLabel(context, 'Color'),
                  const SizedBox(height: 8),
                  _colorRow(
                    selected: _selectedColor,
                    onSelected: (c) {
                      setState(() {
                        final wasLinked = _selectedEyeColor == _selectedColor;
                        _selectedColor = c;
                        if (wasLinked) _selectedEyeColor = c;
                      });
                      _saveStyleForThisQr();
                    },
                  ),
                  const SizedBox(height: 16),
                  _styleLabel(context, 'Eye color'),
                  const SizedBox(height: 8),
                  _colorRow(
                    selected: _selectedEyeColor,
                    onSelected: (c) {
                      setState(() => _selectedEyeColor = c);
                      _saveStyleForThisQr();
                    },
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _styleLabel(BuildContext context, String text) {
    final tt = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;
    return Text(
      text,
      style: tt.labelMedium?.copyWith(
        color: cs.onSurfaceVariant,
        fontWeight: FontWeight.w600,
      ),
    );
  }

  Widget _colorRow({
    required Color selected,
    required ValueChanged<Color> onSelected,
  }) {
    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: _colors.entries.map((e) {
        final isSelected = selected == e.value;
        return _ColorDot(
          color: e.value,
          selected: isSelected,
          onTap: () => onSelected(e.value),
        );
      }).toList(),
    );
  }
}

class _ColorDot extends StatelessWidget {
  final Color color;
  final bool selected;
  final VoidCallback onTap;

  const _ColorDot({
    required this.color,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        width: selected ? 36 : 32,
        height: selected ? 36 : 32,
        decoration: BoxDecoration(
          color: color,
          shape: BoxShape.circle,
          border: Border.all(
            color: selected ? cs.primary : cs.outlineVariant,
            width: selected ? 3 : 1,
          ),
        ),
        child: selected
            ? const Icon(Icons.check_rounded, color: Colors.white, size: 18)
            : null,
      ),
    );
  }
}

