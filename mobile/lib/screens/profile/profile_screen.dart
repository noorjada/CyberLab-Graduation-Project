import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';
import '../../utils/rank_utils.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  List<dynamic> _bookmarks = [];

  @override
  void initState() {
    super.initState();
    _loadBookmarks();
  }

  Future<void> _changePassword(BuildContext context) async {
    final current = TextEditingController();
    final newPass = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Change password'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: current, obscureText: true, decoration: const InputDecoration(labelText: 'Current password')),
            TextField(controller: newPass, obscureText: true, decoration: const InputDecoration(labelText: 'New password (min 6)')),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Save')),
        ],
      ),
    );
    if (ok != true || !context.mounted) return;
    try {
      await context.read<ApiService>().post('/auth/change-password', {
        'currentPassword': current.text,
        'newPassword': newPass.text,
      });
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Password updated')));
      }
    } on ApiException catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    }
    current.dispose();
    newPass.dispose();
  }

  Future<void> _loadBookmarks() async {
    try {
      final list = await context.read<ApiService>().getList('/bookmarks');
      if (mounted) setState(() => _bookmarks = list);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;
    final rank = getRank(user?.xp ?? 0);

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 40,
                    backgroundColor: AppColors.accent.withValues(alpha: 0.2),
                    child: Text((user?.username.isNotEmpty == true) ? user!.username[0].toUpperCase() : '?', style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w800, color: AppColors.accent)),
                  ),
                  const SizedBox(height: 12),
                  Text(user?.username ?? '', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
                  Text(user?.email ?? '', style: const TextStyle(color: AppColors.textSecondary)),
                  const SizedBox(height: 8),
                  Text('${rank.icon} ${rank.title}', style: const TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      _Stat('Level', '${user?.level ?? 1}'),
                      _Stat('Points', '${user?.points ?? 0}'),
                      _Stat('XP', '${user?.xp ?? 0}'),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          ListTile(leading: const Icon(Icons.flag_outlined), title: const Text('Challenges solved'), trailing: Text('${user?.solvedChallenges.length ?? 0}')),
          ListTile(leading: const Icon(Icons.emoji_events_outlined), title: const Text('Badges'), trailing: Text('${user?.badges.length ?? 0}')),
          if ((user?.dailyStreak ?? 0) > 0)
            ListTile(leading: const Icon(Icons.local_fire_department), title: const Text('Daily streak'), trailing: Text('${user!.dailyStreak} days')),
          ListTile(
            leading: const Icon(Icons.lock_outline),
            title: const Text('Change password'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _changePassword(context),
          ),
          const Divider(),
          const Padding(padding: EdgeInsets.symmetric(vertical: 8), child: Text('Bookmarks', style: TextStyle(fontWeight: FontWeight.w800))),
          if (_bookmarks.isEmpty)
            const Text('No bookmarks yet', style: TextStyle(color: AppColors.textSecondary))
          else
            ..._bookmarks.map((b) {
              final bookmark = b as Map<String, dynamic>;
              final item = bookmark['item'] as Map<String, dynamic>?;
              return ListTile(
                dense: true,
                title: Text(item?['title']?.toString() ?? 'Item', style: const TextStyle(fontSize: 14)),
                subtitle: Text(bookmark['itemType']?.toString() ?? ''),
                onTap: () {
                  final type = bookmark['itemType']?.toString();
                  final id = bookmark['itemId']?.toString();
                  if (type == 'challenge' && id != null) context.push('/challenges/$id');
                  if (type == 'article' && item?['slug'] != null) context.push('/learn/reference/${item!['slug']}');
                  if (type == 'studyPlan' && item?['slug'] != null) context.push('/learn/plans/${item!['slug']}');
                },
              );
            }),
          const SizedBox(height: 24),
          OutlinedButton.icon(
            onPressed: () async {
              await auth.logout();
              if (context.mounted) context.go('/login');
            },
            icon: const Icon(Icons.logout),
            label: const Text('Sign out'),
            style: OutlinedButton.styleFrom(foregroundColor: AppColors.danger, side: const BorderSide(color: AppColors.danger), padding: const EdgeInsets.symmetric(vertical: 14)),
          ),
        ],
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  final String label;
  final String value;
  const _Stat(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Column(children: [Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)), Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12))]);
  }
}
