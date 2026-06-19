import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/loading_view.dart';

/// Security news feed — same API as web `/exploits` News tab (`GET /exploits/news`).
class NewsScreen extends StatefulWidget {
  const NewsScreen({super.key});

  @override
  State<NewsScreen> createState() => _NewsScreenState();
}

class _NewsScreenState extends State<NewsScreen> {
  bool _loading = true;
  List<dynamic> _items = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final res = await context.read<ApiService>().get('/exploits/news', query: {'limit': '40'});
      setState(() => _items = res['items'] as List<dynamic>? ?? []);
    } catch (_) {
      setState(() => _items = []);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _openLink(String? url) async {
    if (url == null || url.isEmpty) return;
    final uri = Uri.tryParse(url);
    if (uri != null && await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Security News')),
      body: _loading
          ? const LoadingView()
          : _items.isEmpty
              ? const EmptyState(icon: '📰', title: 'No news available', subtitle: 'Pull to refresh')
              : RefreshIndicator(
                  onRefresh: _load,
                  color: AppColors.accent,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _items.length,
                    itemBuilder: (_, i) {
                      final n = _items[i] as Map<String, dynamic>;
                      final link = n['link']?.toString();
                      return Card(
                        margin: const EdgeInsets.only(bottom: 10),
                        child: InkWell(
                          onTap: () => _openLink(link),
                          borderRadius: BorderRadius.circular(12),
                          child: Padding(
                            padding: const EdgeInsets.all(14),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  n['title']?.toString() ?? '',
                                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                                ),
                                if (n['description'] != null && n['description'].toString().isNotEmpty) ...[
                                  const SizedBox(height: 6),
                                  Text(
                                    n['description'].toString(),
                                    maxLines: 3,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.35),
                                  ),
                                ],
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    if (n['source'] != null)
                                      Chip(
                                        label: Text(n['source'].toString(), style: const TextStyle(fontSize: 10)),
                                        visualDensity: VisualDensity.compact,
                                      ),
                                    const Spacer(),
                                    if (link != null && link.isNotEmpty)
                                      const Text('Read more', style: TextStyle(color: AppColors.accentBlue, fontSize: 12)),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
