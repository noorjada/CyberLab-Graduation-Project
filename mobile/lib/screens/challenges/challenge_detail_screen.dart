import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/exam_provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/difficulty_chip.dart';
import '../../widgets/loading_view.dart';

class ChallengeDetailScreen extends StatefulWidget {
  final String id;

  const ChallengeDetailScreen({super.key, required this.id});

  @override
  State<ChallengeDetailScreen> createState() => _ChallengeDetailScreenState();
}

class _ChallengeDetailScreenState extends State<ChallengeDetailScreen> with SingleTickerProviderStateMixin {
  bool _loading = true;
  Map<String, dynamic>? _challenge;
  final _flag = TextEditingController();
  final _aiInput = TextEditingController();
  bool _submitting = false;
  bool _aiLoading = false;
  String? _result;
  int _hintsRevealed = 0;
  final _aiMessages = <Map<String, String>>[];
  final _writeupTitle = TextEditingController();
  final _writeupBody = TextEditingController();
  List<dynamic> _writeups = [];
  bool _writeupsLoading = false;
  late TabController _tabs;
  bool _bookmarked = false;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 4, vsync: this);
    _load();
    _tabs.addListener(() {
      if (_tabs.index == 3 && _writeups.isEmpty && !_writeupsLoading) _loadWriteups();
    });
  }

  @override
  void dispose() {
    _flag.dispose();
    _aiInput.dispose();
    _writeupTitle.dispose();
    _writeupBody.dispose();
    _tabs.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final c = await context.read<ApiService>().get('/challenges/${widget.id}');
      setState(() => _challenge = c);
      _checkBookmark();
    } catch (_) {
      setState(() => _challenge = null);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _checkBookmark() async {
    try {
      final list = await context.read<ApiService>().getList('/bookmarks');
      setState(() => _bookmarked = list.any((b) => (b as Map)['itemId']?.toString() == widget.id));
    } catch (_) {}
  }

  Future<void> _toggleBookmark() async {
    if (_bookmarked) {
      await context.read<ApiService>().delete('/bookmarks/challenge/${widget.id}');
    } else {
      await context.read<ApiService>().post('/bookmarks', {'itemType': 'challenge', 'itemId': widget.id});
    }
    setState(() => _bookmarked = !_bookmarked);
  }

  Future<void> _submitFlag() async {
    final flag = _flag.text.trim();
    if (flag.isEmpty) return;
    setState(() { _submitting = true; _result = null; });
    try {
      final res = await context.read<ApiService>().post('/challenges/${widget.id}/submit', {'flag': flag});
      setState(() => _result = '✅ ${res['message']} +${res['pointsEarned']} pts');
      await context.read<AuthProvider>().refreshUser();
    } on ApiException catch (e) {
      setState(() => _result = e.message);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _revealHint() async {
    try {
      final res = await context.read<ApiService>().post('/challenges/${widget.id}/hint/$_hintsRevealed');
      setState(() {
        _hintsRevealed++;
        _result = 'Hint: ${res['hint']}';
      });
      await context.read<AuthProvider>().refreshUser();
    } on ApiException catch (e) {
      setState(() => _result = e.message);
    }
  }

  Future<void> _loadWriteups() async {
    setState(() => _writeupsLoading = true);
    try {
      final list = await context.read<ApiService>().getList('/writeups/challenge/${widget.id}');
      setState(() => _writeups = list);
    } catch (_) {}
    if (mounted) setState(() => _writeupsLoading = false);
  }

  Future<void> _submitWriteup() async {
    final title = _writeupTitle.text.trim();
    final content = _writeupBody.text.trim();
    if (title.isEmpty || content.isEmpty) return;
    try {
      await context.read<ApiService>().post('/writeups', {
        'challengeId': widget.id,
        'title': title,
        'content': content,
      });
      _writeupTitle.clear();
      _writeupBody.clear();
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Writeup submitted!')));
      await _loadWriteups();
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  Future<void> _upvoteWriteup(String id) async {
    await context.read<ApiService>().post('/writeups/$id/upvote');
    await _loadWriteups();
  }

  Future<void> _askAi() async {
    if (context.read<ExamProvider>().inExam) {
      setState(() => _aiMessages.add({'role': 'assistant', 'content': '🔒 AI disabled during exam'}));
      return;
    }
    final msg = _aiInput.text.trim();
    if (msg.isEmpty || _aiLoading) return;
    _aiInput.clear();
    setState(() {
      _aiMessages.add({'role': 'user', 'content': msg});
      _aiLoading = true;
    });
    try {
      final res = await context.read<ApiService>().post('/ai/hint', {
        'challengeId': widget.id,
        'userMessage': msg,
        'conversationHistory': _aiMessages.map((m) => {'role': m['role'], 'content': m['content']}).toList(),
      });
      setState(() => _aiMessages.add({'role': 'assistant', 'content': res['message']?.toString() ?? ''}));
    } on ApiException catch (e) {
      setState(() => _aiMessages.add({'role': 'assistant', 'content': e.message}));
    } finally {
      if (mounted) setState(() => _aiLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: LoadingView());
    if (_challenge == null) return const Scaffold(body: Center(child: Text('Challenge not found')));

    final user = context.watch<AuthProvider>().user;
    final solved = user?.isChallengeSolved(widget.id) ?? false;
    final hints = _challenge!['hints'] as List<dynamic>? ?? [];
    final files = _challenge!['files'] as List<dynamic>? ?? [];

    return Scaffold(
      appBar: AppBar(
        title: Text(_challenge!['title']?.toString() ?? 'Challenge'),
        actions: [
          IconButton(
            icon: Icon(_bookmarked ? Icons.bookmark : Icons.bookmark_outline),
            onPressed: _toggleBookmark,
          ),
        ],
        bottom: TabBar(
          controller: _tabs,
          tabs: const [Tab(text: 'Overview'), Tab(text: 'Hints'), Tab(text: 'AI'), Tab(text: 'Writeups')],
        ),
      ),
      body: TabBarView(
        controller: _tabs,
        children: [
          ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Row(children: [DifficultyChip(difficulty: _challenge!['difficulty']?.toString() ?? 'easy'), const SizedBox(width: 8), Chip(label: Text(_challenge!['category']?.toString() ?? ''))]),
              const SizedBox(height: 12),
              Text(_challenge!['description']?.toString() ?? '', style: const TextStyle(height: 1.5)),
              if (files.isNotEmpty) ...[
                const SizedBox(height: 16),
                const Text('Attachments', style: TextStyle(fontWeight: FontWeight.w700)),
                ...files.map((f) => ListTile(dense: true, leading: const Icon(Icons.attach_file), title: Text((f as Map)['originalName']?.toString() ?? 'file'), subtitle: const Text('Download on web for binary/pcap files'))),
              ],
              const SizedBox(height: 20),
              if (solved)
                const Card(child: Padding(padding: EdgeInsets.all(16), child: Text('✅ Solved!', style: TextStyle(color: AppColors.accent, fontWeight: FontWeight.w700))))
              else ...[
                TextField(controller: _flag, decoration: const InputDecoration(labelText: 'Flag', hintText: 'flag{...}')),
                const SizedBox(height: 10),
                ElevatedButton(onPressed: _submitting ? null : _submitFlag, child: Text(_submitting ? '...' : 'Submit flag')),
              ],
              if (_result != null) Padding(padding: const EdgeInsets.only(top: 10), child: Text(_result!, style: TextStyle(color: _result!.startsWith('✅') ? AppColors.accent : AppColors.danger))),
            ],
          ),
          ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text('${hints.length} hints available', style: const TextStyle(color: AppColors.textSecondary)),
              const SizedBox(height: 12),
              if (_hintsRevealed < hints.length)
                ElevatedButton(onPressed: _revealHint, child: Text('Reveal hint ${_hintsRevealed + 1}'))
              else
                const Text('All hints revealed'),
              if (_result != null && _result!.startsWith('Hint:'))
                Card(margin: const EdgeInsets.only(top: 12), child: Padding(padding: const EdgeInsets.all(12), child: Text(_result!.replaceFirst('Hint: ', '')))),
            ],
          ),
          Column(
            children: [
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(16),
                  children: _aiMessages.map((m) => Align(
                    alignment: m['role'] == 'user' ? Alignment.centerRight : Alignment.centerLeft,
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(color: AppColors.bgElevated, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppColors.border)),
                      child: Text(m['content'] ?? ''),
                    ),
                  )).toList(),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(12),
                child: Row(children: [
                  Expanded(child: TextField(controller: _aiInput, decoration: const InputDecoration(hintText: 'Ask CyberBot...'), onSubmitted: (_) => _askAi())),
                  IconButton(onPressed: _aiLoading ? null : _askAi, icon: const Icon(Icons.send)),
                ]),
              ),
            ],
          ),
          _writeupsLoading
              ? const Center(child: CircularProgressIndicator())
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    if (solved) ...[
                      const Text('Submit your writeup', style: TextStyle(fontWeight: FontWeight.w700)),
                      TextField(controller: _writeupTitle, decoration: const InputDecoration(labelText: 'Title')),
                      const SizedBox(height: 8),
                      TextField(controller: _writeupBody, decoration: const InputDecoration(labelText: 'Writeup'), maxLines: 4),
                      const SizedBox(height: 8),
                      ElevatedButton(onPressed: _submitWriteup, child: const Text('Submit writeup')),
                      const Divider(height: 24),
                    ] else
                      const Text('Solve the challenge to submit a writeup', style: TextStyle(color: AppColors.textSecondary)),
                    const Text('Community writeups', style: TextStyle(fontWeight: FontWeight.w700)),
                    const SizedBox(height: 8),
                    if (_writeups.isEmpty)
                      const Text('No writeups yet', style: TextStyle(color: AppColors.textSecondary))
                    else
                      ..._writeups.map((w) {
                        final wu = w as Map<String, dynamic>;
                        return Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(wu['title']?.toString() ?? '', style: const TextStyle(fontWeight: FontWeight.w700)),
                                Text('by ${wu['username'] ?? 'user'}', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                                const SizedBox(height: 6),
                                Text(wu['content']?.toString() ?? '', style: const TextStyle(fontSize: 13, height: 1.4)),
                                TextButton.icon(
                                  onPressed: () => _upvoteWriteup(wu['_id']?.toString() ?? ''),
                                  icon: const Icon(Icons.thumb_up_outlined, size: 16),
                                  label: Text('${wu['upvoteCount'] ?? 0}'),
                                ),
                              ],
                            ),
                          ),
                        );
                      }),
                  ],
                ),
        ],
      ),
    );
  }
}
