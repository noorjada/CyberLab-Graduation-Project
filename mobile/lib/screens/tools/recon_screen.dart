import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../utils/format_utils.dart';

class ReconScreen extends StatefulWidget {
  const ReconScreen({super.key});

  @override
  State<ReconScreen> createState() => _ReconScreenState();
}

class _ReconScreenState extends State<ReconScreen> {
  final _input = TextEditingController();
  String _mode = 'ip';
  bool _loading = false;
  String _result = '';

  Future<void> _lookup() async {
    final q = _input.text.trim();
    if (q.isEmpty) return;
    setState(() {
      _loading = true;
      _result = '';
    });
    try {
      final api = context.read<ApiService>();
      Map<String, dynamic> res;
      if (_mode == 'ip') {
        res = await api.get('/recon/ip/$q');
      } else if (_mode == 'dns') {
        res = await api.get('/recon/dns/$q');
      } else {
        res = await api.get('/recon/whois/$q');
      }
      setState(() => _result = prettyJson(res));
    } on ApiException catch (e) {
      setState(() => _result = e.message);
    } catch (_) {
      setState(() => _result = 'Lookup failed');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Recon Lab')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'ip', label: Text('IP')),
                ButtonSegment(value: 'dns', label: Text('DNS')),
                ButtonSegment(value: 'whois', label: Text('WHOIS')),
              ],
              selected: {_mode},
              onSelectionChanged: (s) => setState(() => _mode = s.first),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _input,
              decoration: InputDecoration(
                hintText: _mode == 'ip' ? '8.8.8.8' : 'example.com',
              ),
            ),
            const SizedBox(height: 12),
            ElevatedButton(onPressed: _loading ? null : _lookup, child: const Text('Lookup')),
            const SizedBox(height: 16),
            Expanded(
              child: SingleChildScrollView(
                child: Text(
                  _result.isEmpty ? 'Results appear here' : _result,
                  style: const TextStyle(fontFamily: 'monospace', fontSize: 12, height: 1.4),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
