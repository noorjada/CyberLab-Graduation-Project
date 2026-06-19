import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class DifficultyChip extends StatelessWidget {
  final String difficulty;

  const DifficultyChip({super.key, required this.difficulty});

  Color get _color {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return AppColors.accent;
      case 'medium':
        return AppColors.warning;
      case 'hard':
        return AppColors.danger;
      default:
        return AppColors.textSecondary;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: _color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: _color.withValues(alpha: 0.4)),
      ),
      child: Text(
        difficulty,
        style: TextStyle(color: _color, fontSize: 11, fontWeight: FontWeight.w700),
      ),
    );
  }
}
