import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/difficulty_chip.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/loading_view.dart';

class RoadmapScreen extends StatefulWidget {
  const RoadmapScreen({super.key});

  @override
  State<RoadmapScreen> createState() => _RoadmapScreenState();
}

class _RoadmapScreenState extends State<RoadmapScreen> {
  bool _loading = true;
  List<dynamic> _paths = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final list = await context.read<ApiService>().getList('/paths');
      setState(() => _paths = list);
    } catch (_) {
      setState(() => _paths = []);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Learning Roadmap')),
      body: _loading
          ? const LoadingView()
          : _paths.isEmpty
              ? const EmptyState(icon: '🗺️', title: 'No learning paths')
              : RefreshIndicator(
                  onRefresh: _load,
                  color: AppColors.accent,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _paths.length,
                    itemBuilder: (_, i) {
                      final p = _paths[i] as Map<String, dynamic>;
                      final progress = (p['progress'] as num?)?.toInt() ?? 0;
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: InkWell(
                          onTap: () => context.push('/learn/roadmap/${p['_id']}'),
                          borderRadius: BorderRadius.circular(12),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Text(p['icon']?.toString() ?? '🗺️', style: const TextStyle(fontSize: 26)),
                                    const SizedBox(width: 10),
                                    Expanded(child: Text(p['title']?.toString() ?? '', style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700))),
                                    DifficultyChip(difficulty: p['track']?.toString() ?? 'beginner'),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Text(p['description']?.toString() ?? '', maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                                const SizedBox(height: 10),
                                LinearProgressIndicator(value: progress / 100, color: AppColors.accent, backgroundColor: AppColors.bgElevated),
                                Text('${p['completedModules'] ?? 0}/${p['totalModules'] ?? 0} modules · $progress%', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
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
