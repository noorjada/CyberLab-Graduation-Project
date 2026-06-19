import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../theme/app_colors.dart';
import '../../widgets/cyber_app_bar.dart';
import '../../widgets/desktop_only_banner.dart';

class LearnHubScreen extends StatelessWidget {
  const LearnHubScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const CyberAppBar(title: 'Learn'),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _LearnTile(icon: '📅', title: 'Study Plans', subtitle: 'Structured daily topics with resources', onTap: () => context.push('/learn/plans')),
          _LearnTile(icon: '📚', title: 'Cyber Reference', subtitle: 'Articles — pentesting, SOC, forensics', onTap: () => context.push('/learn/reference')),
          _LearnTile(icon: '📰', title: 'Security News', subtitle: 'Latest cybersecurity headlines (live feed)', onTap: () => context.push('/news')),
          _LearnTile(icon: '🎓', title: 'Practice Exams', subtitle: 'Timed MCQ exams with AI lockdown', onTap: () => context.go('/exams')),
          _LearnTile(icon: '🗺️', title: 'Learning Roadmap', subtitle: 'Certification-style paths with quizzes', onTap: () => context.push('/learn/roadmap')),
          _LearnTile(icon: '📓', title: 'Learning Notes', subtitle: 'Personal notes and command cheatsheets', onTap: () => context.push('/learn/notes')),
          _LearnTile(icon: '📖', title: 'My Courses', subtitle: 'University courses with lessons and quizzes', onTap: () => context.push('/courses')),
          _LearnTile(icon: '🛡️', title: 'Cyber Intelligence', subtitle: 'CVEs, KEV catalog, and news', onTap: () => context.push('/tools/intel')),
          const SizedBox(height: 12),
          const DesktopOnlyBanner(feature: 'Hacking Labs', webPath: '/labs'),
        ],
      ),
    );
  }
}

class _LearnTile extends StatelessWidget {
  final String icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _LearnTile({required this.icon, required this.title, required this.subtitle, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        leading: Text(icon, style: const TextStyle(fontSize: 28)),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
        subtitle: Text(subtitle, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
        trailing: const Icon(Icons.chevron_right, color: AppColors.textSecondary),
        onTap: onTap,
      ),
    );
  }
}
