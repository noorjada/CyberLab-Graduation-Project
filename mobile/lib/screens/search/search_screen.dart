import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/desktop_only_banner.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _query = TextEditingController();
  Map<String, dynamic>? _results;
  bool _loading = false;

  @override
  void dispose() {
    _query.dispose();
    super.dispose();
  }

  Future<void> _search() async {
    final q = _query.text.trim();
    if (q.length < 2) return;
    setState(() => _loading = true);
    try {
      final res = await context.read<ApiService>().get('/search', query: {'q': q});
      setState(() => _results = res);
    } catch (_) {
      setState(() => _results = null);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Search')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _query,
              autofocus: true,
              decoration: InputDecoration(
                hintText: 'Challenges, labs, articles, plans...',
                suffixIcon: IconButton(icon: const Icon(Icons.search), onPressed: _search),
              ),
              onSubmitted: (_) => _search(),
            ),
          ),
          if (_loading) const LinearProgressIndicator(color: AppColors.accent),
          Expanded(
            child: _results == null
                ? const Center(child: Text('Type 2+ characters to search', style: TextStyle(color: AppColors.textSecondary)))
                : ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      ..._section('Challenges', _results!['challenges'], (c) => context.push('/challenges/${c['_id']}')),
                      ..._section('Study Plans', _results!['studyPlans'], (p) => context.push('/learn/plans/${p['slug']}')),
                      ..._section('Reference', _results!['articles'], (a) => context.push('/learn/reference/${a['slug']}')),
                      ..._section('Learning Paths', _results!['paths'], (p) => context.push('/learn/roadmap/${p['_id']}')),
                      if ((_results!['labs'] as List?)?.isNotEmpty == true) ...[
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 8),
                          child: Text('Labs (desktop)', style: TextStyle(fontWeight: FontWeight.w700)),
                        ),
                        const DesktopOnlyBanner(feature: 'Hacking Labs', webPath: '/labs'),
                      ],
                    ],
                  ),
          ),
        ],
      ),
    );
  }

  List<Widget> _section(String title, dynamic items, void Function(Map<String, dynamic>) onTap) {
    final list = (items as List<dynamic>?) ?? [];
    if (list.isEmpty) return [];
    return [
      Padding(
        padding: const EdgeInsets.only(top: 8, bottom: 6),
        child: Text(title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
      ),
      ...list.map((item) {
        final m = item as Map<String, dynamic>;
        return Card(
          margin: const EdgeInsets.only(bottom: 6),
          child: ListTile(
            title: Text(m['title']?.toString() ?? '', style: const TextStyle(fontSize: 14)),
            subtitle: Text(m['category']?.toString() ?? m['career']?.toString() ?? '', style: const TextStyle(fontSize: 11)),
            trailing: const Icon(Icons.chevron_right, size: 18),
            onTap: () => onTap(m),
          ),
        );
      }),
    ];
  }
}
