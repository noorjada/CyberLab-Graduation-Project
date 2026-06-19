import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/difficulty_chip.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/loading_view.dart';

class ReferenceScreen extends StatefulWidget {
  const ReferenceScreen({super.key});

  @override
  State<ReferenceScreen> createState() => _ReferenceScreenState();
}

class _ReferenceScreenState extends State<ReferenceScreen> {
  bool _loading = true;
  List<dynamic> _articles = [];
  final _search = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _load({String? q}) async {
    setState(() => _loading = true);
    try {
      final data = await context.read<ApiService>().get('/reference', query: q != null ? {'q': q} : null);
      setState(() => _articles = data['articles'] as List<dynamic>? ?? []);
    } catch (_) {
      setState(() => _articles = []);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Cyber Reference')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _search,
              decoration: InputDecoration(
                hintText: 'Search articles...',
                suffixIcon: IconButton(
                  icon: const Icon(Icons.search),
                  onPressed: () => _load(q: _search.text.trim()),
                ),
              ),
              onSubmitted: (v) => _load(q: v.trim()),
            ),
          ),
          Expanded(
            child: _loading
                ? const LoadingView()
                : _articles.isEmpty
                    ? const EmptyState(icon: '📚', title: 'No articles found')
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: _articles.length,
                        itemBuilder: (context, i) {
                          final a = _articles[i] as Map<String, dynamic>;
                          return Card(
                            margin: const EdgeInsets.only(bottom: 10),
                            child: ListTile(
                              title: Text(a['title']?.toString() ?? '', style: const TextStyle(fontWeight: FontWeight.w600)),
                              subtitle: Text(
                                a['summary']?.toString() ?? '',
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              trailing: DifficultyChip(difficulty: a['difficulty']?.toString() ?? 'beginner'),
                              onTap: () => context.push('/learn/reference/${a['slug']}'),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}
