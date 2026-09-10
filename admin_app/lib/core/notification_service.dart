import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:url_launcher/url_launcher.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin _flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();

  Future<void> init() async {
    const AndroidInitializationSettings initializationSettingsAndroid = AndroidInitializationSettings('@mipmap/ic_launcher');
    
    // We don't need iOS settings since this is an Android-focused app for now, but good to add generic
    const InitializationSettings initializationSettings = InitializationSettings(
      android: initializationSettingsAndroid,
    );

    await _flutterLocalNotificationsPlugin.initialize(
      settings: initializationSettings,
      onDidReceiveNotificationResponse: (NotificationResponse response) async {
        final payload = response.payload;
        if (payload != null && payload.startsWith('http')) {
          final url = Uri.parse(payload);
          if (await canLaunchUrl(url)) {
            await launchUrl(url, mode: LaunchMode.externalApplication);
          }
        }
      },
    );
  }

  Future<String?> _downloadAndSaveFile(String url, String fileName) async {
    try {
      final String filePath = '${Directory.systemTemp.path}/$fileName';
      final File file = File(filePath);
      final request = await HttpClient().getUrl(Uri.parse(url));
      final response = await request.close();
      final bytes = <int>[];
      await for (final chunk in response) {
        bytes.addAll(chunk);
      }
      await file.writeAsBytes(bytes);
      return filePath;
    } catch (e) {
      debugPrint('Failed to download image for notification: $e');
      return null;
    }
  }

  Future<void> showNotification({
    required String title,
    required String body,
    String? imageUrl,
    String? link,
  }) async {
    BigPictureStyleInformation? bigPictureStyleInformation;
    
    if (imageUrl != null && imageUrl.isNotEmpty) {
      final String fileName = 'notification_img_${DateTime.now().millisecondsSinceEpoch}.jpg';
      final String? downloadedPath = await _downloadAndSaveFile(imageUrl, fileName);
      if (downloadedPath != null) {
        bigPictureStyleInformation = BigPictureStyleInformation(
          FilePathAndroidBitmap(downloadedPath),
          hideExpandedLargeIcon: true,
          contentTitle: title,
          summaryText: body,
        );
      }
    }

    final AndroidNotificationDetails androidPlatformChannelSpecifics = AndroidNotificationDetails(
      'dynamqr_alerts_v2',
      'Important Alerts',
      channelDescription: 'High priority alerts with custom sound',
      importance: Importance.max,
      priority: Priority.high,
      ticker: 'ticker',
      sound: const RawResourceAndroidNotificationSound('notification'),
      color: const Color(0xFF9C27B0), // Purple color for extra attention
      styleInformation: bigPictureStyleInformation ?? BigTextStyleInformation(
        body,
        contentTitle: title,
      ),
    );
    final NotificationDetails platformChannelSpecifics = NotificationDetails(android: androidPlatformChannelSpecifics);
    await _flutterLocalNotificationsPlugin.show(
      id: DateTime.now().millisecond, // unique ID
      title: title,
      body: body,
      notificationDetails: platformChannelSpecifics,
      payload: link,
    );
  }
}
