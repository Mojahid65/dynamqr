import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';
import 'dart:math';

class ScannerScreen extends StatefulWidget {
  const ScannerScreen({super.key});

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen> with SingleTickerProviderStateMixin {
  final MobileScannerController _controller = MobileScannerController();
  bool _isProcessing = false;
  late AnimationController _animationController;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _animationController.dispose();
    _controller.dispose();
    super.dispose();
  }

  Future<void> _handleBarcode(BarcodeCapture capture) async {
    if (_isProcessing) return;
    final List<Barcode> barcodes = capture.barcodes;
    if (barcodes.isNotEmpty) {
      final String? rawValue = barcodes.first.rawValue;
      if (rawValue != null) {
        _processUrl(rawValue);
      }
    }
  }

  Future<void> _processUrl(String url) async {
    setState(() { _isProcessing = true; });
    final uri = Uri.tryParse(url);
    if (uri != null && (uri.scheme == 'http' || uri.scheme == 'https')) {
      try {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Could not launch URL: $url')),
          );
        }
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Scanned text is not a valid URL: $url')),
        );
      }
    }
    await Future.delayed(const Duration(seconds: 2));
    if (mounted) setState(() { _isProcessing = false; });
  }

  Future<void> _pickImage() async {
    final ImagePicker picker = ImagePicker();
    final XFile? image = await picker.pickImage(source: ImageSource.gallery);
    if (image != null) {
      final BarcodeCapture? capture = await _controller.analyzeImage(image.path);
      if (capture != null && capture.barcodes.isNotEmpty) {
        final String? rawValue = capture.barcodes.first.rawValue;
        if (rawValue != null) {
          _processUrl(rawValue);
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('No QR code found in the image.')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final scanWindowSize = MediaQuery.of(context).size.width * 0.7;

    return Scaffold(
      backgroundColor: Colors.black,
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        title: const Text('Scan QR Code', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          IconButton(
            icon: const Icon(Icons.image),
            onPressed: _pickImage,
            tooltip: 'Pick from Gallery',
          ),
          IconButton(
            icon: const Icon(Icons.flashlight_on, color: Colors.white),
            onPressed: () => _controller.toggleTorch(),
          ),
        ],
      ),
      body: Stack(
        children: [
          MobileScanner(
            controller: _controller,
            onDetect: _handleBarcode,
          ),
          // Overlay
          Container(
            decoration: ShapeDecoration(
              shape: _ScannerOverlayShape(
                borderColor: Colors.indigoAccent,
                borderWidth: 4,
                cutOutSize: scanWindowSize,
              ),
            ),
          ),
          // Laser Animation
          Center(
            child: SizedBox(
              width: scanWindowSize,
              height: scanWindowSize,
              child: AnimatedBuilder(
                animation: _animationController,
                builder: (context, child) {
                  return Stack(
                    children: [
                      Positioned(
                        top: _animationController.value * scanWindowSize,
                        left: 0,
                        right: 0,
                        child: Container(
                          height: 3,
                          decoration: BoxDecoration(
                            color: Colors.redAccent,
                            boxShadow: [
                              BoxShadow(
                                color: Colors.redAccent.withOpacity(0.5),
                                blurRadius: 10,
                                spreadRadius: 2,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  );
                },
              ),
            ),
          ),
          // Instruction text
          Positioned(
            bottom: 100,
            left: 0,
            right: 0,
            child: Column(
              children: const [
                Text(
                  'Align QR code within the frame',
                  style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w500),
                ),
                SizedBox(height: 8),
                Text(
                  'Scanning is automatic',
                  style: TextStyle(color: Colors.white70, fontSize: 14),
                ),
              ],
            ),
          ),
          if (_isProcessing)
            Container(
              color: Colors.black87,
              child: const Center(
                child: CircularProgressIndicator(color: Colors.indigoAccent),
              ),
            ),
        ],
      ),
    );
  }
}

class _ScannerOverlayShape extends ShapeBorder {
  final Color borderColor;
  final double borderWidth;
  final double overlayOpacity;
  final double cutOutSize;

  const _ScannerOverlayShape({
    this.borderColor = Colors.white,
    this.borderWidth = 3.0,
    this.overlayOpacity = 0.7,
    required this.cutOutSize,
  });

  @override
  EdgeInsetsGeometry get dimensions => const EdgeInsets.all(10);

  @override
  Path getInnerPath(Rect rect, {TextDirection? textDirection}) {
    return Path()
      ..fillType = PathFillType.evenOdd
      ..addPath(getOuterPath(rect), Offset.zero);
  }

  @override
  Path getOuterPath(Rect rect, {TextDirection? textDirection}) {
    Path _getLeftTopPath(Rect rect) {
      return Path()
        ..moveTo(rect.left, rect.bottom)
        ..lineTo(rect.left, rect.top)
        ..lineTo(rect.right, rect.top);
    }
    return _getLeftTopPath(rect)
      ..lineTo(rect.right, rect.bottom)
      ..lineTo(rect.left, rect.bottom)
      ..moveTo(rect.left + rect.width / 2.0, rect.top + rect.height / 2.0)
      ..close();
  }

  @override
  void paint(Canvas canvas, Rect rect, {TextDirection? textDirection}) {
    final width = rect.width;
    final height = rect.height;
    final cutOutRect = Rect.fromCenter(
      center: Offset(width / 2, height / 2),
      width: cutOutSize,
      height: cutOutSize,
    );

    final paint = Paint()
      ..color = Colors.black.withOpacity(overlayOpacity)
      ..style = PaintingStyle.fill;

    final backgroundPath = Path()
      ..addRect(rect)
      ..addRRect(RRect.fromRectAndRadius(cutOutRect, const Radius.circular(16)))
      ..fillType = PathFillType.evenOdd;

    canvas.drawPath(backgroundPath, paint);

    final borderPaint = Paint()
      ..color = borderColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = borderWidth;

    final cornerLength = cutOutSize * 0.15;
    final rrect = RRect.fromRectAndRadius(cutOutRect, const Radius.circular(16));

    final cornerPath = Path()
      ..moveTo(rrect.left, rrect.top + cornerLength)
      ..quadraticBezierTo(rrect.left, rrect.top, rrect.left + cornerLength, rrect.top)
      ..moveTo(rrect.right - cornerLength, rrect.top)
      ..quadraticBezierTo(rrect.right, rrect.top, rrect.right, rrect.top + cornerLength)
      ..moveTo(rrect.right, rrect.bottom - cornerLength)
      ..quadraticBezierTo(rrect.right, rrect.bottom, rrect.right - cornerLength, rrect.bottom)
      ..moveTo(rrect.left + cornerLength, rrect.bottom)
      ..quadraticBezierTo(rrect.left, rrect.bottom, rrect.left, rrect.bottom - cornerLength);

    canvas.drawPath(cornerPath, borderPaint);
  }

  @override
  ShapeBorder scale(double t) {
    return _ScannerOverlayShape(
      borderColor: borderColor,
      borderWidth: borderWidth * t,
      cutOutSize: cutOutSize * t,
    );
  }
}
