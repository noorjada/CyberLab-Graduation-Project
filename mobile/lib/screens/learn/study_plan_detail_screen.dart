import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/loading_view.dart';

class StudyPlanDetailScreen extends StatefulWidget {
  final String slug;

  const StudyPlanDetailScreen({super.key, required this.slug});

  @override
  State<StudyPlanDetailScreen> createState() => _StudyPlanDetailScreenState();
}

class _StudyPlanDetailScreenState extends State<StudyPlanDetailScreen> {
  bool _loading = true;
  Map<String, dynamic>? _plan;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await context.read<ApiService>().get('/study-plans/${widget.slug}');
      setState(() => _plan = data);
    } catch (_) {
      setState(() => _plan = null);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _enroll() async {
    if (_plan == null) return;
    await context.read<ApiService>().post('/study-plans/${_plan!['_id']}/enroll');
    await _load();
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enrolled in study plan')),
      );
    }
  }

  void _openLink(BuildContext context, Map<String, dynamic> link) {
    final path = link['path']?.toString() ?? '';
    if (path.startsWith('/challenges')) {
      final open = Uri.tryParse('http://x$path')?.queryParameters['open'];
      if (open != null) context.push('/challenges');
      else context.push('/challenges');
    } else if (path.startsWith('/exams')) {
      context.push('/exams');
    } else if (path.startsWith('/reference/')) {
      context.push('/learn/reference/${path.split('/').last}');
    } else if (path.startsWith('/study-plans')) {
      context.push('/learn/plans');
    } else if (path.startsWith('/labs')) {
      context.push('/labs');
    } else {
      context.push('/learn/reference');
    }
  }

  Future<void> _toggleTopic(String topicId) async {
    if (_plan == null) return;
    await context.read<ApiService>().post(
      '/study-plans/${_plan!['_id']}/topics/$topicId/toggle',
    );
    await _load();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Study Plan')),
        body: const LoadingView(),
      );
    }

    if (_plan == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Study Plan')),
        body: const Center(child: Text('Plan not found')),
      );
    }

    final enrolled = _plan!['enrolled'] == true;
    final phases = _plan!['phases'] as List<dynamic>? ?? [];

    return Scaffold(
      appBar: AppBar(title: Text(_plan!['title']?.toString() ?? 'Study Plan')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (!enrolled)
            ElevatedButton(onPressed: _enroll, child: const Text('Enroll in this plan')),
          if (enrolled) ...[
            LinearProgressIndicator(
              value: ((_plan!['progress'] as num?) ?? 0) / 100,
              backgroundColor: AppColors.bgElevated,
              color: AppColors.accent,
            ),
            const SizedBox(height: 6),
            Text(
              '${_plan!['completedTopics'] ?? 0}/${_plan!['totalTopics'] ?? 0} topics complete',
              style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
            ),
          ],
          const SizedBox(height: 16),
          ...phases.map((phase) {
            final p = phase as Map<String, dynamic>;
            final topics = p['topics'] as List<dynamic>? ?? [];
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  p['title']?.toString() ?? 'Phase',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 8),
                ...topics.map((t) {
                  final topic = t as Map<String, dynamic>;
                  final done = topic['completed'] == true;
                  final links = topic['links'] as List<dynamic>? ?? [];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ExpansionTile(
                      leading: Checkbox(
                        value: done,
                        onChanged: enrolled ? (_) => _toggleTopic(topic['id']?.toString() ?? '') : null,
                        activeColor: AppColors.accent,
                      ),
                      title: Text(topic['title']?.toString() ?? 'Topic', style: const TextStyle(fontWeight: FontWeight.w600)),
                      subtitle: Text(topic['description']?.toString() ?? '', maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12)),
                      children: links.map((l) {
                        final link = l as Map<String, dynamic>;
                        return ListTile(
                          dense: true,
                          leading: Text(link['icon']?.toString() ?? '🔗', style: const TextStyle(fontSize: 16)),
                          title: Text(link['label']?.toString() ?? link['title']?.toString() ?? 'Resource', style: const TextStyle(fontSize: 13)),
                          trailing: const Icon(Icons.open_in_new, size: 16),
                          onTap: () => _openLink(context, link),
                        );
                      }).toList(),
                    ),
                  );
                }),
                const SizedBox(height: 12),
              ],
            );
          }),
        ],
      ),
    );
  }
}
