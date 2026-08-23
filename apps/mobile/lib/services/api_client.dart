import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

const kApiBaseUrl = String.fromEnvironment(
  'FINLY_API_URL',
  defaultValue: 'https://api.finly.systems',
);

const kTokenStorageKey = 'finly_auth_token';

class ApiClient {
  ApiClient(this._storage) {
    _dio = Dio(
      BaseOptions(
        baseUrl: kApiBaseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 20),
        headers: {'Content-Type': 'application/json'},
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.read(key: kTokenStorageKey);
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401) {
            await _storage.delete(key: kTokenStorageKey);
          }
          handler.next(error);
        },
      ),
    );
  }

  final FlutterSecureStorage _storage;
  late final Dio _dio;

  Dio get dio => _dio;

  Future<void> saveToken(String token) =>
      _storage.write(key: kTokenStorageKey, value: token);

  Future<String?> readToken() => _storage.read(key: kTokenStorageKey);

  Future<void> clearToken() => _storage.delete(key: kTokenStorageKey);
}
