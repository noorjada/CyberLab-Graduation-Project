import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'providers/exam_provider.dart';
import 'router/app_router.dart';
import 'services/api_service.dart';
import 'services/storage_service.dart';
import 'theme/app_theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const CyberLabApp());
}

class CyberLabApp extends StatefulWidget {
  const CyberLabApp({super.key});

  @override
  State<CyberLabApp> createState() => _CyberLabAppState();
}

class _CyberLabAppState extends State<CyberLabApp> {
  late final StorageService _storage;
  late final ApiService _api;
  late final AuthProvider _auth;
  late final ExamProvider _exam;
  GoRouter? _router;

  @override
  void initState() {
    super.initState();
    _storage = StorageService();
    _api = ApiService(_storage);
    _auth = AuthProvider(_api, _storage);
    _exam = ExamProvider(_api);
    Future.wait([_auth.init(), _exam.sync()]);
  }

  @override
  Widget build(BuildContext context) {
    _router ??= createRouter(_auth, _exam);

    return MultiProvider(
      providers: [
        Provider<StorageService>.value(value: _storage),
        Provider<ApiService>.value(value: _api),
        ChangeNotifierProvider<AuthProvider>.value(value: _auth),
        ChangeNotifierProvider<ExamProvider>.value(value: _exam),
      ],
      child: MaterialApp.router(
        title: 'CyberLab',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.dark,
        routerConfig: _router!,
      ),
    );
  }
}
