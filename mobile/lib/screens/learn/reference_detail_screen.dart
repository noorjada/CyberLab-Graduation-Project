import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/loading_view.dart';

class ReferenceDetailScreen extends StatefulWidget {
  final String slug;

  const ReferenceDetailScreen({super.key, required this.slug});

  @override
  State<ReferenceDetailScreen> createState() => _ReferenceDetailScreenState();
}

class _ReferenceDetailScreenState extends State<ReferenceDetailScreen> {
  bool _loading = true;
  Map<String, dynamic>? _article;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await context.read<ApiService>().get('/reference/${widget.slug}');
      setState(() => _article = data['article'] as Map<String, dynamic>? ?? data);
    } catch (_) {
      setState(() => _article = null);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Article')),
        body: const LoadingView(),
      );
    }

    if (_article == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Article')),
        body: const Center(child: Text('Article not found')),
      );
    }

    final content = _article!['content']?.toString() ?? '';

    return Scaffold(
      appBar: AppBar(title: Text(_article!['title']?.toString() ?? 'Article')),
      body: Markdown(
        data: content,
        padding: const EdgeInsets.all(16),
        styleSheet: MarkdownStyleSheet(
          p: const TextStyle(color: AppColors.textPrimary, height: 1.5),
          h1: const TextStyle(color: AppColors.textPrimary, fontSize: 24, fontWeight: FontWeight.w800),
          h2: const TextStyle(color: AppColors.textPrimary, fontSize: 20, fontWeight: FontWeight.w700),
          h3: const TextStyle(color: AppColors.textPrimary, fontSize: 17, fontWeight: FontWeight.w700),
          code: const TextStyle(color: AppColors.accent, backgroundColor: AppColors.bgElevated),
          codeblockDecoration: BoxDecoration(
            color: AppColors.bgElevated,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: AppColors.border),
          ),
        ),
      ),
    );
  }
}
