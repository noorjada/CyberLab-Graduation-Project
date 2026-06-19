import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/loading_view.dart';

class DailyScreen extends StatefulWidget {
  const DailyScreen({super.key});

  @override
  State<DailyScreen> createState() => _DailyScreenState();
}

class _DailyScreenState extends State<DailyScreen> {
  bool _loading = true;
  Map<String, dynamic>? _daily;
  final _flag = TextEditingController();
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _flag.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final data = await context.read<ApiService>().get('/daily');
      setState(() => _daily = data);
    } catch (_) {
      setState(() => _daily = null);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _submit() async {
    setState(() => _submitting = true);
    try {
      final res = await context.read<ApiService>().post('/daily/submit', {'flag': _flag.text.trim()});
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('✅ ${res['message'] ?? 'Solved!'} · Streak: ${res['streak'] ?? 0}')),
        );
        await context.read<AuthProvider>().refreshUser();
      }
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;

    return Scaffold(
      appBar: AppBar(title: const Text('Daily Challenge')),
      body: _loading
          ? const LoadingView()
          : Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if ((user?.dailyStreak ?? 0) > 0)
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Text('🔥 ${user!.dailyStreak}-day streak', style: const TextStyle(fontWeight: FontWeight.w700)),
                      ),
                    ),
                  const SizedBox(height: 12),
                  Text(_daily?['challenge']?['title']?.toString() ?? 'No challenge today',
                      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 8),
                  Text(_daily?['challenge']?['description']?.toString() ?? '',
                      style: const TextStyle(color: AppColors.textSecondary, height: 1.4)),
                  const Spacer(),
                  TextField(controller: _flag, decoration: const InputDecoration(labelText: 'Flag')),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: _submitting ? null : _submit,
                    child: _submitting ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Submit'),
                  ),
                ],
              ),
            ),
    );
  }
}
