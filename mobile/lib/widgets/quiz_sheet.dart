import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

Future<List<int>?> showQuizSheet(BuildContext context, List<dynamic> questions, String title) {
  final answers = List<int>.filled(questions.length, -1);
  return showModalBottomSheet<List<int>>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.bgSecondary,
    builder: (ctx) {
      return StatefulBuilder(
        builder: (ctx, setState) {
          return Padding(
            padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
            child: SizedBox(
              height: MediaQuery.of(ctx).size.height * 0.7,
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                  ),
                  Expanded(
                    child: ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: questions.length,
                      itemBuilder: (_, qi) {
                        final q = questions[qi] as Map<String, dynamic>;
                        final opts = q['options'] as List<dynamic>? ?? [];
                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Q${qi + 1}. ${q['question']}', style: const TextStyle(fontWeight: FontWeight.w600)),
                            ...opts.asMap().entries.map((e) => RadioListTile<int>(
                                  value: e.key,
                                  groupValue: answers[qi],
                                  onChanged: (v) => setState(() => answers[qi] = v ?? -1),
                                  title: Text(e.value.toString(), style: const TextStyle(fontSize: 14)),
                                )),
                            const Divider(),
                          ],
                        );
                      },
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: ElevatedButton(
                      onPressed: answers.any((a) => a < 0)
                          ? null
                          : () => Navigator.pop(ctx, answers),
                      child: const Text('Submit quiz'),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      );
    },
  );
}
