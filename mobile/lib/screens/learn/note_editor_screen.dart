import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';

class NoteEditorScreen extends StatefulWidget {
  final String? noteId;

  const NoteEditorScreen({super.key, this.noteId});

  @override
  State<NoteEditorScreen> createState() => _NoteEditorScreenState();
}

class _NoteEditorScreenState extends State<NoteEditorScreen> {
  final _title = TextEditingController();
  final _content = TextEditingController();
  String _type = 'note';
  bool _loading = false;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    if (widget.noteId != null) _load();
  }

  @override
  void dispose() {
    _title.dispose();
    _content.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final n = await context.read<ApiService>().get('/notes/${widget.noteId}');
      _title.text = n['title']?.toString() ?? '';
      _content.text = n['content']?.toString() ?? '';
      _type = n['type']?.toString() ?? 'note';
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _save() async {
    if (_title.text.trim().isEmpty || _content.text.trim().isEmpty) return;
    setState(() => _saving = true);
    try {
      final body = {'title': _title.text.trim(), 'content': _content.text.trim(), 'type': _type};
      if (widget.noteId == null) {
        await context.read<ApiService>().post('/notes', body);
      } else {
        await context.read<ApiService>().put('/notes/${widget.noteId}', body);
      }
      if (mounted) context.pop();
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _delete() async {
    if (widget.noteId == null) return;
    await context.read<ApiService>().delete('/notes/${widget.noteId}');
    if (mounted) context.pop();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.noteId == null ? 'New note' : 'Edit note'),
        actions: [
          if (widget.noteId != null) IconButton(icon: const Icon(Icons.delete_outline), onPressed: _delete),
          TextButton(onPressed: _saving ? null : _save, child: Text(_saving ? '...' : 'Save')),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          DropdownButtonFormField<String>(
            value: _type,
            decoration: const InputDecoration(labelText: 'Type'),
            items: const [
              DropdownMenuItem(value: 'note', child: Text('Note')),
              DropdownMenuItem(value: 'command', child: Text('Command')),
              DropdownMenuItem(value: 'writeup', child: Text('Writeup')),
              DropdownMenuItem(value: 'summary', child: Text('Summary')),
            ],
            onChanged: (v) => setState(() => _type = v ?? 'note'),
          ),
          const SizedBox(height: 12),
          TextField(controller: _title, decoration: const InputDecoration(labelText: 'Title')),
          const SizedBox(height: 12),
          TextField(
            controller: _content,
            decoration: const InputDecoration(labelText: 'Content', alignLabelWithHint: true),
            maxLines: 12,
          ),
        ],
      ),
    );
  }
}
