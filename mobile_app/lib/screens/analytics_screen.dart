import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:google_fonts/google_fonts.dart';
import 'dart:math';

class AnalyticsScreen extends StatefulWidget {
  final Map<String, dynamic> qrData;

  const AnalyticsScreen({super.key, required this.qrData});

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  final _supabase = Supabase.instance.client;
  bool _isLoading = true;
  List<dynamic> _scans = [];
  String? _errorMessage;

  // Grouped stats
  int _totalScans = 0;
  int _uniqueVisitors = 0;
  Map<String, int> _osBreakdown = {};
  Map<String, int> _browserBreakdown = {};
  Map<String, int> _locationBreakdown = {}; // Country -> click count
  Map<String, int> _referrerBreakdown = {};
  List<Map<String, dynamic>> _last7DaysScans = [];

  @override
  void initState() {
    super.initState();
    _loadAnalytics();
  }

  Future<void> _loadAnalytics() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await _supabase
          .from('scan_events')
          .select()
          .eq('qr_code_id', widget.qrData['id'])
          .order('created_at', ascending: false);

      if (mounted) {
        _processData(response as List<dynamic>);
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Failed to load analytics: $e';
          _isLoading = false;
        });
      }
    }
  }

  void _processData(List<dynamic> data) {
    final uniqueIps = <String>{};
    final osCount = <String, int>{};
    final browserCount = <String, int>{};
    final locationCount = <String, int>{};
    final referrerCount = <String, int>{};

    // Calculate last 7 days (dates)
    final now = DateTime.now();
    final List<DateTime> days = List.generate(7, (index) {
      return DateTime(now.year, now.month, now.day).subtract(Duration(days: 6 - index));
    });

    final Map<String, int> dateClicks = {
      for (var day in days) _formatDateKey(day): 0
    };

    for (var event in data) {
      // Unique visitors
      final ip = event['ip'] as String?;
      if (ip != null && ip.isNotEmpty) {
        uniqueIps.add(ip);
      } else {
        // Fallback: if IP is null, use a random UUID/id to count as visitor
        final eventId = event['id'] as String?;
        if (eventId != null) uniqueIps.add(eventId);
      }

      // OS Breakdown
      final os = event['os'] as String? ?? 'Unknown';
      osCount[os] = (osCount[os] ?? 0) + 1;

      // Browser Breakdown
      final browser = event['browser'] as String? ?? 'Unknown';
      browserCount[browser] = (browserCount[browser] ?? 0) + 1;

      // Location Breakdown (Country)
      final country = event['country'] as String? ?? 'Unknown';
      locationCount[country] = (locationCount[country] ?? 0) + 1;

      // Referrer Breakdown
      final referrer = event['referrer'] as String? ?? 'Direct';
      referrerCount[referrer] = (referrerCount[referrer] ?? 0) + 1;

      // 7 Days Timeline
      final createdAtStr = event['created_at'] as String?;
      if (createdAtStr != null) {
        try {
          final scanDate = DateTime.parse(createdAtStr).toLocal();
          final key = _formatDateKey(scanDate);
          if (dateClicks.containsKey(key)) {
            dateClicks[key] = dateClicks[key]! + 1;
          }
        } catch (_) {}
      }
    }

    final timeline = days.map((day) {
      final key = _formatDateKey(day);
      return {
        'label': _formatDayLabel(day),
        'date': key,
        'count': dateClicks[key] ?? 0,
      };
    }).toList();

    setState(() {
      _scans = data;
      _totalScans = data.length;
      _uniqueVisitors = uniqueIps.length;
      _osBreakdown = osCount;
      _browserBreakdown = browserCount;
      _locationBreakdown = locationCount;
      _referrerBreakdown = referrerCount;
      _last7DaysScans = timeline;
      _isLoading = false;
    });
  }

  String _formatDateKey(DateTime dt) {
    return '${dt.year}-${dt.month.toString().padLeft(2, '0')}-${dt.day.toString().padLeft(2, '0')}';
  }

  String _formatDayLabel(DateTime dt) {
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    // DateTime.weekday is 1-indexed (Mon=1, Sun=7)
    return weekdays[dt.weekday - 1];
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    final title = widget.qrData['destination_url'] ?? 'QR Analytics';

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Analytics',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _loadAnalytics,
            tooltip: 'Refresh stats',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.error_outline_rounded, size: 48, color: cs.error),
                        const SizedBox(height: 16),
                        Text(
                          _errorMessage!,
                          textAlign: TextAlign.center,
                          style: tt.bodyMedium?.copyWith(color: cs.error),
                        ),
                        const SizedBox(height: 16),
                        FilledButton.icon(
                          onPressed: _loadAnalytics,
                          icon: const Icon(Icons.refresh_rounded),
                          label: const Text('Try Again'),
                        ),
                      ],
                    ),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadAnalytics,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Target Info Header
                        Card(
                          elevation: 0,
                          color: cs.surfaceContainerHigh,
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: cs.primaryContainer,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Icon(
                                    widget.qrData['design_config']?['is_link'] == true
                                        ? Icons.link_rounded
                                        : Icons.qr_code_2_rounded,
                                    color: cs.onPrimaryContainer,
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        title,
                                        style: tt.titleMedium?.copyWith(
                                          fontWeight: FontWeight.w600,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        'https://dynamqr.vercel.app/${widget.qrData['short_code']}',
                                        style: tt.bodySmall?.copyWith(
                                          color: cs.onSurfaceVariant,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Summary Statistics Cards
                        Row(
                          children: [
                            Expanded(
                              child: _buildSummaryCard(
                                context,
                                label: 'Total Scans',
                                value: '$_totalScans',
                                icon: Icons.ads_click_rounded,
                                color: cs.primary,
                                bgColor: cs.primaryContainer,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _buildSummaryCard(
                                context,
                                label: 'Unique Visitors',
                                value: '$_uniqueVisitors',
                                icon: Icons.people_alt_rounded,
                                color: cs.secondary,
                                bgColor: cs.secondaryContainer,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),

                        // Timeline Bar Chart (Last 7 Days)
                        _buildTimelineChart(context),
                        const SizedBox(height: 16),

                        // OS and Browser breakdowns
                        _buildBreakdownCard(
                          context,
                          title: 'Operating Systems',
                          icon: Icons.phone_android_rounded,
                          data: _osBreakdown,
                          iconMapper: (name) {
                            switch (name.toLowerCase()) {
                              case 'android':
                                return Icons.android_rounded;
                              case 'ios':
                                return Icons.phone_iphone_rounded;
                              case 'windows':
                                return Icons.laptop_windows_rounded;
                              case 'macos':
                                return Icons.laptop_mac_rounded;
                              case 'linux':
                                return Icons.developer_board_rounded;
                              default:
                                return Icons.devices_other_rounded;
                            }
                          },
                        ),
                        const SizedBox(height: 16),

                        _buildBreakdownCard(
                          context,
                          title: 'Browsers',
                          icon: Icons.explore_outlined,
                          data: _browserBreakdown,
                          iconMapper: (name) {
                            final n = name.toLowerCase();
                            if (n.contains('chrome')) return Icons.chrome_reader_mode_outlined;
                            if (n.contains('safari')) return Icons.apple_rounded;
                            if (n.contains('firefox')) return Icons.language_rounded;
                            if (n.contains('edge')) return Icons.web_rounded;
                            return Icons.public_rounded;
                          },
                        ),
                        const SizedBox(height: 16),

                        // Geo Location breakdowns
                        _buildLocationCard(context),
                        const SizedBox(height: 16),

                        // Referrer breakdown
                        _buildBreakdownCard(
                          context,
                          title: 'Traffic Referrers',
                          icon: Icons.hub_outlined,
                          data: _referrerBreakdown,
                          iconMapper: (name) => Icons.arrow_right_alt_rounded,
                        ),
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _buildSummaryCard(
    BuildContext context, {
    required String label,
    required String value,
    required IconData icon,
    required Color color,
    required Color bgColor,
  }) {
    final tt = Theme.of(context).textTheme;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                label,
                style: tt.labelLarge?.copyWith(
                  color: color,
                  fontWeight: FontWeight.w600,
                ),
              ),
              Icon(icon, color: color, size: 24),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: GoogleFonts.outfit(
              fontSize: 32,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTimelineChart(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;

    // Find the maximum click count to scale the bars
    int maxClicks = _last7DaysScans.fold<int>(0, (maxVal, item) {
      final count = item['count'] as int;
      return count > maxVal ? count : maxVal;
    });

    return Card(
      elevation: 0,
      color: cs.surfaceContainerHigh,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Activity (Last 7 Days)',
              style: GoogleFonts.outfit(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: cs.onSurface,
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              height: 160,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: _last7DaysScans.map((dayData) {
                  final count = dayData['count'] as int;
                  final label = dayData['label'] as String;
                  // Compute bar height percentage. Min 4px if count is 0, so there's a base mark.
                  final double barHeight = maxClicks == 0 ? 4 : max(4.0, (count / maxClicks) * 120);

                  return Expanded(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        if (count > 0)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 6),
                            child: Text(
                              '$count',
                              style: tt.labelSmall?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: cs.primary,
                              ),
                            ),
                          ),
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 500),
                          width: 24,
                          height: barHeight,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [cs.primary, cs.primary.withValues(alpha: 0.6)],
                              begin: Alignment.bottomCenter,
                              end: Alignment.topCenter,
                            ),
                            borderRadius: BorderRadius.circular(6),
                            boxShadow: count > 0
                                ? [
                                    BoxShadow(
                                      color: cs.primary.withValues(alpha: 0.2),
                                      blurRadius: 6,
                                      offset: const Offset(0, 2),
                                    )
                                  ]
                                : null,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          label,
                          style: tt.labelMedium?.copyWith(
                            color: cs.onSurfaceVariant,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBreakdownCard(
    BuildContext context, {
    required String title,
    required IconData icon,
    required Map<String, int> data,
    required IconData Function(String) iconMapper,
  }) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;

    // Sort entries descending by count
    final sortedEntries = data.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    // Show empty state if no scans yet
    if (sortedEntries.isEmpty) {
      return Card(
        elevation: 0,
        color: cs.surfaceContainerHigh,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(icon, color: cs.onSurfaceVariant, size: 20),
                  const SizedBox(width: 8),
                  Text(title, style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w600)),
                ],
              ),
              const SizedBox(height: 20),
              Center(
                child: Text(
                  'No data available',
                  style: tt.bodyMedium?.copyWith(color: cs.onSurfaceVariant),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Card(
      elevation: 0,
      color: cs.surfaceContainerHigh,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: cs.primary, size: 20),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: GoogleFonts.outfit(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: cs.onSurface,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            ...sortedEntries.take(5).map((entry) {
              final pct = _totalScans == 0 ? 0.0 : entry.value / _totalScans;
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Icon(iconMapper(entry.key), size: 16, color: cs.onSurfaceVariant),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            entry.key,
                            style: tt.bodyMedium?.copyWith(fontWeight: FontWeight.w500),
                          ),
                        ),
                        Text(
                          '${entry.value} (${(pct * 100).toStringAsFixed(0)}%)',
                          style: tt.labelLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: cs.primary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(99),
                      child: LinearProgressIndicator(
                        value: pct,
                        minHeight: 6,
                        backgroundColor: cs.surfaceContainer,
                        valueColor: AlwaysStoppedAnimation<Color>(cs.primary),
                      ),
                    ),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }

  Widget _buildLocationCard(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;

    final sortedLocations = _locationBreakdown.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    if (sortedLocations.isEmpty) {
      return Card(
        elevation: 0,
        color: cs.surfaceContainerHigh,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: const [
                  Icon(Icons.public_rounded, color: Colors.grey, size: 20),
                  Spacer(),
                ],
              ),
              const SizedBox(height: 20),
              Center(child: Text('No location data available', style: tt.bodyMedium)),
            ],
          ),
        ),
      );
    }

    return Card(
      elevation: 0,
      color: cs.surfaceContainerHigh,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.public_rounded, color: cs.primary, size: 20),
                const SizedBox(width: 8),
                Text(
                  'Top Locations',
                  style: GoogleFonts.outfit(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: cs.onSurface,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: min(5, sortedLocations.length),
              separatorBuilder: (context, index) => const Divider(height: 16),
              itemBuilder: (context, index) {
                final entry = sortedLocations[index];
                return Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: cs.surfaceContainer,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.location_on_outlined, size: 16),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        entry.key,
                        style: tt.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                      ),
                    ),
                    Text(
                      '${entry.value} scans',
                      style: tt.bodySmall?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: cs.primary,
                      ),
                    ),
                  ],
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
