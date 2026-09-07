import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/auth/state/auth_controller.dart';
import 'api_config.dart';
import 'api_exception.dart';
import 'api_interceptor.dart';

/// Cliente HTTP centralizado — equivalente a apps/web/src/lib/api/client.ts.
/// Toda chamada à API do Finly passa por aqui; nenhum widget fala com `Dio`
/// diretamente (mesma regra do web: `lib/api` concentra o HTTP).
class ApiClient {
  ApiClient(this._ref) {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConfig.baseUrl,
        connectTimeout: const Duration(seconds: 20),
        receiveTimeout: const Duration(seconds: 20),
        contentType: 'application/json',
        // Deixa o próprio cliente lidar com os erros de status; o interceptor
        // converte em ApiException.
        validateStatus: (status) => status != null && status < 400,
      ),
    );

    _dio.interceptors.add(
      AuthInterceptor(
        tokenProvider: () => _ref.read(authControllerProvider).session?.token,
        onUnauthorized: () =>
            _ref.read(authControllerProvider.notifier).handleUnauthorized(),
      ),
    );

    if (kDebugMode) {
      _dio.interceptors.add(
        LogInterceptor(requestBody: true, responseBody: true, error: true),
      );
    }
  }

  final Ref _ref;
  late final Dio _dio;

  Future<T> get<T>(String path, {Map<String, dynamic>? query}) =>
      _send<T>(() => _dio.get(path, queryParameters: query));

  Future<T> post<T>(String path, {Object? body}) =>
      _send<T>(() => _dio.post(path, data: body));

  Future<T> put<T>(String path, {Object? body}) =>
      _send<T>(() => _dio.put(path, data: body));

  Future<T> patch<T>(String path, {Object? body}) =>
      _send<T>(() => _dio.patch(path, data: body));

  Future<void> delete(String path) =>
      _send<void>(() => _dio.delete(path));

  Future<T> _send<T>(Future<Response<dynamic>> Function() run) async {
    try {
      final response = await run();
      return response.data as T;
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }
}

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient(ref));
