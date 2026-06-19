import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../theme/app_colors.dart';

class ToolsHubScreen extends StatelessWidget {
  const ToolsHubScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Security Tools')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _ToolTile(icon: '🛡️', title: 'SOC Assistant', subtitle: 'AI blue-team helper for logs and IR', onTap: () => context.push('/tools/soc')),
          _ToolTile(icon: '🔭', title: 'Recon Lab', subtitle: 'IP, DNS, WHOIS lookups', onTap: () => context.push('/tools/recon')),
          _ToolTile(icon: '🦠', title: 'Malware Lab', subtitle: 'VirusTotal URL/IP/domain scan', onTap: () => context.push('/tools/vt')),
          _ToolTile(icon: '🌐', title: 'Cyber Intelligence', subtitle: 'CVE, KEV, and security news feeds', onTap: () => context.push('/tools/intel')),
        ],
      ),
    );
  }
}

class _ToolTile extends StatelessWidget {
  final String icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _ToolTile({required this.icon, required this.title, required this.subtitle, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        leading: Text(icon, style: const TextStyle(fontSize: 26)),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
        subtitle: Text(subtitle, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}
