import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<Map<String, dynamic>> _onboardingData = [
    {
      'title': 'Dynamic QR Codes',
      'description': 'Create QR codes that can be updated anytime without reprinting.',
      'icon': Icons.qr_code_scanner,
      'color': Colors.indigo,
    },
    {
      'title': 'Advanced Customization',
      'description': 'Customize themes, colors, and shapes to match your brand.',
      'icon': Icons.color_lens,
      'color': Colors.pink,
    },
    {
      'title': 'High Quality Export',
      'description': 'Download and export your QR codes in ultra-high resolution for professional printing.',
      'icon': Icons.high_quality,
      'color': Colors.amber,
    },
  ];

  Future<void> _completeOnboarding() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('has_completed_onboarding', true);
    if (mounted) {
      context.go('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Scaffold(
      // Use AMOLED black if dark mode
      backgroundColor: isDark ? Colors.black : Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                onPageChanged: (index) {
                  setState(() {
                    _currentPage = index;
                  });
                },
                itemCount: _onboardingData.length,
                itemBuilder: (context, index) {
                  final data = _onboardingData[index];
                  return Padding(
                    padding: const EdgeInsets.all(40.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(32),
                          decoration: BoxDecoration(
                            color: data['color'].withOpacity(0.1),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            data['icon'],
                            size: 100,
                            color: data['color'],
                          ),
                        ),
                        const SizedBox(height: 60),
                        Text(
                          data['title'],
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                            color: isDark ? Colors.white : Colors.black87,
                          ),
                        ),
                        const SizedBox(height: 20),
                        Text(
                          data['description'],
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 16,
                            color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                            height: 1.5,
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(32.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: List.generate(
                      _onboardingData.length,
                      (index) => Container(
                        margin: const EdgeInsets.only(right: 8),
                        width: _currentPage == index ? 24 : 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: _currentPage == index
                              ? _onboardingData[_currentPage]['color']
                              : (isDark ? Colors.grey.shade800 : Colors.grey.shade300),
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ),
                  ),
                  ElevatedButton(
                    onPressed: () {
                      if (_currentPage == _onboardingData.length - 1) {
                        _completeOnboarding();
                      } else {
                        _pageController.nextPage(
                          duration: const Duration(milliseconds: 300),
                          curve: Curves.easeInOut,
                        );
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _onboardingData[_currentPage]['color'],
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(30),
                      ),
                    ),
                    child: Text(
                      _currentPage == _onboardingData.length - 1 ? 'Get Started' : 'Next',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
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
