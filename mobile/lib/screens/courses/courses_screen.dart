import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/loading_view.dart';

class CoursesScreen extends StatefulWidget {
  const CoursesScreen({super.key});

  @override
  State<CoursesScreen> createState() => _CoursesScreenState();
}

class _CoursesScreenState extends State<CoursesScreen> {
  bool _loading = true;
  List<dynamic> _enrolled = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final res = await context.read<ApiService>().get('/courses/mine');
      setState(() => _enrolled = res['enrolled'] as List<dynamic>? ?? []);
    } catch (_) {
      setState(() => _enrolled = []);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Courses')),
      body: _loading
          ? const LoadingView()
          : _enrolled.isEmpty
              ? const EmptyState(icon: '📖', title: 'No enrolled courses', subtitle: 'Join a classroom to access courses')
              : RefreshIndicator(
                  onRefresh: _load,
                  color: AppColors.accent,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _enrolled.length,
                    itemBuilder: (_, i) {
                      final c = _enrolled[i] as Map<String, dynamic>;
                      final progress = (c['progressPercent'] as num?)?.toInt() ?? 0;
                      return Card(
                        margin: const EdgeInsets.only(bottom: 10),
                        child: ListTile(
                          leading: Text(c['icon']?.toString() ?? '📖', style: const TextStyle(fontSize: 24)),
                          title: Text(c['title']?.toString() ?? '', style: const TextStyle(fontWeight: FontWeight.w600)),
                          subtitle: Text('$progress% complete'),
                          trailing: const Icon(Icons.chevron_right),
                          onTap: () => context.push('/courses/${c['_id']}'),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
