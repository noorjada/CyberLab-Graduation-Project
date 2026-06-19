import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/loading_view.dart';

class LeaderboardScreen extends StatefulWidget {
  const LeaderboardScreen({super.key});

  @override
  State<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends State<LeaderboardScreen> {
  bool _loading = true;
  List<dynamic> _users = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final list = await context.read<ApiService>().getList('/users/leaderboard');
      setState(() => _users = list);
    } catch (_) {
      setState(() => _users = []);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Leaderboard')),
      body: _loading
          ? const LoadingView()
          : RefreshIndicator(
              onRefresh: _load,
              color: AppColors.accent,
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _users.length,
                itemBuilder: (context, i) {
                  final u = _users[i] as Map<String, dynamic>;
                  final rank = i + 1;
                  final medal = rank == 1 ? '🥇' : rank == 2 ? '🥈' : rank == 3 ? '🥉' : '#$rank';
                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      leading: Text(medal, style: const TextStyle(fontSize: 20)),
                      title: Text(u['username']?.toString() ?? '', style: const TextStyle(fontWeight: FontWeight.w600)),
                      subtitle: Text('Level ${u['level'] ?? 1}'),
                      trailing: Text('${u['points'] ?? 0} pts', style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.accent)),
                    ),
                  );
                },
              ),
            ),
    );
  }
}
