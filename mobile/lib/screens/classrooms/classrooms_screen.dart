import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/loading_view.dart';

class ClassroomsScreen extends StatefulWidget {
  const ClassroomsScreen({super.key});

  @override
  State<ClassroomsScreen> createState() => _ClassroomsScreenState();
}

class _ClassroomsScreenState extends State<ClassroomsScreen> {
  bool _loading = true;
  List<dynamic> _enrolled = [];
  final _code = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _code.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final res = await context.read<ApiService>().get('/classrooms/mine');
      setState(() => _enrolled = res['enrolled'] as List<dynamic>? ?? []);
    } catch (_) {
      setState(() => _enrolled = []);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _join() async {
    if (_code.text.trim().isEmpty) return;
    try {
      await context.read<ApiService>().post('/classrooms/join', {'inviteCode': _code.text.trim().toUpperCase()});
      _code.clear();
      await _load();
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Joined classroom!')));
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('University Portal')),
      body: _loading
          ? const LoadingView()
          : RefreshIndicator(
              onRefresh: _load,
              color: AppColors.accent,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const Text('Join with invite code', style: TextStyle(fontWeight: FontWeight.w700)),
                          const SizedBox(height: 8),
                          TextField(controller: _code, decoration: const InputDecoration(hintText: 'ABCD1234')),
                          const SizedBox(height: 8),
                          ElevatedButton(onPressed: _join, child: const Text('Join classroom')),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  if (_enrolled.isEmpty)
                    const EmptyState(icon: '🏛️', title: 'Not enrolled in any class')
                  else
                    ..._enrolled.map((c) {
                      final cls = c as Map<String, dynamic>;
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          leading: const Text('🏛️', style: TextStyle(fontSize: 22)),
                          title: Text(cls['name']?.toString() ?? '', style: const TextStyle(fontWeight: FontWeight.w600)),
                          subtitle: Text('${cls['courseCode'] ?? ''} · Instructor: ${cls['instructor']?['username'] ?? 'TBD'}', style: const TextStyle(fontSize: 12)),
                        ),
                      );
                    }),
                ],
              ),
            ),
    );
  }
}
