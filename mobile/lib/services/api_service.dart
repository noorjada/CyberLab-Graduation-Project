import 'package:dio/dio.dart';
import '../config/api_config.dart';
import 'storage_service.dart';

class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final String? code;

  const ApiException(this.message, {this.statusCode, this.code});

  @override
  String toString() => message;
}

class ApiService {
  ApiService(this._storage) {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConfig.baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Content-Type': 'application/json'},
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          final path = error.requestOptions.path;
          if (!path.contains('/auth/login') && !path.contains('/auth/register')) {
            await _storage.clearAll();
            onUnauthorized?.call();
          }
        }
        handler.next(error);
      },
    ));
  }

  final StorageService _storage;
  late final Dio _dio;
  void Function()? onUnauthorized;

  Future<Map<String, dynamic>> post(String path, [Map<String, dynamic>? body]) async {
    try {
      final res = await _dio.post(path, data: body);
      return _asMap(res.data);
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  Future<Map<String, dynamic>> get(String path, {Map<String, dynamic>? query}) async {
    try {
      final res = await _dio.get(path, queryParameters: query);
      return _asMap(res.data);
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  Future<List<dynamic>> getList(String path, {Map<String, dynamic>? query}) async {
    try {
      final res = await _dio.get(path, queryParameters: query);
      final data = res.data;
      if (data is List) return data;
      return [];
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  Future<Map<String, dynamic>> put(String path, [Map<String, dynamic>? body]) async {
    try {
      final res = await _dio.put(path, data: body);
      return _asMap(res.data);
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  Future<Map<String, dynamic>> delete(String path) async {
    try {
      final res = await _dio.delete(path);
      return _asMap(res.data);
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  Map<String, dynamic> _asMap(dynamic data) {
    if (data is Map<String, dynamic>) return data;
    if (data is Map) return Map<String, dynamic>.from(data);
    return {};
  }

  ApiException _mapError(DioException e) {
    final data = e.response?.data;
    String message = 'Something went wrong';
    String? code;

    if (data is Map) {
      message = data['message']?.toString() ?? message;
      code = data['code']?.toString();
      if (data['errors'] is List && (data['errors'] as List).isNotEmpty) {
        final first = (data['errors'] as List).first;
        if (first is Map && first['msg'] != null) {
          message = first['msg'].toString();
        }
      }
    } else if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout) {
      message = 'Connection timed out. Check your network and API URL.';
    } else if (e.type == DioExceptionType.connectionError) {
      message = 'Cannot reach server at ${ApiConfig.baseUrl}';
    }

    return ApiException(message, statusCode: e.response?.statusCode, code: code);
  }
}
