import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../providers/exam_provider.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/certificates/certificates_screen.dart';
import '../screens/challenges/challenge_detail_screen.dart';
import '../screens/challenges/challenges_screen.dart';
import '../screens/classrooms/classrooms_screen.dart';
import '../screens/courses/course_detail_screen.dart';
import '../screens/courses/courses_screen.dart';
import '../screens/activity/activity_screen.dart';
import '../screens/classrooms/assignments_screen.dart';
import '../screens/daily/daily_screen.dart';
import '../screens/events/event_detail_screen.dart';
import '../screens/events/events_screen.dart';
import '../screens/exams/exam_history_screen.dart';
import '../screens/exams/exam_session_screen.dart';
import '../screens/exams/exams_screen.dart';
import '../screens/news/news_screen.dart';
import '../screens/home/dashboard_screen.dart';
import '../screens/labs/labs_catalog_screen.dart';
import '../screens/leaderboard/leaderboard_screen.dart';
import '../screens/learn/learn_hub_screen.dart';
import '../screens/learn/note_editor_screen.dart';
import '../screens/learn/notes_screen.dart';
import '../screens/learn/reference_detail_screen.dart';
import '../screens/learn/reference_screen.dart';
import '../screens/learn/roadmap_detail_screen.dart';
import '../screens/learn/roadmap_screen.dart';
import '../screens/learn/study_plan_detail_screen.dart';
import '../screens/learn/study_plans_screen.dart';
import '../screens/more/more_screen.dart';
import '../screens/notifications/notifications_screen.dart';
import '../screens/profile/profile_screen.dart';
import '../screens/search/search_screen.dart';
import '../screens/shell/main_shell.dart';
import '../screens/tools/intel_screen.dart';
import '../screens/tools/recon_screen.dart';
import '../screens/tools/soc_assistant_screen.dart';
import '../screens/tools/tools_hub_screen.dart';
import '../screens/tools/virustotal_screen.dart';
import '../widgets/loading_view.dart';

GoRouter createRouter(AuthProvider auth, ExamProvider exam) {
  return GoRouter(
    initialLocation: '/home',
    refreshListenable: Listenable.merge([auth, exam]),
    redirect: (context, state) {
      final loc = state.matchedLocation;
      final isAuth = auth.isAuthenticated;
      final isAuthRoute = loc == '/login' || loc == '/register';
      final waitingOnExam = exam.loading && auth.isAuthenticated;

      if (auth.isLoading || waitingOnExam) return null;
      if (!isAuth && !isAuthRoute) return '/login';
      if (isAuth && isAuthRoute) return '/home';

      if (exam.inExam && !loc.startsWith('/exams/') && loc != '/exams') {
        final id = exam.examId;
        if (id != null) return '/exams/$id';
        return '/exams';
      }
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
      ShellRoute(
        builder: (_, __, child) => auth.isLoading
            ? const Scaffold(body: LoadingView(message: 'Starting CyberLab...'))
            : MainShell(child: child),
        routes: [
          GoRoute(path: '/home', builder: (_, __) => const DashboardScreen()),
          GoRoute(path: '/learn', builder: (_, __) => const LearnHubScreen()),
          GoRoute(path: '/challenges', builder: (_, __) => const ChallengesScreen()),
          GoRoute(path: '/exams', builder: (_, __) => const ExamsScreen()),
          GoRoute(path: '/more', builder: (_, __) => const MoreScreen()),
        ],
      ),
      GoRoute(path: '/search', builder: (_, __) => const SearchScreen()),
      GoRoute(path: '/notifications', builder: (_, __) => const NotificationsScreen()),
      GoRoute(path: '/learn/plans', builder: (_, __) => const StudyPlansScreen()),
      GoRoute(path: '/learn/plans/:slug', builder: (_, s) => StudyPlanDetailScreen(slug: s.pathParameters['slug']!)),
      GoRoute(path: '/learn/reference', builder: (_, __) => const ReferenceScreen()),
      GoRoute(path: '/learn/reference/:slug', builder: (_, s) => ReferenceDetailScreen(slug: s.pathParameters['slug']!)),
      GoRoute(path: '/learn/roadmap', builder: (_, __) => const RoadmapScreen()),
      GoRoute(path: '/learn/roadmap/:id', builder: (_, s) => RoadmapDetailScreen(pathId: s.pathParameters['id']!)),
      GoRoute(path: '/learn/notes', builder: (_, __) => const NotesScreen()),
      GoRoute(path: '/learn/notes/new', builder: (_, __) => const NoteEditorScreen()),
      GoRoute(path: '/learn/notes/:id', builder: (_, s) => NoteEditorScreen(noteId: s.pathParameters['id'])),
      GoRoute(path: '/challenges/:id', builder: (_, s) => ChallengeDetailScreen(id: s.pathParameters['id']!)),
      GoRoute(path: '/exams/history', builder: (_, __) => const ExamHistoryScreen()),
      GoRoute(path: '/exams/:id', builder: (_, s) => ExamSessionScreen(examId: s.pathParameters['id']!)),
      GoRoute(path: '/news', builder: (_, __) => const NewsScreen()),
      GoRoute(path: '/activity', builder: (_, __) => const ActivityScreen()),
      GoRoute(path: '/assignments', builder: (_, __) => const AssignmentsScreen()),
      GoRoute(path: '/events/:id', builder: (_, s) => EventDetailScreen(eventId: s.pathParameters['id']!)),
      GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
      GoRoute(path: '/leaderboard', builder: (_, __) => const LeaderboardScreen()),
      GoRoute(path: '/certificates', builder: (_, __) => const CertificatesScreen()),
      GoRoute(path: '/courses', builder: (_, __) => const CoursesScreen()),
      GoRoute(path: '/courses/:id', builder: (_, s) => CourseDetailScreen(courseId: s.pathParameters['id']!)),
      GoRoute(path: '/events', builder: (_, __) => const EventsScreen()),
      GoRoute(path: '/classrooms', builder: (_, __) => const ClassroomsScreen()),
      GoRoute(path: '/labs', builder: (_, __) => const LabsCatalogScreen()),
      GoRoute(path: '/tools', builder: (_, __) => const ToolsHubScreen()),
      GoRoute(path: '/tools/soc', builder: (_, __) => const SocAssistantScreen()),
      GoRoute(path: '/tools/recon', builder: (_, __) => const ReconScreen()),
      GoRoute(path: '/tools/vt', builder: (_, __) => const VirusTotalScreen()),
      GoRoute(path: '/tools/intel', builder: (_, __) => const IntelScreen()),
      GoRoute(path: '/daily', builder: (_, __) => const DailyScreen()),
    ],
  );
}
