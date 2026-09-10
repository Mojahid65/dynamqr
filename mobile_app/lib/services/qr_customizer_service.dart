import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';

class QrPresetIcon {
  final String id;
  final String label;
  final IconData icon;

  const QrPresetIcon({required this.id, required this.label, required this.icon});
}

class QrCustomizerService {
  static const List<QrPresetIcon> presetIcons = [
    QrPresetIcon(id: 'none', label: 'None', icon: Icons.block),
    QrPresetIcon(id: 'link', label: 'Website', icon: Icons.language_rounded),
    QrPresetIcon(id: 'wifi', label: 'Wi-Fi', icon: Icons.wifi_rounded),
    QrPresetIcon(id: 'contact', label: 'Contact', icon: Icons.person_rounded),
    QrPresetIcon(id: 'email', label: 'Email', icon: Icons.email_rounded),
    QrPresetIcon(id: 'phone', label: 'Phone', icon: Icons.phone_rounded),
    QrPresetIcon(id: 'star', label: 'Star', icon: Icons.star_rounded),
    QrPresetIcon(id: 'shop', label: 'Shop', icon: Icons.shopping_bag_rounded),
    QrPresetIcon(id: 'restaurant', label: 'Menu', icon: Icons.restaurant_rounded),
  ];

  static const List<Map<String, String>> frameOptions = [
    {'id': 'none', 'label': 'No Frame', 'text': ''},
    {'id': 'scan_me', 'label': 'SCAN ME', 'text': 'SCAN ME'},
    {'id': 'wifi', 'label': 'CONNECT WI-FI', 'text': 'CONNECT TO WI-FI'},
    {'id': 'menu', 'label': 'VIEW MENU', 'text': 'VIEW DIGITAL MENU'},
    {'id': 'pay', 'label': 'PAY HERE', 'text': 'SCAN TO PAY'},
    {'id': 'follow', 'label': 'FOLLOW US', 'text': 'FOLLOW US'},
  ];

  static const List<Map<String, String>> aiStylePresets = [
    {
      'name': 'Cyberpunk',
      'prompt': 'Futuristic neon cyberpunk grid with glowing violet cyan light rays, high contrast 8k wallpaper'
    },
    {
      'name': 'Luxury Gold',
      'prompt': 'Luxury dark black marble background with elegant metallic gold veins, sleek 3d texture'
    },
    {
      'name': '3D Glass',
      'prompt': 'Abstract frosted glassmorphism geometric 3D shapes floating in dark space, modern design'
    },
    {
      'name': 'Neon Pulse',
      'prompt': 'Vibrant neon pulse lights in deep dark blue purple background, abstract digital art'
    },
    {
      'name': 'Pastel Silk',
      'prompt': 'Minimalist soft pastel gradient silk waves with clean modern studio lighting'
    },
    {
      'name': 'Cosmic Nebula',
      'prompt': 'Deep space galaxy nebula with star dust particles and glowing violet aura'
    },
    {
      'name': 'Minimal Marble',
      'prompt': 'Clean white modern architectural marble texture with subtle golden shadows'
    },
    {
      'name': 'Emerald Wave',
      'prompt': 'Deep emerald green abstract liquid silk waves with sparkling gold trim'
    },
  ];

  static Color parseColor(dynamic hex, Color fallback) {
    if (hex == null) return fallback;
    if (hex is Color) return hex;
    String hexStr = hex.toString().replaceAll('#', '');
    if (hexStr.length == 6) {
      hexStr = 'FF$hexStr';
    }
    final val = int.tryParse(hexStr, radix: 16);
    return val != null ? Color(val) : fallback;
  }
}

/// A comprehensive composite widget to render customized QR code with:
/// - Background image (AI URL or local file) or solid color
/// - Contrast mask backdrop
/// - QR matrix pattern (Square, Dots, Rounded, Classy)
/// - Center Logo (Custom File/URL or Preset Icon)
/// - Frame / Call-to-action banner
class CustomizedQrPreview extends StatelessWidget {
  final String qrData;
  final double size;
  final String theme; // 'square', 'dots', 'rounded', 'classy'
  final Color fgColor;
  final Color eyeColor;
  final Color bgColor;
  final String bgType; // 'color', 'image', 'ai'
  final String bgImageUrl;
  final File? localBgFile;
  final double bgOpacity;
  final String frameId; // 'none', 'scan_me', 'wifi', 'menu', 'pay', 'follow'
  final String logoType; // 'none', 'preset', 'file', 'url'
  final String logoPresetId;
  final File? localLogoFile;
  final String logoUrl;

