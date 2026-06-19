import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/loading_view.dart';
import '../../widgets/quiz_sheet.dart';

class RoadmapDetailScreen extends StatefulWidget {
  final String pathId;

  const RoadmapDetailScreen({super.key, required this.pathId});

  @override
  State<RoadmapDetailScreen> createState() => _RoadmapDetailScreenState();
}

class _RoadmapDetailScreenState extends State<RoadmapDetailScreen> {
  bool _loading = true;
  Map<String, dynamic>? _path;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await context.read<ApiService>().get('/paths/${widget.pathId}');
      setState(() => _path = data);
    } catch (_) {
      setState(() => _path = null);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _completeModule(Map<String, dynamic> module) async {
    List<int>? answers;
    final quiz = module['quiz'] as List<dynamic>? ?? [];
    if (quiz.isNotEmpty) {
      answers = await showQuizSheet(context, quiz, module['title']?.toString() ?? 'Quiz');
      if (answers == null) return;
    }
    try {
      final res = await context.read<ApiService>().post(
        '/paths/${widget.pathId}/modules/${module['_id']}/complete',
        answers != null ? {'answers': answers} : null,
      );
      await context.read<AuthProvider>().refreshUser();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('✅ +${res['xpEarned'] ?? 0} XP')));
        await _load();
      }
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  Future<void> _claimCert() async {
    try {
      await context.read<ApiService>().post('/certificates/claim/${widget.pathId}');
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('🎓 Certificate claimed!')));
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: LoadingView());
    if (_path == null) return const Scaffold(body: Center(child: Text('Path not found')));

    final modules = _path!['modules'] as List<dynamic>? ?? [];
    final user = context.watch<AuthProvider>().user;

    return Scaffold(
      appBar: AppBar(title: Text(_path!['title']?.toString() ?? 'Path')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(_path!['description']?.toString() ?? '', style: const TextStyle(color: AppColors.textSecondary, height: 1.4)),
          const SizedBox(height: 16),
          ...modules.map((m) {
            final mod = m as Map<String, dynamic>;
            final id = mod['_id']?.toString() ?? '';
            final done = user?.isModuleCompleted(id) ?? false;
            return Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                leading: Text(done ? '✅' : '📘', style: const TextStyle(fontSize: 20)),
                title: Text(mod['title']?.toString() ?? '', style: const TextStyle(fontWeight: FontWeight.w600)),
                subtitle: Text(mod['description']?.toString() ?? '', maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12)),
                trailing: done
                    ? const Icon(Icons.check_circle, color: AppColors.accent)
                    : ElevatedButton(onPressed: () => _completeModule(mod), child: const Text('Done')),
              ),
            );
          }),
          const SizedBox(height: 12),
          OutlinedButton(onPressed: _claimCert, child: const Text('🎓 Claim certificate')),
        ],
      ),
    );
  }
}
