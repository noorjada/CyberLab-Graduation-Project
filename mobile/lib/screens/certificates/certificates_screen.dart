import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/loading_view.dart';

class CertificatesScreen extends StatefulWidget {
  const CertificatesScreen({super.key});

  @override
  State<CertificatesScreen> createState() => _CertificatesScreenState();
}

class _CertificatesScreenState extends State<CertificatesScreen> {
  bool _loading = true;
  List<dynamic> _pathCerts = [];
  List<dynamic> _courseCerts = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final results = await Future.wait([
        context.read<ApiService>().getList('/certificates/my'),
        context.read<ApiService>().getList('/courses/certificates/my'),
      ]);
      setState(() {
        _pathCerts = results[0];
        _courseCerts = results[1];
      });
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final all = [..._pathCerts, ..._courseCerts];
    return Scaffold(
      appBar: AppBar(title: const Text('Certificates')),
      body: _loading
          ? const LoadingView()
          : all.isEmpty
              ? const EmptyState(icon: '📜', title: 'No certificates yet', subtitle: 'Complete learning paths or courses')
              : RefreshIndicator(
                  onRefresh: _load,
                  color: AppColors.accent,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: all.length,
                    itemBuilder: (_, i) {
                      final c = all[i] as Map<String, dynamic>;
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          leading: Text(c['pathIcon']?.toString() ?? c['icon']?.toString() ?? '📜', style: const TextStyle(fontSize: 24)),
                          title: Text(c['pathTitle']?.toString() ?? c['courseTitle']?.toString() ?? 'Certificate', style: const TextStyle(fontWeight: FontWeight.w600)),
                          subtitle: Text(c['certId']?.toString() ?? '', style: const TextStyle(fontSize: 11)),
                          trailing: const Icon(Icons.verified, color: AppColors.accent),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
