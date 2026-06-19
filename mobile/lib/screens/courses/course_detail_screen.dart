import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../config/api_config.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/desktop_only_banner.dart';
import '../../widgets/loading_view.dart';
import '../../widgets/quiz_sheet.dart';

class CourseDetailScreen extends StatefulWidget {
  final String courseId;

  const CourseDetailScreen({super.key, required this.courseId});

  @override
  State<CourseDetailScreen> createState() => _CourseDetailScreenState();
}

class _CourseDetailScreenState extends State<CourseDetailScreen> {
  bool _loading = true;
  Map<String, dynamic>? _course;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await context.read<ApiService>().get('/courses/${widget.courseId}');
      setState(() => _course = data);
    } catch (_) {
      setState(() => _course = null);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _completeLesson(String moduleId) async {
    await context.read<ApiService>().post('/courses/${widget.courseId}/modules/$moduleId/complete');
    await _load();
    if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Lesson completed')));
  }

  Future<void> _submitQuiz(Map<String, dynamic> module) async {
    final questions = module['questions'] as List<dynamic>? ?? [];
    final answers = await showQuizSheet(context, questions, module['title']?.toString() ?? 'Quiz');
    if (answers == null) return;
    final res = await context.read<ApiService>().post(
      '/courses/${widget.courseId}/modules/${module['id']}/submit',
      {'answers': answers},
    );
    await _load();
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Score: ${res['graded']?['score'] ?? res['score']}%')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: LoadingView());
    if (_course == null) return const Scaffold(body: Center(child: Text('Course not found')));

    final modules = (_course!['modules'] as List<dynamic>? ?? [])
      ..sort((a, b) => ((a as Map)['order'] as num? ?? 0).compareTo((b as Map)['order'] as num? ?? 0));

    return Scaffold(
      appBar: AppBar(title: Text(_course!['title']?.toString() ?? 'Course')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(_course!['description']?.toString() ?? '', style: const TextStyle(color: AppColors.textSecondary, height: 1.4)),
          const SizedBox(height: 16),
          ...modules.map((m) {
            final mod = m as Map<String, dynamic>;
            final type = mod['type']?.toString() ?? 'lesson';
            final done = mod['completed'] == true;
            final unlocked = mod['unlocked'] != false;
            return Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ExpansionTile(
                leading: Text(done ? '✅' : type == 'lab' ? '🖥️' : '📘'),
                title: Text(mod['title']?.toString() ?? '', style: TextStyle(fontWeight: FontWeight.w600, color: unlocked ? null : AppColors.textSecondary)),
                subtitle: Text('$type · ${mod['estimatedMinutes'] ?? 30} min', style: const TextStyle(fontSize: 11)),
                children: [
                  if (!unlocked)
                    const Padding(padding: EdgeInsets.all(12), child: Text('Complete previous modules to unlock'))
                  else if (type == 'lesson') ...[
                    if (mod['lessonContent'] != null)
                      Padding(padding: const EdgeInsets.all(12), child: Text(mod['lessonContent'].toString())),
                    if (mod['videoYoutubeId'] != null)
                      TextButton(
                        onPressed: () => launchUrl(Uri.parse('https://youtube.com/watch?v=${mod['videoYoutubeId']}'), mode: LaunchMode.externalApplication),
                        child: const Text('▶ Watch video on YouTube'),
                      ),
                    if (!done)
                      Padding(
                        padding: const EdgeInsets.all(12),
                        child: ElevatedButton(onPressed: () => _completeLesson(mod['id']?.toString() ?? ''), child: const Text('Mark complete')),
                      ),
                  ] else if (type == 'quiz' || type == 'exam') ...[
                    Padding(
                      padding: const EdgeInsets.all(12),
                      child: ElevatedButton(
                        onPressed: done ? null : () => _submitQuiz(mod),
                        child: Text(done ? 'Completed' : 'Take quiz'),
                      ),
                    ),
                  ] else if (type == 'lab') ...[
                    const Padding(padding: EdgeInsets.all(12), child: DesktopOnlyBanner(feature: 'Course lab module', webPath: '/labs')),
                  ],
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}
