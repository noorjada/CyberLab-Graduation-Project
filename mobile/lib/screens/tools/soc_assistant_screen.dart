import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';

class SocAssistantScreen extends StatefulWidget {
  const SocAssistantScreen({super.key});

  @override
  State<SocAssistantScreen> createState() => _SocAssistantScreenState();
}

class _SocAssistantScreenState extends State<SocAssistantScreen> {
  final _messages = <Map<String, String>>[
    {'role': 'assistant', 'content': '🛡️ SOC Analyst AI — paste logs or describe an alert to get started.'},
  ];
  final _input = TextEditingController();
  bool _loading = false;

  @override
  void dispose() {
    _input.dispose();
    super.dispose();
  }

  Future<void> _send([String? text]) async {
    final msg = (text ?? _input.text).trim();
    if (msg.isEmpty || _loading) return;
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
      final res = await context.read<ApiService>().post('/ai/soc', {
        'message': msg,
        'conversationHistory': history.length > 1 ? history.sublist(0, history.length - 1) : [],
      });
      setState(() => _messages.add({'role': 'assistant', 'content': res['message']?.toString() ?? 'No response'}));
    } on ApiException catch (e) {
      setState(() => _messages.add({'role': 'assistant', 'content': e.message}));
    } catch (_) {
      setState(() => _messages.add({'role': 'assistant', 'content': 'Something went wrong'}));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('SOC Assistant')),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (context, i) {
                final m = _messages[i];
                final isUser = m['role'] == 'user';
                return Align(
                  alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(12),
                    constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.82),
                    decoration: BoxDecoration(
                      color: isUser ? AppColors.accentBlue.withValues(alpha: 0.15) : AppColors.bgSecondary,
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
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _input,
                    decoration: const InputDecoration(hintText: 'Describe an alert or paste logs...'),
                    onSubmitted: _send,
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filled(onPressed: _loading ? null : () => _send(), icon: const Icon(Icons.send)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
