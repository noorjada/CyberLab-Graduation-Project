import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/exam_provider.dart';
import '../../services/api_service.dart';
import '../../services/storage_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/loading_view.dart';

class ExamSessionScreen extends StatefulWidget {
  final String examId;

  const ExamSessionScreen({super.key, required this.examId});

  @override
  State<ExamSessionScreen> createState() => _ExamSessionScreenState();
}

class _ExamSessionScreenState extends State<ExamSessionScreen> with WidgetsBindingObserver {
  bool _loading = true;
  bool _starting = false;
  bool _inSession = false;
  Map<String, dynamic>? _exam;
  List<int> _answers = [];
  int _currentQ = 0;
  int _timeLeft = 0;
  Timer? _timer;
  Map<String, dynamic>? _results;

  static const _letters = ['A', 'B', 'C', 'D', 'E', 'F'];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _init();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _timer?.cancel();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (_inSession && state == AppLifecycleState.paused) {
      context.read<ApiService>().post('/exams/session/focus-warning').catchError((_) {});
    }
  }

  Future<void> _init() async {
    try {
      final active = await context.read<ApiService>().get('/exams/session/active');
      if (active['active'] == true) {
        final session = active['session'] as Map<String, dynamic>?;
        if (session?['examId']?.toString() == widget.examId) {
          context.read<ExamProvider>().enter(Map<String, dynamic>.from(session!));
          await _loadExam(resume: true, session: session);
          return;
        }
      }
      await _loadExam();
    } catch (_) {
      setState(() => _exam = null);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _loadExam({bool resume = false, Map<String, dynamic>? session}) async {
    final exam = await context.read<ApiService>().get('/exams/${widget.examId}');
    final qCount = (exam['questions'] as List?)?.length ?? 0;
    final storage = context.read<StorageService>();
    final draft = await storage.getExamDraft(widget.examId);

    setState(() {
      _exam = exam;
      if (resume && draft != null) {
        _answers = List<int>.from(draft['answers'] as List? ?? List.filled(qCount, -1));
        _currentQ = (draft['currentQ'] as num?)?.toInt() ?? 0;
        _inSession = true;
        final started = DateTime.tryParse(session?['startedAt']?.toString() ?? '') ?? DateTime.now();
        final totalSec = ((exam['durationMinutes'] as num?)?.toInt() ?? 60) * 60;
        final elapsed = DateTime.now().difference(started).inSeconds;
        _timeLeft = (totalSec - elapsed).clamp(0, totalSec);
        _startTimer();
      } else {
        _answers = List.filled(qCount, -1);
        _currentQ = 0;
      }
    });
  }

  Future<void> _startExam() async {
    setState(() => _starting = true);
    try {
      final startRes = await context.read<ApiService>().post('/exams/${widget.examId}/start');
      final session = startRes['session'] as Map<String, dynamic>? ?? {};
      context.read<ExamProvider>().enter({
        'examId': widget.examId,
        'title': _exam?['title'],
        ...session,
      });
      final duration = ((_exam?['durationMinutes'] as num?)?.toInt() ?? 60) * 60;
      setState(() {
        _inSession = true;
        _timeLeft = duration;
      });
      _startTimer();
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _starting = false);
    }
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (_timeLeft <= 1) {
        t.cancel();
        _submit(auto: true);
      } else {
        setState(() => _timeLeft--);
      }
    });
  }

  Future<void> _saveDraft() async {
    await context.read<StorageService>().saveExamDraft(widget.examId, _answers, _currentQ);
  }

  Future<void> _abandon() async {
    _timer?.cancel();
    await context.read<ApiService>().post('/exams/${widget.examId}/abandon');
    await context.read<StorageService>().clearExamDraft(widget.examId);
    context.read<ExamProvider>().exit();
    if (mounted) context.pop();
  }

  Future<void> _submit({bool auto = false}) async {
    _timer?.cancel();
    try {
      final elapsed = (((_exam?['durationMinutes'] as num?)?.toInt() ?? 60) * 60) - _timeLeft;
      final res = await context.read<ApiService>().post('/exams/${widget.examId}/submit', {
        'answers': _answers,
        'timeSpentSeconds': elapsed,
      });
      await context.read<StorageService>().clearExamDraft(widget.examId);
      context.read<ExamProvider>().exit();
      await context.read<AuthProvider>().refreshUser();
      setState(() {
        _results = res;
        _inSession = false;
      });
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  String _formatTime(int sec) {
    final m = sec ~/ 60;
    final s = sec % 60;
    return '$m:${s.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(appBar: AppBar(title: const Text('Exam')), body: const LoadingView());
    }

    if (_exam == null) {
      return Scaffold(appBar: AppBar(title: const Text('Exam')), body: const Center(child: Text('Exam not found')));
    }

    if (_results != null) {
      final passed = _results!['passed'] == true;
      return Scaffold(
        appBar: AppBar(title: const Text('Results')),
        body: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              Text(passed ? '🎓 Passed!' : '📝 Keep practicing', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800)),
              const SizedBox(height: 12),
              Text('${_results!['score']}% — ${_results!['correctCount']}/${_results!['totalQuestions']} correct',
                  style: const TextStyle(fontSize: 18)),
              const Spacer(),
              ElevatedButton(onPressed: () => context.go('/exams'), child: const Text('Back to exams')),
            ],
          ),
        ),
      );
    }

    if (!_inSession) {
      return Scaffold(
        appBar: AppBar(title: Text(_exam!['title']?.toString() ?? 'Exam')),
        body: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('🔒 Safe Exam Mode', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.accent)),
              const SizedBox(height: 12),
              Text(_exam!['description']?.toString() ?? '', style: const TextStyle(color: AppColors.textSecondary, height: 1.4)),
              const SizedBox(height: 16),
              const Text('• AI assistance disabled server-side\n• Leaving the app logs a focus warning\n• Timer auto-submits when time runs out',
                  style: TextStyle(color: AppColors.textSecondary, height: 1.6)),
              const Spacer(),
              ElevatedButton(
                onPressed: _starting ? null : _startExam,
                child: _starting ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Start exam'),
              ),
            ],
          ),
        ),
      );
    }

    final questions = _exam!['questions'] as List<dynamic>;
    final q = questions[_currentQ] as Map<String, dynamic>;
    final options = q['options'] as List<dynamic>? ?? [];

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        final leave = await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Exit exam?'),
            content: const Text('Your session will end without submitting.'),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Stay')),
              TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Exit')),
            ],
          ),
        );
        if (leave == true) await _abandon();
      },
      child: Scaffold(
        appBar: AppBar(
          title: Text(_exam!['title']?.toString() ?? 'Exam'),
          actions: [
            Padding(
              padding: const EdgeInsets.only(right: 16),
              child: Center(
                child: Text(
                  '⏱ ${_formatTime(_timeLeft)}',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: _timeLeft < 300 ? AppColors.danger : AppColors.textPrimary,
                  ),
                ),
              ),
            ),
          ],
        ),
        body: Column(
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: AppColors.bgElevated,
              child: const Text('🔒 AI disabled · Stay in the app', style: TextStyle(fontSize: 12, color: AppColors.accent)),
            ),
            LinearProgressIndicator(
              value: (_currentQ + 1) / questions.length,
              backgroundColor: AppColors.bgElevated,
              color: AppColors.accent,
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Text('Question ${_currentQ + 1} of ${questions.length}', style: const TextStyle(color: AppColors.textSecondary)),
                  const SizedBox(height: 12),
                  Text(q['question']?.toString() ?? '', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600, height: 1.4)),
                  const SizedBox(height: 20),
                  ...options.asMap().entries.map((e) {
                    final selected = _answers[_currentQ] == e.key;
                    return Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      color: selected ? AppColors.accent.withValues(alpha: 0.12) : null,
                      child: ListTile(
                        leading: CircleAvatar(
                          radius: 14,
                          backgroundColor: selected ? AppColors.accent : AppColors.bgElevated,
                          child: Text(_letters[e.key], style: TextStyle(fontSize: 12, color: selected ? AppColors.bgPrimary : AppColors.textSecondary)),
                        ),
                        title: Text(e.value.toString()),
                        onTap: () async {
                          setState(() => _answers[_currentQ] = e.key);
                          await _saveDraft();
                        },
                      ),
                    );
                  }),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  if (_currentQ > 0)
                    OutlinedButton(
                      onPressed: () => setState(() => _currentQ--),
                      child: const Text('Previous'),
                    ),
                  const Spacer(),
                  if (_currentQ < questions.length - 1)
                    ElevatedButton(
                      onPressed: () => setState(() => _currentQ++),
                      child: const Text('Next'),
                    )
                  else
                    ElevatedButton(
                      onPressed: () => _submit(),
                      child: const Text('Submit'),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
