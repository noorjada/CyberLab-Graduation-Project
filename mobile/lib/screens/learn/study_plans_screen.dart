import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/loading_view.dart';
import 'package:provider/provider.dart';

class StudyPlansScreen extends StatefulWidget {
  const StudyPlansScreen({super.key});

  @override
  State<StudyPlansScreen> createState() => _StudyPlansScreenState();
}

class _StudyPlansScreenState extends State<StudyPlansScreen> {
  bool _loading = true;
  List<dynamic> _plans = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await context.read<ApiService>().get('/study-plans');
      setState(() => _plans = data['plans'] as List<dynamic>? ?? []);
    } catch (_) {
      setState(() => _plans = []);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Study Plans')),
      body: _loading
          ? const LoadingView()
          : _plans.isEmpty
              ? const EmptyState(icon: '📅', title: 'No study plans available')
              : RefreshIndicator(
                  onRefresh: _load,
                  color: AppColors.accent,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _plans.length,
                    itemBuilder: (context, i) {
                      final plan = _plans[i] as Map<String, dynamic>;
                      final progress = (plan['progress'] as num?)?.toInt() ?? 0;
                      final enrolled = plan['enrolled'] == true;
                      final active = plan['isActive'] == true;
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: InkWell(
                          onTap: () => context.push('/learn/plans/${plan['slug']}'),
                          borderRadius: BorderRadius.circular(12),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Text(plan['icon']?.toString() ?? '📅', style: const TextStyle(fontSize: 24)),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Text(
                                        plan['title']?.toString() ?? 'Plan',
                                        style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
                                      ),
                                    ),
                                    if (active)
                                      const Chip(
                                        label: Text('Active', style: TextStyle(fontSize: 10)),
                                        backgroundColor: AppColors.accent,
                                        labelStyle: TextStyle(color: AppColors.bgPrimary),
                                        padding: EdgeInsets.zero,
                                      ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  plan['description']?.toString() ?? '',
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                                ),
                                if (enrolled) ...[
                                  const SizedBox(height: 10),
                                  LinearProgressIndicator(
                                    value: progress / 100,
                                    backgroundColor: AppColors.bgElevated,
                                    color: AppColors.accent,
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  const SizedBox(height: 4),
                                  Text('$progress% complete', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                                ],
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
