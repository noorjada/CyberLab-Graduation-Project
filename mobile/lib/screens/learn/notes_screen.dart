import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/loading_view.dart';

class NotesScreen extends StatefulWidget {
  const NotesScreen({super.key});

  @override
  State<NotesScreen> createState() => _NotesScreenState();
}

class _NotesScreenState extends State<NotesScreen> {
  bool _loading = true;
  List<dynamic> _notes = [];
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
      final list = await context.read<ApiService>().getList('/notes', query: q != null ? {'q': q} : null);
      setState(() => _notes = list);
    } catch (_) {
      setState(() => _notes = []);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Learning Notes'),
        actions: [
          IconButton(icon: const Icon(Icons.add), onPressed: () => context.push('/learn/notes/new')),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _search,
              decoration: InputDecoration(
                hintText: 'Search notes...',
                suffixIcon: IconButton(icon: const Icon(Icons.search), onPressed: () => _load(q: _search.text)),
              ),
              onSubmitted: (v) => _load(q: v),
            ),
          ),
          Expanded(
            child: _loading
                ? const LoadingView()
                : _notes.isEmpty
                    ? const EmptyState(icon: '📓', title: 'No notes yet', subtitle: 'Tap + to create your first note')
                    : RefreshIndicator(
                        onRefresh: () => _load(),
                        color: AppColors.accent,
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: _notes.length,
                          itemBuilder: (_, i) {
                            final n = _notes[i] as Map<String, dynamic>;
                            return Card(
                              margin: const EdgeInsets.only(bottom: 8),
                              child: ListTile(
                                title: Text(n['title']?.toString() ?? '', style: const TextStyle(fontWeight: FontWeight.w600)),
                                subtitle: Text(
                                  n['content']?.toString() ?? '',
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(fontSize: 12),
                                ),
                                trailing: Chip(label: Text(n['type']?.toString() ?? 'note', style: const TextStyle(fontSize: 10))),
                                onTap: () => context.push('/learn/notes/${n['_id']}'),
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}
