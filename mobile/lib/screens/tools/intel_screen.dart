import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/loading_view.dart';

class IntelScreen extends StatefulWidget {
  const IntelScreen({super.key});

  @override
  State<IntelScreen> createState() => _IntelScreenState();
}

class _IntelScreenState extends State<IntelScreen> with SingleTickerProviderStateMixin {
  late final TabController _tabs;
  bool _loading = true;
  List<dynamic> _cves = [];
  List<dynamic> _kev = [];
  List<dynamic> _news = [];

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final api = context.read<ApiService>();
    try {
      final results = await Future.wait([
        api.get('/exploits/cves', query: {'limit': '20'}),
        api.get('/exploits/kev', query: {'limit': '20'}),
        api.get('/exploits/news', query: {'limit': '20'}),
      ]);
      setState(() {
        _cves = results[0]['items'] as List<dynamic>? ?? [];
        _kev = results[1]['items'] as List<dynamic>? ?? [];
        _news = results[2]['items'] as List<dynamic>? ?? [];
      });
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Cyber Intelligence'),
        bottom: TabBar(
          controller: _tabs,
          tabs: const [Tab(text: 'CVEs'), Tab(text: 'KEV'), Tab(text: 'News')],
        ),
      ),
      body: _loading
          ? const LoadingView()
          : TabBarView(
              controller: _tabs,
              children: [
                _FeedList(items: _cves, titleKey: 'id', subtitleKey: 'summary'),
                _FeedList(items: _kev, titleKey: 'cveID', subtitleKey: 'vulnerabilityName'),
                _FeedList(items: _news, titleKey: 'title', subtitleKey: 'source'),
              ],
            ),
    );
  }
}

class _FeedList extends StatelessWidget {
  final List<dynamic> items;
  final String titleKey;
  final String subtitleKey;

  const _FeedList({required this.items, required this.titleKey, required this.subtitleKey});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: items.length,
      itemBuilder: (context, i) {
        final item = items[i] as Map<String, dynamic>;
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            title: Text(item[titleKey]?.toString() ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
            subtitle: Text(
              item[subtitleKey]?.toString() ?? '',
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 12),
            ),
          ),
        );
      },
    );
  }
}
