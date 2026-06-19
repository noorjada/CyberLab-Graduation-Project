import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';
import '../../utils/format_utils.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/loading_view.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  bool _loading = true;
  List<dynamic> _items = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final res = await context.read<ApiService>().get('/notifications');
      setState(() => _items = res['notifications'] as List<dynamic>? ?? []);
    } catch (_) {
      setState(() => _items = []);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _markAllRead() async {
    await context.read<ApiService>().put('/notifications/read/all');
    await _load();
  }

  Future<void> _markRead(String id) async {
    await context.read<ApiService>().put('/notifications/$id/read');
    await _load();
  }

  Future<void> _delete(String id) async {
    await context.read<ApiService>().delete('/notifications/$id');
    await _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          TextButton(onPressed: _markAllRead, child: const Text('Mark all read')),
        ],
      ),
      body: _loading
          ? const LoadingView()
          : _items.isEmpty
              ? const EmptyState(icon: '🔔', title: 'No notifications yet')
              : RefreshIndicator(
                  onRefresh: _load,
                  color: AppColors.accent,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _items.length,
                    itemBuilder: (_, i) {
                      final n = _items[i] as Map<String, dynamic>;
                      final read = n['read'] == true;
                      final created = DateTime.tryParse(n['createdAt']?.toString() ?? '') ?? DateTime.now();
                      return Card(
                        color: read ? null : AppColors.accent.withValues(alpha: 0.06),
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          leading: Text(n['icon']?.toString() ?? '🔔', style: const TextStyle(fontSize: 22)),
                          title: Text(n['title']?.toString() ?? '', style: TextStyle(fontWeight: read ? FontWeight.w500 : FontWeight.w700)),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(n['message']?.toString() ?? '', style: const TextStyle(fontSize: 12)),
                              Text(timeAgo(created), style: const TextStyle(fontSize: 10, color: AppColors.textSecondary)),
                            ],
                          ),
                          onTap: () => _markRead(n['_id']?.toString() ?? ''),
                          trailing: IconButton(
                            icon: const Icon(Icons.close, size: 18),
                            onPressed: () => _delete(n['_id']?.toString() ?? ''),
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
