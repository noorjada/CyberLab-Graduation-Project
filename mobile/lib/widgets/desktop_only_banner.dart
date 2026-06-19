import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config/api_config.dart';
import '../theme/app_colors.dart';

class DesktopOnlyBanner extends StatelessWidget {
  final String feature;
  final String? webPath;

  const DesktopOnlyBanner({
    super.key,
    required this.feature,
    this.webPath,
  });

  Future<void> _openWeb() async {
    final url = Uri.parse('${ApiConfig.webAppUrl}${webPath ?? ''}');
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      color: AppColors.bgElevated,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Text('🖥️', style: TextStyle(fontSize: 20)),
                SizedBox(width: 8),
                Text(
                  'Desktop required',
                  style: TextStyle(
                    color: AppColors.warning,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              '$feature needs a PC — Docker VMs, terminal access, and keyboard workflows are not available on mobile.',
              style: const TextStyle(color: AppColors.textSecondary, height: 1.4),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: _openWeb,
              icon: const Icon(Icons.open_in_browser, size: 18),
              label: const Text('Continue on web'),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.accentBlue,
                side: const BorderSide(color: AppColors.border),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
