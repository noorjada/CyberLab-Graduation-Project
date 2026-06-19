import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/exam_provider.dart';
import '../services/api_service.dart';
import '../theme/app_colors.dart';

class CyberBotFab extends StatelessWidget {
  const CyberBotFab({super.key});

  @override
  Widget build(BuildContext context) {
    if (context.watch<ExamProvider>().inExam) return const SizedBox.shrink();
    return FloatingActionButton.extended(
      onPressed: () => showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        backgroundColor: AppColors.bgSecondary,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
        ),
        builder: (_) => const Padding(
          padding: EdgeInsets.only(bottom: 0),
          child: CyberBotSheet(),
        ),
      ),
      backgroundColor: AppColors.accentBlue,
      foregroundColor: Colors.white,
      icon: const Text('🤖', style: TextStyle(fontSize: 18)),
      label: const Text('CyberBot'),
    );
  }
}

class CyberBotSheet extends StatefulWidget {
  const CyberBotSheet({super.key});

  @override
  State<CyberBotSheet> createState() => _CyberBotSheetState();
}

class _CyberBotSheetState extends State<CyberBotSheet> {
  final _messages = <Map<String, String>>[];
  final _input = TextEditingController();
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthProvider>().user;
    _messages.add({
      'role': 'assistant',
      'content': user != null
          ? 'Hey ${user.username}! I\'m CyberBot 🤖\nLevel ${user.level} · ${user.points} pts\nAsk me about labs, weak areas, or concepts!'
          : 'Hi! I\'m CyberBot 🤖 Your cybersecurity mentor.',
    });
  }

  @override
  void dispose() {
    _input.dispose();
    super.dispose();
  }

  Future<void> _send([String? text]) async {
    final msg = (text ?? _input.text).trim();
    if (msg.isEmpty || _loading) return;
    if (context.read<ExamProvider>().inExam) {
      setState(() => _messages.add({
            'role': 'assistant',
            'content': '🔒 CyberBot is disabled during your practice exam.',
          }));
      return;
    }
    _input.clear();
    setState(() {
      _messages.add({'role': 'user', 'content': msg});
      _loading = true;
    });
    try {
      final history = _messages
          .where((m) => m['role'] != 'assistant' || _messages.indexOf(m) > 0)
          .map((m) => {'role': m['role']!, 'content': m['content']!})
          .toList();
      final res = await context.read<ApiService>().post('/ai/chat', {
        'message': msg,
        'conversationHistory': history.length > 1 ? history.sublist(0, history.length - 1).take(10).toList() : [],
      });
      setState(() => _messages.add({'role': 'assistant', 'content': res['message']?.toString() ?? 'No response'}));
    } on ApiException catch (e) {
      setState(() => _messages.add({'role': 'assistant', 'content': e.message}));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final height = MediaQuery.of(context).size.height * 0.75;
    return SizedBox(
      height: height,
      child: Column(
        children: [
          const SizedBox(height: 8),
          Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(2))),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                const Text('🤖 CyberBot', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                const Spacer(),
                IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close)),
              ],
            ),
          ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _messages.length,
              itemBuilder: (_, i) {
                final m = _messages[i];
                final isUser = m['role'] == 'user';
                return Align(
                  alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(12),
                    constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.8),
                    decoration: BoxDecoration(
                      color: isUser ? AppColors.accentBlue.withValues(alpha: 0.15) : AppColors.bgElevated,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Text(m['content'] ?? '', style: const TextStyle(height: 1.4)),
                  ),
                );
              },
            ),
          ),
          if (_loading) const LinearProgressIndicator(color: AppColors.accent, minHeight: 2),
          Padding(
            padding: EdgeInsets.fromLTRB(12, 8, 12, MediaQuery.of(context).viewInsets.bottom + 12),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _input,
                    decoration: const InputDecoration(hintText: 'Ask CyberBot...'),
                    onSubmitted: _send,
                  ),
                ),
                IconButton.filled(onPressed: _loading ? null : () => _send(), icon: const Icon(Icons.send)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
