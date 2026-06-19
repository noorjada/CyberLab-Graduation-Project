import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/desktop_only_banner.dart';
import '../../widgets/loading_view.dart';

class EventDetailScreen extends StatefulWidget {
  final String eventId;

  const EventDetailScreen({super.key, required this.eventId});

  @override
  State<EventDetailScreen> createState() => _EventDetailScreenState();
}

class _EventDetailScreenState extends State<EventDetailScreen> {
  bool _loading = true;
  Map<String, dynamic>? _event;
  List<dynamic> _leaderboard = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final api = context.read<ApiService>();
      final events = await api.getList('/events');
      final event = events.cast<Map<String, dynamic>?>().firstWhere(
            (e) => e?['_id']?.toString() == widget.eventId,
            orElse: () => null,
          );
      final board = await api.getList('/events/${widget.eventId}/leaderboard');
      setState(() {
        _event = event;
        _leaderboard = board;
      });
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _join() async {
    await context.read<ApiService>().post('/events/${widget.eventId}/join');
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Joined event!')));
      await _load();
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: LoadingView());
    if (_event == null) return const Scaffold(body: Center(child: Text('Event not found')));

    final challenges = _event!['challenges'] as List<dynamic>? ?? [];
    final labs = _event!['labs'] as List<dynamic>? ?? [];

    return Scaffold(
      appBar: AppBar(title: Text(_event!['title']?.toString() ?? 'Event')),
      body: RefreshIndicator(
        onRefresh: _load,
        color: AppColors.accent,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(_event!['description']?.toString() ?? '', style: const TextStyle(height: 1.45)),
            const SizedBox(height: 12),
            ElevatedButton(onPressed: _join, child: const Text('Join event')),
            const SizedBox(height: 20),
            const Text('Leaderboard', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
            const SizedBox(height: 8),
            if (_leaderboard.isEmpty)
              const Text('No scores yet', style: TextStyle(color: AppColors.textSecondary))
            else
              ..._leaderboard.take(20).map((p) {
                final row = p as Map<String, dynamic>;
                return ListTile(
                  dense: true,
                  leading: CircleAvatar(
                    radius: 14,
                    child: Text('${row['rank']}', style: const TextStyle(fontSize: 11)),
                  ),
                  title: Text(row['username']?.toString() ?? ''),
                  trailing: Text('${row['points']} pts'),
                );
              }),
            const SizedBox(height: 20),
            const Text('Challenges', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            ...challenges.map((c) {
              final ch = c as Map<String, dynamic>;
              return ListTile(
                title: Text(ch['title']?.toString() ?? ''),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.push('/challenges/${ch['_id']}'),
              );
            }),
            if (labs.isNotEmpty) ...[
              const SizedBox(height: 12),
              const DesktopOnlyBanner(feature: 'Event labs', webPath: '/events'),
            ],
          ],
        ),
      ),
    );
  }
}
