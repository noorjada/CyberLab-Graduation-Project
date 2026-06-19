import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/loading_view.dart';

/// Past exam attempts — `GET /exams/attempts/my` (same as web exams page).
class ExamHistoryScreen extends StatefulWidget {
  const ExamHistoryScreen({super.key});

  @override
  State<ExamHistoryScreen> createState() => _ExamHistoryScreenState();
}

class _ExamHistoryScreenState extends State<ExamHistoryScreen> {
  bool _loading = true;
  List<dynamic> _attempts = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final list = await context.read<ApiService>().getList('/exams/attempts/my');
      setState(() => _attempts = list);
    } catch (_) {
      setState(() => _attempts = []);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Exam History')),
      body: _loading
          ? const LoadingView()
          : _attempts.isEmpty
              ? const EmptyState(icon: '📋', title: 'No exam attempts yet', subtitle: 'Take a practice exam from the Exams tab')
              : RefreshIndicator(
                  onRefresh: _load,
                  color: AppColors.accent,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _attempts.length,
                    itemBuilder: (_, i) {
                      final a = _attempts[i] as Map<String, dynamic>;
                      final exam = a['exam'] as Map<String, dynamic>?;
                      final passed = a['passed'] == true;
                      final score = a['score'];
                      final submitted = DateTime.tryParse(a['submittedAt']?.toString() ?? '');
                      return Card(
                        margin: const EdgeInsets.only(bottom: 10),
                        child: ListTile(
                          leading: Text(exam?['icon']?.toString() ?? '🎓', style: const TextStyle(fontSize: 26)),
                          title: Text(exam?['title']?.toString() ?? 'Exam', style: const TextStyle(fontWeight: FontWeight.w700)),
                          subtitle: Text(
                            '${a['correctCount'] ?? 0}/${a['totalQuestions'] ?? 0} correct'
                            '${submitted != null ? ' · ${submitted.toLocal().toString().split('.').first}' : ''}',
                            style: const TextStyle(fontSize: 12),
                          ),
                          trailing: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text('$score%', style: TextStyle(fontWeight: FontWeight.w800, color: passed ? AppColors.accent : AppColors.danger)),
                              Text(passed ? 'PASSED' : 'FAILED', style: TextStyle(fontSize: 10, color: passed ? AppColors.accent : AppColors.danger)),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
