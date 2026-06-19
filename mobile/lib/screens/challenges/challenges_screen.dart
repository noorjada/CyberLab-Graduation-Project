import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/difficulty_chip.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/loading_view.dart';

class ChallengesScreen extends StatefulWidget {
  const ChallengesScreen({super.key});

  @override
  State<ChallengesScreen> createState() => _ChallengesScreenState();
}

class _ChallengesScreenState extends State<ChallengesScreen> {
  bool _loading = true;
  List<dynamic> _challenges = [];
  String _filter = 'all';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final list = await context.read<ApiService>().getList('/challenges');
      setState(() => _challenges = list);
    } catch (_) {
      setState(() => _challenges = []);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<dynamic> get _filtered {
    if (_filter == 'all') return _challenges;
    return _challenges.where((c) => (c as Map)['category'] == _filter).toList();
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;

    return Scaffold(
      appBar: AppBar(title: const Text('CTF Challenges')),
      body: _loading
          ? const LoadingView()
          : Column(
              children: [
                SizedBox(
                  height: 44,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    children: ['all', 'web', 'network', 'linux', 'crypto', 'forensics']
                        .map((cat) => Padding(
                              padding: const EdgeInsets.only(right: 8),
                              child: FilterChip(
                                label: Text(cat),
                                selected: _filter == cat,
                                onSelected: (_) => setState(() => _filter = cat),
                                selectedColor: AppColors.accent.withValues(alpha: 0.2),
                              ),
                            ))
                        .toList(),
                  ),
                ),
                Expanded(
                  child: _filtered.isEmpty
                      ? const EmptyState(icon: '🚩', title: 'No challenges in this category')
                      : RefreshIndicator(
                          onRefresh: _load,
                          color: AppColors.accent,
                          child: ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: _filtered.length,
                            itemBuilder: (context, i) {
                              final c = _filtered[i] as Map<String, dynamic>;
                              final id = c['_id']?.toString() ?? '';
                              final solved = user?.isChallengeSolved(id) ?? false;
                              return Card(
                                margin: const EdgeInsets.only(bottom: 10),
                                child: ListTile(
                                  leading: Text(solved ? '✅' : '🚩', style: const TextStyle(fontSize: 22)),
                                  title: Text(c['title']?.toString() ?? '', style: const TextStyle(fontWeight: FontWeight.w600)),
                                  subtitle: Row(
                                    children: [
                                      DifficultyChip(difficulty: c['difficulty']?.toString() ?? 'easy'),
                                      const SizedBox(width: 8),
                                      Text('${c['points'] ?? 0} pts', style: const TextStyle(fontSize: 11)),
                                    ],
                                  ),
                                  trailing: const Icon(Icons.chevron_right, color: AppColors.textSecondary),
                                  onTap: () => context.push('/challenges/$id'),
                                ),
                              );
                            },
                          ),
                        ),
                ),
              ],
            ),
    );
  }
}
