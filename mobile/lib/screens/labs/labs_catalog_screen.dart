import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/desktop_only_banner.dart';
import '../../widgets/difficulty_chip.dart';
import '../../widgets/loading_view.dart';

class LabsCatalogScreen extends StatefulWidget {
  const LabsCatalogScreen({super.key});

  @override
  State<LabsCatalogScreen> createState() => _LabsCatalogScreenState();
}

class _LabsCatalogScreenState extends State<LabsCatalogScreen> {
  bool _loading = true;
  List<dynamic> _labs = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final list = await context.read<ApiService>().getList('/labs');
      setState(() => _labs = list);
    } catch (_) {
      setState(() => _labs = []);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Hacking Labs')),
      body: _loading
          ? const LoadingView()
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                const DesktopOnlyBanner(feature: 'Hacking Labs', webPath: '/labs'),
                const SizedBox(height: 16),
                const Text('Lab catalog (browse only on mobile)', style: TextStyle(fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                ..._labs.map((l) {
                  final lab = l as Map<String, dynamic>;
                  final completed = lab['completed'] == true;
                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      leading: Text(completed ? '✅' : '🖥️', style: const TextStyle(fontSize: 22)),
                      title: Text(lab['title']?.toString() ?? '', style: const TextStyle(fontWeight: FontWeight.w600)),
                      subtitle: Row(
                        children: [
                          DifficultyChip(difficulty: lab['difficulty']?.toString() ?? 'easy'),
                          const SizedBox(width: 8),
                          Text(lab['category']?.toString() ?? '', style: const TextStyle(fontSize: 11)),
                        ],
                      ),
                    ),
                  );
                }),
              ],
            ),
    );
  }
}
