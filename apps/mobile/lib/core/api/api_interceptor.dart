import 'package:dio/dio.dart';

/// Anexa `Authorization: Bearer <jwt>` em toda requisição (igual ao web, que
/// passa `token` para `apiFetch`) e, num 401, dispara o logout — a sessão
/// expirou ou o token foi revogado.
class AuthInterceptor extends Interceptor {
  AuthInterceptor({required this.tokenProvider, required this.onUnauthorized});

  final String? Function() tokenProvider;
  final void Function() onUnauthorized;

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    final token = tokenProvider();
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    if (err.response?.statusCode == 401) {
      onUnauthorized();
    }
    handler.next(err);
  }
}