  const CustomizedQrPreview({
    super.key,
    required this.qrData,
    this.size = 240,
    this.theme = 'square',
    this.fgColor = Colors.black,
    this.eyeColor = Colors.black,
    this.bgColor = Colors.white,
    this.bgType = 'color',
    this.bgImageUrl = '',
    this.localBgFile,
    this.bgOpacity = 0.85,
    this.frameId = 'none',
    this.logoType = 'none',
    this.logoPresetId = 'link',
    this.localLogoFile,
    this.logoUrl = '',
  });

  QrDataModuleShape _getModuleShape() {
    switch (theme.toLowerCase()) {
      case 'dots':
      case 'circles':
      case 'rounded':
      case 'smooth':
        return QrDataModuleShape.circle;
      default:
        return QrDataModuleShape.square;
    }
  }

  QrEyeShape _getEyeShape() {
    switch (theme.toLowerCase()) {
      case 'dots':
      case 'circles':
      case 'rounded':
      case 'smooth':
        return QrEyeShape.circle;
      default:
        return QrEyeShape.square;
    }
  }

  Widget _buildLogoWidget(double qrSize) {
    if (logoType == 'none') return const SizedBox.shrink();

    final logoSize = qrSize * 0.22;
    Widget logoContent;

    if (logoType == 'preset') {
      final preset = QrCustomizerService.presetIcons.firstWhere(
        (p) => p.id == logoPresetId,
        orElse: () => QrCustomizerService.presetIcons[1],
      );
      logoContent = Icon(preset.icon, size: logoSize * 0.55, color: fgColor);
    } else if (logoType == 'file' && localLogoFile != null) {
      logoContent = Image.file(localLogoFile!, width: logoSize * 0.7, height: logoSize * 0.7, fit: BoxFit.contain);
    } else if (logoType == 'url' && logoUrl.isNotEmpty) {
      logoContent = Image.network(
        logoUrl,
        width: logoSize * 0.7,
        height: logoSize * 0.7,
        fit: BoxFit.contain,
        errorBuilder: (_, __, ___) => Icon(Icons.qr_code, size: logoSize * 0.5, color: fgColor),
      );
    } else {
      return const SizedBox.shrink();
    }

    return Container(
      width: logoSize,
      height: logoSize,
      decoration: BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 6,
            spreadRadius: 1,
          ),
        ],
        border: Border.all(color: fgColor.withOpacity(0.3), width: 2),
      ),
      child: Center(child: logoContent),
    );
  }

  @override
  Widget build(BuildContext context) {
    final hasFrame = frameId != 'none';
    final frameConfig = QrCustomizerService.frameOptions.firstWhere(
      (f) => f['id'] == frameId,
      orElse: () => QrCustomizerService.frameOptions[0],
    );

    final innerQrSize = size * (hasFrame ? 0.82 : 0.9);

    Widget backgroundWidget;
    if (bgType == 'image' && localBgFile != null) {
      backgroundWidget = Image.file(localBgFile!, fit: BoxFit.cover, width: double.infinity, height: double.infinity);
    } else if ((bgType == 'image' || bgType == 'ai') && bgImageUrl.isNotEmpty) {
      backgroundWidget = Image.network(
        bgImageUrl,
        fit: BoxFit.cover,
        width: double.infinity,
        height: double.infinity,
        errorBuilder: (_, __, ___) => Container(color: bgColor),
      );
    } else {
      backgroundWidget = Container(color: bgColor);
    }

    Widget qrCore = Stack(
      alignment: Alignment.center,
      children: [
        // Contrast backdrop for optimal scanning reliability
        Container(
          width: innerQrSize,
          height: innerQrSize,
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(bgType == 'color' ? 1.0 : bgOpacity),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: Colors.grey.withOpacity(0.2),
              width: 1,
            ),
          ),
        ),
        // QR Code
        QrImageView(
          data: qrData.isEmpty ? 'https://dynamqr.mojahidx.in' : qrData,
          size: innerQrSize * 0.9,
          version: QrVersions.auto,
          eyeStyle: QrEyeStyle(
            eyeShape: _getEyeShape(),
            color: eyeColor,
          ),
          dataModuleStyle: QrDataModuleStyle(
            dataModuleShape: _getModuleShape(),
            color: fgColor,
          ),
        ),
        // Center Logo
        _buildLogoWidget(innerQrSize),
      ],
    );

    if (!hasFrame) {
      return Container(
        width: size,
        height: size,
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.12),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            Positioned.fill(child: backgroundWidget),
            qrCore,
          ],
        ),
      );
    }

    // Render with Call-to-action Frame
    return Container(
      width: size,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
      decoration: BoxDecoration(
        color: fgColor,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            height: size * 0.82,
            clipBehavior: Clip.antiAlias,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                Positioned.fill(child: backgroundWidget),
                qrCore,
              ],
            ),
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.qr_code_scanner_rounded, color: Colors.white, size: 18),
              const SizedBox(width: 6),
              Text(
                frameConfig['text'] ?? 'SCAN ME',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                  fontSize: 13,
                  letterSpacing: 1.2,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
