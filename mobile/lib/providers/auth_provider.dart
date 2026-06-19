import 'package:flutter/foundation.dart';
import '../models/user.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthProvider extends ChangeNotifier {
  AuthProvider(this._api, this._storage);

  final ApiService _api;
  final StorageService _storage;

  AuthStatus status = AuthStatus.unknown;
  User? user;

  bool get isAuthenticated => status == AuthStatus.authenticated && user != null;
  bool get isLoading => status == AuthStatus.unknown;

  Future<void> init() async {
    _api.onUnauthorized = () {
      user = null;
      status = AuthStatus.unauthenticated;
      notifyListeners();
    };

    final token = await _storage.getToken();
    if (token == null) {
      status = AuthStatus.unauthenticated;
      notifyListeners();
      return;
    }

    try {
      final data = await _api.get('/users/me').timeout(const Duration(seconds: 8));
      user = User.fromJson(data);
      await _storage.saveUser(user!);
      status = AuthStatus.authenticated;
    } catch (_) {
      await _storage.clearAll();
      user = null;
      status = AuthStatus.unauthenticated;
    }
    notifyListeners();
  }

  Future<void> login(String email, String password) async {
    final data = await _api.post('/auth/login', {
      'email': email.trim(),
      'password': password,
    });
    await _storage.saveToken(data['token'] as String);
    user = User.fromJson(data['user'] as Map<String, dynamic>);
    await _storage.saveUser(user!);
    status = AuthStatus.authenticated;
    notifyListeners();
  }

  Future<void> register(String username, String email, String password) async {
    final data = await _api.post('/auth/register', {
      'username': username.trim(),
      'email': email.trim(),
      'password': password,
    });
    await _storage.saveToken(data['token'] as String);
    user = User.fromJson(data['user'] as Map<String, dynamic>);
    await _storage.saveUser(user!);
    status = AuthStatus.authenticated;
    notifyListeners();
  }

  Future<void> refreshUser() async {
    final data = await _api.get('/users/me');
    user = User.fromJson(data);
    await _storage.saveUser(user!);
    notifyListeners();
  }

  Future<void> logout() async {
    await _storage.clearAll();
    user = null;
    status = AuthStatus.unauthenticated;
    notifyListeners();
  }
}
