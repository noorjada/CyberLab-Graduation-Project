import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user.dart';

class StorageService {
  static const _tokenKey = 'cyberlab_token';
  static const _userKey = 'cyberlab_user';

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
  }

  Future<User?> getUser() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_userKey);
    if (raw == null) return null;
    try {
      return User.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  Future<void> saveUser(User user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userKey, jsonEncode(user.toJson()));
  }

  Future<void> clearUser() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_userKey);
  }

  Future<void> clearAll() async {
    await clearToken();
    await clearUser();
  }

  Future<void> saveExamDraft(String examId, List<int> answers, int currentQ) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      'exam_draft_$examId',
      jsonEncode({'answers': answers, 'currentQ': currentQ}),
    );
  }

  Future<Map<String, dynamic>?> getExamDraft(String examId) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString('exam_draft_$examId');
    if (raw == null) return null;
    try {
      return jsonDecode(raw) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  Future<void> clearExamDraft(String examId) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('exam_draft_$examId');
  }
}
