import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../providers/exam_provider.dart';
import '../../widgets/cyberbot_sheet.dart';

class MainShell extends StatelessWidget {
  final Widget child;

  const MainShell({super.key, required this.child});

  static const _tabs = [
    ('/home', Icons.home_outlined, Icons.home, 'Home'),
    ('/learn', Icons.school_outlined, Icons.school, 'Learn'),
    ('/challenges', Icons.flag_outlined, Icons.flag, 'CTF'),
    ('/exams', Icons.quiz_outlined, Icons.quiz, 'Exams'),
    ('/more', Icons.apps_outlined, Icons.apps, 'More'),
  ];

  int _indexForLocation(String location) {
    if (location.startsWith('/home')) return 0;
    if (location.startsWith('/learn') || location.startsWith('/reference') || location.startsWith('/news')) return 1;
    if (location.startsWith('/challenges')) return 2;
    if (location.startsWith('/exams')) return 3;
    return 4;
  }

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).uri.toString();
    final index = _indexForLocation(location);
    final inExam = context.watch<ExamProvider>().inExam;

    return Scaffold(
      body: child,
      floatingActionButton: inExam ? null : const CyberBotFab(),
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (i) {
          if (inExam && _tabs[i].$1 != '/exams') {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('🔒 Finish your exam before navigating away')),
            );
            return;
          }
          context.go(_tabs[i].$1);
        },
        destinations: _tabs
            .map((t) => NavigationDestination(icon: Icon(t.$2), selectedIcon: Icon(t.$3), label: t.$4))
            .toList(),
      ),
    );
  }
}
