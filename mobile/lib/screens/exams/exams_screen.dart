import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/difficulty_chip.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/loading_view.dart';

class ExamsScreen extends StatefulWidget {
  const ExamsScreen({super.key});

  @override
  State<ExamsScreen> createState() => _ExamsScreenState();
}

class _ExamsScreenState extends State<ExamsScreen> {
  bool _loading = true;
  List<dynamic> _exams = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final list = await context.read<ApiService>().getList('/exams');
      setState(() => _exams = list);
    } catch (_) {
      setState(() => _exams = []);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Practice Exams'),
        actions: [
          IconButton(
            icon: const Icon(Icons.history),
            tooltip: 'Exam history',
            onPressed: () => context.push('/exams/history'),
          ),
        ],
      ),
      body: _loading
          ? const LoadingView()
          : _exams.isEmpty
              ? const EmptyState(icon: '🎓', title: 'No exams available')
              : RefreshIndicator(
                  onRefresh: _load,
                  color: AppColors.accent,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _exams.length,
                    itemBuilder: (context, i) {
                      final exam = _exams[i] as Map<String, dynamic>;
                      final passed = exam['passed'] == true;
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: InkWell(
                          onTap: () => context.push('/exams/${exam['_id']}'),
                          borderRadius: BorderRadius.circular(12),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Text(exam['icon']?.toString() ?? '🎓', style: const TextStyle(fontSize: 28)),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Text(
                                        exam['title']?.toString() ?? 'Exam',
                                        style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
                                      ),
                                    ),
                                    if (passed) const Icon(Icons.check_circle, color: AppColors.accent),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  exam['description']?.toString() ?? '',
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                                ),
                                const SizedBox(height: 10),
                                Wrap(
                                  spacing: 8,
                                  runSpacing: 6,
                                  children: [
                                    DifficultyChip(difficulty: exam['difficulty']?.toString() ?? 'medium'),
                                    _Meta('${exam['questionCount'] ?? 0} Q'),
                                    _Meta('${exam['durationMinutes'] ?? 60} min'),
                                    _Meta('${exam['passThreshold'] ?? 70}% pass'),
                                  ],
                                ),
                                if (exam['bestScore'] != null)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 8),
                                    child: Text(
                                      'Best: ${exam['bestScore']}%',
                                      style: const TextStyle(color: AppColors.accentBlue, fontSize: 12),
                                    ),
                                  ),
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

class _Meta extends StatelessWidget {
  final String text;
  const _Meta(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(text, style: const TextStyle(color: AppColors.textSecondary, fontSize: 11));
  }
}
