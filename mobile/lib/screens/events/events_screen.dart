import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/desktop_only_banner.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/loading_view.dart';

class EventsScreen extends StatefulWidget {
  const EventsScreen({super.key});

  @override
  State<EventsScreen> createState() => _EventsScreenState();
}

class _EventsScreenState extends State<EventsScreen> {
  bool _loading = true;
  List<dynamic> _events = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final list = await context.read<ApiService>().getList('/events');
      setState(() => _events = list);
    } catch (_) {
      setState(() => _events = []);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _join(String id) async {
    await context.read<ApiService>().post('/events/$id/join');
    if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Joined event!')));
    await _load();
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'live':
        return AppColors.accent;
      case 'upcoming':
        return AppColors.accentBlue;
      default:
        return AppColors.textSecondary;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('CTF Events')),
      body: _loading
          ? const LoadingView()
          : _events.isEmpty
              ? const EmptyState(icon: '🏁', title: 'No events right now')
              : RefreshIndicator(
                  onRefresh: _load,
                  color: AppColors.accent,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _events.length,
                    itemBuilder: (_, i) {
                      final e = _events[i] as Map<String, dynamic>;
                      final status = e['status']?.toString() ?? 'upcoming';
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(child: Text(e['title']?.toString() ?? '', style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700))),
                                  Chip(
                                    label: Text(status, style: const TextStyle(fontSize: 10)),
                                    backgroundColor: _statusColor(status).withValues(alpha: 0.15),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(e['description']?.toString() ?? '', style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                              const SizedBox(height: 10),
                              Text('${(e['challenges'] as List?)?.length ?? 0} challenges · ${(e['labs'] as List?)?.length ?? 0} labs',
                                  style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                              if ((e['labs'] as List?)?.isNotEmpty == true) ...[
                                const SizedBox(height: 8),
                                const DesktopOnlyBanner(feature: 'Event labs', webPath: '/events'),
                              ],
                              const SizedBox(height: 10),
                              Row(
                                children: [
                                  Expanded(child: ElevatedButton(onPressed: () => _join(e['_id']?.toString() ?? ''), child: const Text('Join'))),
                                  const SizedBox(width: 8),
                                  OutlinedButton(
                                    onPressed: () => context.push('/events/${e['_id']}'),
                                    child: const Text('Details'),
                                  ),
                                ],
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
