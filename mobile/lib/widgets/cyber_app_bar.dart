import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../providers/exam_provider.dart';
import '../services/api_service.dart';
import '../theme/app_colors.dart';

class CyberAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final List<Widget>? extraActions;
  final bool showSearch;
  final bool showNotifications;

  const CyberAppBar({
    super.key,
    required this.title,
    this.extraActions,
    this.showSearch = true,
    this.showNotifications = true,
  });

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    final inExam = context.watch<ExamProvider>().inExam;

    return AppBar(
      title: Text(inExam ? '🔒 Exam Mode' : title),
      actions: [
        if (!inExam && showSearch)
          IconButton(icon: const Icon(Icons.search), onPressed: () => context.push('/search')),
        if (!inExam && showNotifications) const _NotificationButton(),
        ...?extraActions,
      ],
    );
  }
}

class _NotificationButton extends StatefulWidget {
  const _NotificationButton();

  @override
  State<_NotificationButton> createState() => _NotificationButtonState();
}

class _NotificationButtonState extends State<_NotificationButton> {
  int _unread = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final res = await context.read<ApiService>().get('/notifications');
      if (mounted) setState(() => _unread = (res['unreadCount'] as num?)?.toInt() ?? 0);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.center,
      children: [
        IconButton(
          icon: const Icon(Icons.notifications_outlined),
          onPressed: () async {
            await context.push('/notifications');
            _load();
          },
        ),
        if (_unread > 0)
          Positioned(
            top: 10,
            right: 10,
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: const BoxDecoration(color: AppColors.danger, shape: BoxShape.circle),
              child: Text('$_unread', style: const TextStyle(fontSize: 9, color: Colors.white)),
            ),
          ),
      ],
    );
  }
}
