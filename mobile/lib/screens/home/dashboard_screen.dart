import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';
import '../../utils/rank_utils.dart';
import '../../widgets/cyber_app_bar.dart';
import '../../widgets/loading_view.dart';
import '../../widgets/stat_card.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _loading = true;
  int _challengeCount = 0;
  int _examCount = 0;
  Map<String, dynamic>? _activePlan;
  List<dynamic> _news = [];
  List<dynamic> _activity = [];
  Map<String, dynamic>? _skills;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final api = context.read<ApiService>();
      final results = await Future.wait([
        api.getList('/challenges'),
        api.get('/study-plans'),
        api.getList('/exams'),
        api.get('/exploits/news', query: {'limit': '5'}),
        api.getList('/activity'),
        api.get('/analytics/skills'),
      ]);
      final newsRes = results[3] as Map<String, dynamic>;
      setState(() {
        _challengeCount = (results[0] as List).length;
        _activePlan = (results[1] as Map)['activePlan'] as Map<String, dynamic>?;
        _examCount = (results[2] as List).length;
        _news = newsRes['items'] as List<dynamic>? ?? [];
        _activity = (results[4] as List).take(5).toList();
        _skills = results[5] as Map<String, dynamic>?;
      });
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final rank = getRank(user?.xp ?? 0);
    final rankProgress = getRankProgress(user?.xp ?? 0);
    final solved = user?.solvedChallenges.length ?? 0;

    return Scaffold(
      appBar: CyberAppBar(
        title: 'CyberLab',
        extraActions: [
          if ((user?.dailyStreak ?? 0) > 0)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: Center(child: Text('🔥 ${user!.dailyStreak}', style: const TextStyle(fontWeight: FontWeight.w700))),
            ),
        ],
      ),
      body: _loading
          ? const LoadingView(message: 'Loading dashboard...')
          : RefreshIndicator(
              onRefresh: _load,
              color: AppColors.accent,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Text('Welcome, ${user?.username ?? 'hacker'}! 👋', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Text('${rank.icon} ${rank.title}', style: const TextStyle(color: AppColors.textSecondary)),
                      const SizedBox(width: 12),
                      Text('Level ${user?.level ?? 1}', style: const TextStyle(color: AppColors.accentBlue, fontWeight: FontWeight.w600)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(value: rankProgress / 100, color: AppColors.accent, backgroundColor: AppColors.bgElevated, minHeight: 6),
                  ),
                  Text('$rankProgress% to next rank', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                  const SizedBox(height: 20),
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 1.25,
                    children: [
                      StatCard(icon: '🚩', label: 'Challenges', value: '$solved', subtitle: 'of $_challengeCount'),
                      StatCard(icon: '⚡', label: 'Points', value: '${user?.points ?? 0}'),
                      StatCard(icon: '🎓', label: 'Exams', value: '$_examCount', subtitle: 'available'),
                      StatCard(icon: '🏅', label: 'Badges', value: '${user?.badges.length ?? 0}'),
                    ],
                  ),
                  if (_skills != null && _skills!['radar'] is List && (_skills!['radar'] as List).isNotEmpty) ...[
                    const SizedBox(height: 16),
                    const Text('Skill radar', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                    const SizedBox(height: 8),
                    ...(_skills!['radar'] as List).map((s) {
                      final sk = s as Map<String, dynamic>;
                      final percent = (sk['percent'] as num?)?.toDouble() ?? 0;
                      final label = sk['category']?.toString() ?? '';
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Row(
                          children: [
                            SizedBox(width: 90, child: Text(label, style: const TextStyle(fontSize: 12))),
                            Expanded(child: LinearProgressIndicator(value: percent / 100, color: AppColors.accentBlue, backgroundColor: AppColors.bgElevated)),
                            const SizedBox(width: 8),
                            Text('${percent.toInt()}%', style: const TextStyle(fontSize: 11)),
                          ],
                        ),
                      );
                    }),
                  ],
                  if (_activePlan != null) ...[
                    const SizedBox(height: 16),
                    Card(
                      child: InkWell(
                        onTap: () => context.go('/learn'),
                        borderRadius: BorderRadius.circular(12),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('📅 Active Study Plan', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                              Text(_activePlan!['title']?.toString() ?? '', style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
                              const SizedBox(height: 8),
                              LinearProgressIndicator(
                                value: ((_activePlan!['progress'] as num?) ?? 0) / 100,
                                color: AppColors.accent,
                                backgroundColor: AppColors.bgElevated,
                              ),
                              Text('${_activePlan!['completedTopics']}/${_activePlan!['totalTopics']} topics', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                  if (_news.isNotEmpty) ...[
                    const SizedBox(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('📰 Security News', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                        TextButton(onPressed: () => context.push('/news'), child: const Text('See all')),
                      ],
                    ),
                    ..._news.take(3).map((n) {
                      final item = n as Map<String, dynamic>;
                      return Card(
                        margin: const EdgeInsets.only(bottom: 6),
                        child: ListTile(
                          dense: true,
                          title: Text(item['title']?.toString() ?? '', maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13)),
                          subtitle: Text(item['source']?.toString() ?? '', style: const TextStyle(fontSize: 10)),
                          onTap: () => context.push('/news'),
                        ),
                      );
                    }),
                  ],
                  if (_activity.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('📡 Recent Activity', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                        TextButton(onPressed: () => context.push('/activity'), child: const Text('See all')),
                      ],
                    ),
                    ..._activity.map((a) {
                      final act = a as Map<String, dynamic>;
                      return ListTile(
                        dense: true,
                        contentPadding: EdgeInsets.zero,
                        title: Text(act['message']?.toString() ?? '', maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13)),
                        subtitle: Text(act['username']?.toString() ?? '', style: const TextStyle(fontSize: 10)),
                      );
                    }),
                  ],
                  const SizedBox(height: 20),
                  const Text('Quick actions', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                  const SizedBox(height: 8),
                  _Action('🔥 Daily Challenge', () => context.push('/daily')),
                  _Action('🎓 Practice Exams', () => context.go('/exams')),
                  _Action('📚 Articles & Reference', () => context.push('/learn/reference')),
                  _Action('📰 Security News', () => context.push('/news')),
                  _Action('🛡️ SOC Assistant (AI)', () => context.push('/tools/soc')),
                  _Action('🤖 CyberBot', () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Tap the CyberBot button at bottom-right')),
                    );
                  }),
                  _Action('🔭 Recon Lab', () => context.push('/tools/recon')),
                ],
              ),
            ),
    );
  }
}

class _Action extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  const _Action(this.label, this.onTap);

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 6),
      child: ListTile(title: Text(label), trailing: const Icon(Icons.chevron_right), onTap: onTap),
    );
  }
}
