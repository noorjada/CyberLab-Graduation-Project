import 'package:flutter/foundation.dart';
import '../services/api_service.dart';

class ExamProvider extends ChangeNotifier {
  ExamProvider(this._api);

  final ApiService _api;
  Map<String, dynamic>? session;
  bool loading = false;

  bool get inExam => session != null;
  String? get examId => session?['examId']?.toString();

  Future<void> sync() async {
    loading = true;
    notifyListeners();
    try {
      final res = await _api.get('/exams/session/active');
      if (res['active'] == true && res['session'] != null) {
        session = Map<String, dynamic>.from(res['session'] as Map);
      } else {
        session = null;
      }
    } catch (_) {
      session = null;
    }
    loading = false;
    notifyListeners();
  }

  void enter(Map<String, dynamic> examSession) {
    session = examSession;
    notifyListeners();
  }

  void exit() {
    session = null;
    notifyListeners();
  }
}
