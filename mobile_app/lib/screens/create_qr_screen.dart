import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:go_router/go_router.dart';
import 'dart:math';
import 'package:lottie/lottie.dart';
import 'package:flutter_colorpicker/flutter_colorpicker.dart';
import 'package:crypto/crypto.dart';
import 'package:image_picker/image_picker.dart';
import '../services/qr_customizer_service.dart';

class CreateQrScreen extends StatefulWidget {
  const CreateQrScreen({super.key});

  @override
  State<CreateQrScreen> createState() => _CreateQrScreenState();
}

class _CreateQrScreenState extends State<CreateQrScreen> with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;
  late TabController _tabController;

  // Content Data
  String _qrType = 'url';
  final _destinationUrlController = TextEditingController();
  final _keywordController = TextEditingController();

  // Wi-Fi Fields
  final _wifiSsidController = TextEditingController();
  final _wifiPasswordController = TextEditingController();
  String _wifiEncryption = 'WPA';
  bool _wifiHidden = false;

  // vCard Fields
  final _vFirstNameController = TextEditingController();
  final _vLastNameController = TextEditingController();
  final _vPhoneController = TextEditingController();
  final _vEmailController = TextEditingController();
  final _vCompanyController = TextEditingController();
  final _vTitleController = TextEditingController();
  final _vWebsiteController = TextEditingController();
  final _vAddressController = TextEditingController();

  // Email Fields
  final _emailToController = TextEditingController();
  final _emailSubjectController = TextEditingController();
  final _emailBodyController = TextEditingController();

  // SMS Fields
  final _smsPhoneController = TextEditingController();
  final _smsMessageController = TextEditingController();

  // Security & Limits Data
  bool _isPasswordProtected = false;
  final _passwordController = TextEditingController();
  final _scanLimitController = TextEditingController();
  DateTime? _expiresAt;
  final _expirationMessageController = TextEditingController();
  final _expirationUrlController = TextEditingController();

  // Design & Advanced Data
  Color _qrColor = Colors.black;
  Color _qrEyeColor = Colors.black;
  Color _qrBgColor = Colors.white;
  String _qrTheme = 'square'; // 'square', 'dots', 'rounded', 'classy'
  String _bgType = 'color'; // 'color', 'image', 'ai'
  final _bgImageUrlController = TextEditingController();
  final _aiPromptController = TextEditingController();
  bool _isGeneratingAi = false;
  double _bgOpacity = 0.85;

  File? _localBgFile;
  String _frameId = 'none'; // 'none', 'scan_me', 'wifi', 'menu', 'pay', 'follow'
  String _logoType = 'none'; // 'none', 'preset', 'file', 'url'
  String _logoPresetId = 'link';
  File? _localLogoFile;
  final _logoUrlController = TextEditingController();

  Future<void> _pickLocalBgImage() async {
    final picker = ImagePicker();
    final image = await picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (image != null) {
      setState(() {
        _localBgFile = File(image.path);
        _bgType = 'image';
      });
    }
  }

  Future<void> _pickLocalLogoImage() async {
    final picker = ImagePicker();
    final image = await picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (image != null) {
      setState(() {
        _localLogoFile = File(image.path);
        _logoType = 'file';
      });
    }
  }

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _destinationUrlController.dispose();
    _keywordController.dispose();
    _wifiSsidController.dispose();
    _wifiPasswordController.dispose();
    _vFirstNameController.dispose();
    _vLastNameController.dispose();
    _vPhoneController.dispose();
    _vEmailController.dispose();
    _vCompanyController.dispose();
    _vTitleController.dispose();
    _vWebsiteController.dispose();
    _vAddressController.dispose();
    _emailToController.dispose();
    _emailSubjectController.dispose();
    _emailBodyController.dispose();
    _smsPhoneController.dispose();
    _smsMessageController.dispose();
    _passwordController.dispose();
    _scanLimitController.dispose();
    _expirationMessageController.dispose();
    _expirationUrlController.dispose();
    _bgImageUrlController.dispose();
    _aiPromptController.dispose();
    _tabController.dispose();
    super.dispose();
  }

  String _generateShortCode() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    final random = Random();
    final suffix = String.fromCharCodes(
      Iterable.generate(
        4,
        (_) => chars.codeUnitAt(random.nextInt(chars.length)),
      ),
    );
    return 'moja$suffix';
  }

  void _generateAiBackground([String? customPrompt]) {
    final prompt = customPrompt ?? _aiPromptController.text.trim();
    if (prompt.isEmpty) return;
    setState(() => _isGeneratingAi = true);
    final seed = Random().nextInt(1000000);
    final url = 'https://image.pollinations.ai/prompt/${Uri.encodeComponent(prompt)}?width=800&height=800&nologo=true&seed=$seed';
    setState(() {
      _bgType = 'ai';
      _bgImageUrlController.text = url;
      _isGeneratingAi = false;
    });
  }

  Future<void> _createQrCode() async {
    if (!_formKey.currentState!.validate()) {
      _tabController.animateTo(0);
      return;
    }

    setState(() => _isLoading = true);
    final messenger = ScaffoldMessenger.of(context);

    try {
      final user = Supabase.instance.client.auth.currentUser;
      final keyword = _keywordController.text.trim();

      String destinationUrl = '';
      Map<String, dynamic> typeData = {};

      if (_qrType == 'url') {
        destinationUrl = _destinationUrlController.text.trim();
        if (!destinationUrl.startsWith('http://') && !destinationUrl.startsWith('https://')) {
          destinationUrl = 'https://$destinationUrl';
        }
      } else if (_qrType == 'wifi') {
        final ssid = _wifiSsidController.text.trim();
        final pass = _wifiPasswordController.text.trim();
        destinationUrl = 'WIFI:S:$ssid;T:$_wifiEncryption;P:$pass;H:${_wifiHidden ? 'true' : 'false'};;';
        typeData = {'ssid': ssid, 'password': pass, 'encryption': _wifiEncryption, 'hidden': _wifiHidden};
      } else if (_qrType == 'vcard') {
        final fn = _vFirstNameController.text.trim();
        final ln = _vLastNameController.text.trim();
        destinationUrl = 'BEGIN:VCARD\nVERSION:3.0\nN:$ln;$fn\nFN:$fn $ln\nTEL:${_vPhoneController.text.trim()}\nEMAIL:${_vEmailController.text.trim()}\nORG:${_vCompanyController.text.trim()}\nTITLE:${_vTitleController.text.trim()}\nURL:${_vWebsiteController.text.trim()}\nADR:;;${_vAddressController.text.trim()}\nEND:VCARD';
        typeData = {
          'firstName': fn,
          'lastName': ln,
          'phone': _vPhoneController.text.trim(),
          'email': _vEmailController.text.trim(),
          'company': _vCompanyController.text.trim(),
          'title': _vTitleController.text.trim(),
          'website': _vWebsiteController.text.trim(),
          'address': _vAddressController.text.trim()
        };
      } else if (_qrType == 'email') {
        destinationUrl = 'mailto:${_emailToController.text.trim()}?subject=${Uri.encodeComponent(_emailSubjectController.text.trim())}&body=${Uri.encodeComponent(_emailBodyController.text.trim())}';
        typeData = {'email': _emailToController.text.trim(), 'subject': _emailSubjectController.text.trim(), 'body': _emailBodyController.text.trim()};
      } else if (_qrType == 'sms') {
        destinationUrl = 'smsto:${_smsPhoneController.text.trim()}:${_smsMessageController.text.trim()}';
        typeData = {'phone': _smsPhoneController.text.trim(), 'message': _smsMessageController.text.trim()};
      }

      String? passwordHash;
      if (_isPasswordProtected && _passwordController.text.isNotEmpty) {
        final bytes = utf8.encode(_passwordController.text);
        passwordHash = sha256.convert(bytes).toString();
      }

      String bgImageData = _bgImageUrlController.text.trim();
      if (_bgType == 'image' && _localBgFile != null) {
        final bytes = await _localBgFile!.readAsBytes();
        bgImageData = 'data:image/png;base64,${base64Encode(bytes)}';
      }

      String logoUrlData = _logoUrlController.text.trim();
      if (_logoType == 'file' && _localLogoFile != null) {
        final bytes = await _localLogoFile!.readAsBytes();
        logoUrlData = 'data:image/png;base64,${base64Encode(bytes)}';
      }

      final designConfig = {
        'theme': _qrTheme,
        'dotType': _qrTheme,
        'fgColor': '#${_qrColor.toARGB32().toRadixString(16).padLeft(8, '0')}',
        'eyeColor': '#${_qrEyeColor.toARGB32().toRadixString(16).padLeft(8, '0')}',
        'bgColor': '#${_qrBgColor.toARGB32().toRadixString(16).padLeft(8, '0')}',
        'bgType': _bgType,
        'bgImage': bgImageData,
        'bgOpacity': _bgOpacity,
        'frameId': _frameId,
        'logoType': _logoType,
        'logoPresetId': _logoPresetId,
        'logoUrl': logoUrlData,
      };

      bool inserted = false;
      for (int attempt = 0; attempt < 5; attempt++) {
        final shortCode = _generateShortCode();
        try {
          await Supabase.instance.client.from('qr_codes').insert({
            'user_id': user?.id,
            'destination_url': destinationUrl,
            'short_code': shortCode,
            if (keyword.isNotEmpty) 'keyword': keyword,
            'qr_type': _qrType,
            'type_data': typeData,
            'is_password_protected': _isPasswordProtected,
            if (passwordHash != null) 'password_hash': passwordHash,
            if (_scanLimitController.text.isNotEmpty) 
              'scan_limit': int.tryParse(_scanLimitController.text),
            if (_expiresAt != null) 'expires_at': _expiresAt!.toIso8601String(),
            if (_expirationMessageController.text.isNotEmpty)
              'expiration_message': _expirationMessageController.text.trim(),
            if (_expirationUrlController.text.isNotEmpty)
              'expiration_url': _expirationUrlController.text.trim(),
            'design_config': designConfig,
          });
          inserted = true;
          break;
        } on PostgrestException catch (e) {
          if (e.code == '23505') continue;
          rethrow;
        }
      }

      if (!inserted) {
        throw Exception('Could not generate a unique code. Please try again.');
      }

      if (mounted) {
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
                    'assets/googleicon/animations/fcd583a2-3388-11ef-b690-cbc97675b70d.json',
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
                      'Created Successfully!',
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
        ).then((_) {
          if (mounted) {
            Navigator.pop(context, true);
          }
        });
      }
    } catch (e) {
      if (mounted) {
        messenger.showSnackBar(
          SnackBar(
            content: Text('Failed to create: $e'),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _pickColor(int type) {
    Color tempColor = type == 0 ? _qrColor : (type == 1 ? _qrEyeColor : _qrBgColor);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Pick Color'),
        content: SingleChildScrollView(
          child: BlockPicker(
            pickerColor: tempColor,
            onColorChanged: (color) => tempColor = color,
          ),
        ),
        actions: [
          TextButton(
            child: const Text('Save'),
            onPressed: () {
              setState(() {
                if (type == 0) _qrColor = tempColor;
                if (type == 1) _qrEyeColor = tempColor;
                if (type == 2) _qrBgColor = tempColor;
              });
              Navigator.pop(context);
            },
          ),
        ],
      ),
    );
  }

  Widget _buildDestinationTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          DropdownButtonFormField<String>(
            value: _qrType,
            decoration: const InputDecoration(
              labelText: 'QR Content Type',
              prefixIcon: Icon(Icons.category_rounded),
            ),
            items: const [
              DropdownMenuItem(value: 'url', child: Text('Website URL')),
              DropdownMenuItem(value: 'wifi', child: Text('Wi-Fi Network')),
              DropdownMenuItem(value: 'vcard', child: Text('vCard (Digital Contact)')),
              DropdownMenuItem(value: 'email', child: Text('Email Message')),
              DropdownMenuItem(value: 'sms', child: Text('SMS Text Message')),
            ],
            onChanged: (v) => setState(() => _qrType = v!),
          ),
          const SizedBox(height: 20),

          // URL Form
          if (_qrType == 'url') ...[
            TextFormField(
              controller: _destinationUrlController,
              decoration: const InputDecoration(
                labelText: 'Destination URL',
                hintText: 'https://example.com',
                prefixIcon: Icon(Icons.link_rounded),
              ),
              keyboardType: TextInputType.url,
              validator: (val) {
                if (val == null || val.trim().isEmpty) return 'Required';
                return null;
              },
            ),
          ],

          // Wi-Fi Form
          if (_qrType == 'wifi') ...[
            TextFormField(
              controller: _wifiSsidController,
              decoration: const InputDecoration(
                labelText: 'Network SSID / Name',
                prefixIcon: Icon(Icons.wifi_rounded),
              ),
              validator: (val) => val == null || val.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _wifiPasswordController,
              decoration: const InputDecoration(
                labelText: 'Wi-Fi Password',
                prefixIcon: Icon(Icons.key_rounded),
              ),
              obscureText: true,
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: _wifiEncryption,
              decoration: const InputDecoration(
                labelText: 'Security Type',
                prefixIcon: Icon(Icons.security_rounded),
              ),
              items: const [
                DropdownMenuItem(value: 'WPA', child: Text('WPA/WPA2/WPA3')),
                DropdownMenuItem(value: 'WEP', child: Text('WEP')),
                DropdownMenuItem(value: 'nopass', child: Text('Open (No Password)')),
              ],
              onChanged: (v) => setState(() => _wifiEncryption = v!),
            ),
            SwitchListTile(
              title: const Text('Hidden Network'),
              value: _wifiHidden,
              onChanged: (v) => setState(() => _wifiHidden = v),
            ),
          ],

          // vCard Form
          if (_qrType == 'vcard') ...[
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _vFirstNameController,
                    decoration: const InputDecoration(labelText: 'First Name'),
                    validator: (val) => val == null || val.trim().isEmpty ? 'Required' : null,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: _vLastNameController,
                    decoration: const InputDecoration(labelText: 'Last Name'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _vPhoneController,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(
                labelText: 'Phone Number',
                prefixIcon: Icon(Icons.phone_rounded),
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _vEmailController,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(
                labelText: 'Email Address',
                prefixIcon: Icon(Icons.email_rounded),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _vCompanyController,
                    decoration: const InputDecoration(labelText: 'Company'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: _vTitleController,
                    decoration: const InputDecoration(labelText: 'Job Title'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _vWebsiteController,
              keyboardType: TextInputType.url,
              decoration: const InputDecoration(
                labelText: 'Website URL',
                prefixIcon: Icon(Icons.language_rounded),
              ),
            ),
          ],

          // Email Form
          if (_qrType == 'email') ...[
            TextFormField(
              controller: _emailToController,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(labelText: 'Recipient Email', prefixIcon: Icon(Icons.mail_outline_rounded)),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _emailSubjectController,
              decoration: const InputDecoration(labelText: 'Subject', prefixIcon: Icon(Icons.subject_rounded)),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _emailBodyController,
              maxLines: 3,
              decoration: const InputDecoration(labelText: 'Message Body'),
            ),
          ],

          // SMS Form
          if (_qrType == 'sms') ...[
            TextFormField(
              controller: _smsPhoneController,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(labelText: 'Phone Number', prefixIcon: Icon(Icons.sms_rounded)),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _smsMessageController,
              maxLines: 3,
              decoration: const InputDecoration(labelText: 'Text Message'),
            ),
          ],

          const SizedBox(height: 20),
          TextFormField(
            controller: _keywordController,
            decoration: const InputDecoration(
              labelText: 'Custom Alias / Short Code (optional)',
              hintText: 'e.g. promo-2026',
              prefixIcon: Icon(Icons.tag_rounded),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDesignTab() {
    final sampleUrl = _destinationUrlController.text.trim().isNotEmpty
        ? _destinationUrlController.text.trim()
        : 'https://dynamqr.mojahidx.in';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Live QR Preview Container
          Center(
            child: Column(
              children: [
                const Text(
                  'Live Preview',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.grey),
                ),
                const SizedBox(height: 8),
                CustomizedQrPreview(
                  qrData: sampleUrl,
                  size: 220,
                  theme: _qrTheme,
                  fgColor: _qrColor,
                  eyeColor: _qrEyeColor,
                  bgColor: _qrBgColor,
                  bgType: _bgType,
                  bgImageUrl: _bgImageUrlController.text.trim(),
                  localBgFile: _localBgFile,
                  bgOpacity: _bgOpacity,
                  frameId: _frameId,
                  logoType: _logoType,
                  logoPresetId: _logoPresetId,
                  localLogoFile: _localLogoFile,
                  logoUrl: _logoUrlController.text.trim(),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // AI Background Generator Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.indigo.shade900, Colors.purple.shade900],
              ),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.auto_awesome_rounded, color: Colors.amber, size: 20),
                    SizedBox(width: 8),
                    Text(
                      'AI Background Studio',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                const Text(
                  'Type a prompt or choose a style preset to synthesize AI backgrounds.',
                  style: TextStyle(color: Colors.white70, fontSize: 12),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _aiPromptController,
                        style: const TextStyle(color: Colors.white, fontSize: 13),
                        decoration: InputDecoration(
                          hintText: 'e.g. Neon cyberpunk grid...',
                          hintStyle: const TextStyle(color: Colors.white54),
                          filled: true,
                          fillColor: Colors.black26,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton.filled(
                      onPressed: _isGeneratingAi ? null : () => _generateAiBackground(),
                      icon: _isGeneratingAi
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : const Icon(Icons.auto_awesome),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: QrCustomizerService.aiStylePresets.map((p) {
                    return ActionChip(
                      label: Text(p['name']!, style: const TextStyle(fontSize: 11, color: Colors.white)),
                      backgroundColor: Colors.white12,
                      onPressed: () {
                        _aiPromptController.text = p['prompt']!;
                        _generateAiBackground(p['prompt']!);
                      },
                    );
                  }).toList(),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Background Mode
          const Text('Background Mode', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          SegmentedButton<String>(
            segments: const [
              ButtonSegment(value: 'color', label: Text('Solid Color')),
              ButtonSegment(value: 'image', label: Text('Gallery / URL')),
              ButtonSegment(value: 'ai', label: Text('AI Studio')),
            ],
            selected: {_bgType},
            onSelectionChanged: (s) => setState(() => _bgType = s.first),
          ),
          const SizedBox(height: 16),

          if (_bgType == 'image') ...[
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _pickLocalBgImage,
                    icon: const Icon(Icons.photo_library_rounded),
                    label: Text(_localBgFile != null ? 'Change Photo' : 'Pick Gallery Image'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _bgImageUrlController,
              onChanged: (_) => setState(() {}),
              decoration: const InputDecoration(
                labelText: 'Or Paste Background Image URL',
                prefixIcon: Icon(Icons.link_rounded),
              ),
            ),
            const SizedBox(height: 16),
          ],

          if (_bgType == 'image' || _bgType == 'ai') ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('QR Contrast Overlay Opacity', style: TextStyle(fontWeight: FontWeight.bold)),
                Text('${(_bgOpacity * 100).round()}%'),
              ],
            ),
            Slider(
              value: _bgOpacity,
              min: 0.2,
              max: 1.0,
              onChanged: (v) => setState(() => _bgOpacity = v),
            ),
            const SizedBox(height: 16),
          ],

          // Call-To-Action Frame Selection
          const Text('Poster Call-To-Action Frame', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: QrCustomizerService.frameOptions.map((f) {
              final isSelected = _frameId == f['id'];
              return ChoiceChip(
                label: Text(f['label']!),
                selected: isSelected,
                onSelected: (s) {
                  if (s) setState(() => _frameId = f['id']!);
                },
              );
            }).toList(),
          ),
          const SizedBox(height: 20),

          // Center Logo Overlay Section
          const Text('Center Logo / Icon Overlay', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          SegmentedButton<String>(
            segments: const [
              ButtonSegment(value: 'none', label: Text('None')),
              ButtonSegment(value: 'preset', label: Text('Preset Icon')),
              ButtonSegment(value: 'file', label: Text('Custom Logo')),
            ],
            selected: {_logoType},
            onSelectionChanged: (s) => setState(() => _logoType = s.first),
          ),
          const SizedBox(height: 12),

          if (_logoType == 'preset') ...[
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: QrCustomizerService.presetIcons.where((p) => p.id != 'none').map((p) {
                final isSelected = _logoPresetId == p.id;
                return FilterChip(
                  avatar: Icon(p.icon, size: 16, color: isSelected ? Colors.white : Colors.black87),
                  label: Text(p.label),
                  selected: isSelected,
                  onSelected: (s) {
                    if (s) setState(() => _logoPresetId = p.id);
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: 16),
          ],

          if (_logoType == 'file') ...[
            OutlinedButton.icon(
              onPressed: _pickLocalLogoImage,
              icon: const Icon(Icons.upload_file_rounded),
              label: Text(_localLogoFile != null ? 'Change Logo Image' : 'Pick Logo from Gallery'),
            ),
            const SizedBox(height: 16),
          ],

          // Color Selectors
          const Text('Pattern Color', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          GestureDetector(
            onTap: () => _pickColor(0),
            child: Container(
              height: 48,
              decoration: BoxDecoration(color: _qrColor, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.grey.shade300)),
            ),
          ),
          const SizedBox(height: 16),

          const Text('Eye / Corner Color', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          GestureDetector(
            onTap: () => _pickColor(1),
            child: Container(
              height: 48,
              decoration: BoxDecoration(color: _qrEyeColor, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.grey.shade300)),
            ),
          ),
          const SizedBox(height: 16),

          if (_bgType == 'color') ...[
            const Text('Background Color', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            GestureDetector(
              onTap: () => _pickColor(2),
              child: Container(
                height: 48,
                decoration: BoxDecoration(color: _qrBgColor, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.grey.shade300)),
              ),
            ),
            const SizedBox(height: 16),
          ],

          const Text('Pattern Style', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: ['square', 'dots', 'rounded', 'classy'].map((theme) {
              final selected = _qrTheme == theme;
              return ChoiceChip(
                label: Text(theme.toUpperCase()),
                selected: selected,
                onSelected: (s) {
                  if (s) setState(() => _qrTheme = theme);
                },
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildAdvancedTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SwitchListTile(
            title: const Text('Password Protection'),
            subtitle: const Text('Require a password to scan'),
            value: _isPasswordProtected,
            onChanged: (v) => setState(() => _isPasswordProtected = v),
          ),
          if (_isPasswordProtected)
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: TextFormField(
                controller: _passwordController,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: 'Set Password',
                  prefixIcon: Icon(Icons.lock_rounded),
                ),
              ),
            ),
          const Divider(),

          TextFormField(
            controller: _scanLimitController,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              labelText: 'Total Scan Limit (optional)',
              hintText: 'e.g. 100',
              prefixIcon: Icon(Icons.numbers_rounded),
            ),
          ),
          const SizedBox(height: 16),

          ListTile(
            title: const Text('Expiration Date'),
            subtitle: Text(_expiresAt != null ? _expiresAt!.toString().substring(0, 16) : 'Never Expires'),
            trailing: const Icon(Icons.calendar_month_rounded),
            onTap: () async {
              final date = await showDatePicker(
                context: context,
                initialDate: DateTime.now(),
                firstDate: DateTime.now(),
                lastDate: DateTime.now().add(const Duration(days: 3650)),
              );
              if (date != null) {
                final time = await showTimePicker(
                  context: context,
                  initialTime: TimeOfDay.now(),
                );
                if (time != null) {
                  setState(() {
                    _expiresAt = DateTime(date.year, date.month, date.day, time.hour, time.minute);
                  });
                }
              }
            },
          ),
          const SizedBox(height: 12),

          TextFormField(
            controller: _expirationMessageController,
            decoration: const InputDecoration(
              labelText: 'Custom Expiration Message',
              hintText: 'This promotional QR code has expired.',
              prefixIcon: Icon(Icons.message_rounded),
            ),
          ),
          const SizedBox(height: 12),

          TextFormField(
            controller: _expirationUrlController,
            keyboardType: TextInputType.url,
            decoration: const InputDecoration(
              labelText: 'Fallback Redirect URL (when expired)',
              hintText: 'https://example.com/expired-page',
              prefixIcon: Icon(Icons.alt_route_rounded),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Create Dynamic QR'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Content'),
            Tab(text: 'Design & AI'),
            Tab(text: 'Advanced'),
          ],
        ),
      ),
      body: Form(
        key: _formKey,
        child: TabBarView(
          controller: _tabController,
          children: [
            _buildDestinationTab(),
            _buildDesignTab(),
            _buildAdvancedTab(),
          ],
        ),
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: FilledButton(
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
            onPressed: _isLoading ? null : _createQrCode,
            child: _isLoading
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Text('Save QR Code'),
          ),
        ),
      ),
    );
  }
}
