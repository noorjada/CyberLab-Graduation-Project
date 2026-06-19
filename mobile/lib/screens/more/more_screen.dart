import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../theme/app_colors.dart';
import '../../widgets/cyber_app_bar.dart';
import '../../widgets/desktop_only_banner.dart';

class MoreScreen extends StatelessWidget {
  const MoreScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const CyberAppBar(title: 'More'),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('Account', style: TextStyle(fontWeight: FontWeight.w800, color: AppColors.textSecondary, fontSize: 12)),
          _MoreTile(icon: '👤', title: 'Profile & Settings', onTap: () => context.push('/profile')),
          _MoreTile(icon: '🏆', title: 'Leaderboard', onTap: () => context.push('/leaderboard')),
          _MoreTile(icon: '📜', title: 'Certificates', onTap: () => context.push('/certificates')),
          const SizedBox(height: 12),
          const Text('Learning', style: TextStyle(fontWeight: FontWeight.w800, color: AppColors.textSecondary, fontSize: 12)),
          _MoreTile(icon: '📰', title: 'Security News', onTap: () => context.push('/news')),
          _MoreTile(icon: '📚', title: 'Articles & Reference', onTap: () => context.push('/learn/reference')),
          _MoreTile(icon: '🎓', title: 'Exam History', onTap: () => context.push('/exams/history')),
          _MoreTile(icon: '🔥', title: 'Daily Challenge', onTap: () => context.push('/daily')),
          _MoreTile(icon: '📖', title: 'My Courses', onTap: () => context.push('/courses')),
          _MoreTile(icon: '📝', title: 'Assignments', onTap: () => context.push('/assignments')),
          const SizedBox(height: 12),
          const Text('Community', style: TextStyle(fontWeight: FontWeight.w800, color: AppColors.textSecondary, fontSize: 12)),
          _MoreTile(icon: '📡', title: 'Activity Feed', onTap: () => context.push('/activity')),
          _MoreTile(icon: '🏁', title: 'CTF Events', onTap: () => context.push('/events')),
          _MoreTile(icon: '🏛️', title: 'University Portal', onTap: () => context.push('/classrooms')),
          const SizedBox(height: 12),
          const Text('Tools & AI', style: TextStyle(fontWeight: FontWeight.w800, color: AppColors.textSecondary, fontSize: 12)),
          _MoreTile(icon: '🛡️', title: 'Security Tools', subtitle: 'SOC, Recon, VirusTotal, Intel', onTap: () => context.push('/tools')),
          _MoreTile(icon: '🤖', title: 'CyberBot AI', subtitle: 'Tap the floating button on any tab', onTap: () {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Use the CyberBot button (bottom-right) on any main screen')),
            );
          }),
          _MoreTile(icon: '🖥️', title: 'Labs Catalog', onTap: () => context.push('/labs')),
          const SizedBox(height: 16),
          const DesktopOnlyBanner(feature: 'Hacking Labs & Terminal', webPath: '/labs'),
        ],
      ),
    );
  }
}

class _MoreTile extends StatelessWidget {
  final String icon;
  final String title;
  final String? subtitle;
  final VoidCallback onTap;

  const _MoreTile({required this.icon, required this.title, this.subtitle, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Text(icon, style: const TextStyle(fontSize: 24)),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: subtitle != null ? Text(subtitle!, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)) : null,
        trailing: const Icon(Icons.chevron_right, color: AppColors.textSecondary),
        onTap: onTap,
      ),
    );
  }
}
