import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';
import '../../utils/format_utils.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/loading_view.dart';

/// Platform activity feed — `GET /activity` (same as web dashboard).
class ActivityScreen extends StatefulWidget {
  const ActivityScreen({super.key});

  @override
  State<ActivityScreen> createState() => _ActivityScreenState();
}

class _ActivityScreenState extends State<ActivityScreen> {
  bool _loading = true;
  List<dynamic> _items = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final list = await context.read<ApiService>().getList('/activity');
      setState(() => _items = list);
    } catch (_) {
      setState(() => _items = []);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _iconFor(String? type) {
    switch (type) {
      case 'challenge_solved':
        return '🚩';
      case 'exam_passed':
        return '🎓';
      case 'lab_completed':
        return '🖥️';
      case 'badge_earned':
        return '🏅';
      case 'cert_earned':
        return '📜';
      default:
        return '⚡';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Activity Feed')),
      body: _loading
          ? const LoadingView()
          : _items.isEmpty
              ? const EmptyState(icon: '📡', title: 'No activity yet')
              : RefreshIndicator(
                  onRefresh: _load,
                  color: AppColors.accent,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _items.length,
                    itemBuilder: (_, i) {
                      final a = _items[i] as Map<String, dynamic>;
                      final created = DateTime.tryParse(a['createdAt']?.toString() ?? '') ?? DateTime.now();
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          leading: Text(_iconFor(a['type']?.toString()), style: const TextStyle(fontSize: 22)),
                          title: Text(a['message']?.toString() ?? a['title']?.toString() ?? 'Activity'),
                          subtitle: Text(
                            '${a['username'] ?? 'User'} · ${timeAgo(created)}',
                            style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
