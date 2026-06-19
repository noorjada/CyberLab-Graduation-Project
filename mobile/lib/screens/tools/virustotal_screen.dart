import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../utils/format_utils.dart';

class VirusTotalScreen extends StatefulWidget {
  const VirusTotalScreen({super.key});

  @override
  State<VirusTotalScreen> createState() => _VirusTotalScreenState();
}

class _VirusTotalScreenState extends State<VirusTotalScreen> {
  final _input = TextEditingController();
  String _mode = 'url';
  bool _loading = false;
  String _result = '';

  Future<void> _scan() async {
    final q = _input.text.trim();
    if (q.isEmpty) return;
    setState(() {
      _loading = true;
      _result = '';
    });
    try {
      final api = context.read<ApiService>();
      Map<String, dynamic> res;
      if (_mode == 'url') {
        res = await api.post('/vt/url', {'url': q});
      } else if (_mode == 'ip') {
        res = await api.get('/vt/ip/$q');
      } else {
        res = await api.get('/vt/domain/$q');
      }
      setState(() => _result = prettyJson(res));
    } on ApiException catch (e) {
      setState(() => _result = e.message);
    } catch (_) {
      setState(() => _result = 'Scan failed');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Malware Lab')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'url', label: Text('URL')),
                ButtonSegment(value: 'ip', label: Text('IP')),
                ButtonSegment(value: 'domain', label: Text('Domain')),
              ],
              selected: {_mode},
              onSelectionChanged: (s) => setState(() => _mode = s.first),
            ),
            const SizedBox(height: 12),
            TextField(controller: _input, decoration: const InputDecoration(hintText: 'Enter target')),
            const SizedBox(height: 12),
            ElevatedButton(onPressed: _loading ? null : _scan, child: const Text('Scan')),
            const SizedBox(height: 16),
            Expanded(
              child: SingleChildScrollView(
                child: Text(
                  _result.isEmpty ? 'Scan results appear here' : _result,
                  style: const TextStyle(fontFamily: 'monospace', fontSize: 11, height: 1.4),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
