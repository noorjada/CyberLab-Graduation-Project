import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/loading_view.dart';

/// University assignments — loads from enrolled classrooms via `GET /assignments/classroom/:id`.
class AssignmentsScreen extends StatefulWidget {
  const AssignmentsScreen({super.key});

  @override
  State<AssignmentsScreen> createState() => _AssignmentsScreenState();
}

class _AssignmentsScreenState extends State<AssignmentsScreen> {
  bool _loading = true;
  List<Map<String, dynamic>> _assignments = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final api = context.read<ApiService>();
      final classrooms = await api.getList('/classrooms/mine');
      final all = <Map<String, dynamic>>[];
      for (final c in classrooms) {
        final id = (c as Map)['_id']?.toString();
        if (id == null) continue;
        try {
          final list = await api.getList('/assignments/classroom/$id');
          for (final a in list) {
            final m = Map<String, dynamic>.from(a as Map);
            m['classroomName'] = c['name'];
            all.add(m);
          }
        } catch (_) {}
      }
      setState(() => _assignments = all);
    } catch (_) {
      setState(() => _assignments = []);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Assignments')),
      body: _loading
          ? const LoadingView()
          : _assignments.isEmpty
              ? const EmptyState(icon: '📝', title: 'No assignments', subtitle: 'Join a classroom to see assignments')
              : RefreshIndicator(
                  onRefresh: _load,
                  color: AppColors.accent,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _assignments.length,
                    itemBuilder: (_, i) {
                      final a = _assignments[i];
                      final due = DateTime.tryParse(a['dueDate']?.toString() ?? '');
                      return Card(
                        margin: const EdgeInsets.only(bottom: 10),
                        child: Padding(
                          padding: const EdgeInsets.all(14),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(a['title']?.toString() ?? 'Assignment', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                              Text(a['classroomName']?.toString() ?? '', style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                              if (a['description'] != null) ...[
                                const SizedBox(height: 6),
                                Text(a['description'].toString(), maxLines: 3, overflow: TextOverflow.ellipsis),
                              ],
                              if (due != null)
                                Padding(
                                  padding: const EdgeInsets.only(top: 8),
                                  child: Text('Due: ${due.toLocal().toString().split(' ').first}', style: const TextStyle(fontSize: 11, color: AppColors.accentBlue)),
                                ),
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
