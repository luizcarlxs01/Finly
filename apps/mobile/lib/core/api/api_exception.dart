import 'package:dio/dio.dart';

/// Exceção única de camada de API. Espelha o tratamento do web
/// (apps/web/src/lib/api/client.ts): a API do Finly devolve `{ "message": "..." }`
/// no corpo para 400 / 404 / 429 e um 401 puro quando o token falta/expira.
///
/// PASSO 10 do briefing cita "Problems.cs / RFC 7807" — na prática a API **não**
/// emite ProblemDetails; ela usa `{ message }`. Então: quando há `message` no
/// corpo, usamos ele (é a fonte de verdade, igual ao web); senão caímos numa
/// mensagem amigável por status.
class ApiException implements Exception {
  ApiException(this.message, {this.statusCode, this.isUnauthorized = false});

  final String message;
  final int? statusCode;
  final bool isUnauthorized;

  @override
  String toString() => message;

  static ApiException fromDio(DioException error) {
    final response = error.response;
    final status = response?.statusCode;

    // Mensagem vinda do corpo `{ message }` — preferida, igual ao web.
    final data = response?.data;
    String? bodyMessage;
    if (data is Map && data['message'] is String &&
        (data['message'] as String).trim().isNotEmpty) {
      bodyMessage = (data['message'] as String).trim();
    } else if (data is String && data.trim().isNotEmpty && data.trim().startsWith('{')) {
      // 429 do rate limiter é escrito como string JSON crua.
      final m = RegExp(r'"message"\s*:\s*"([^"]+)"').firstMatch(data);
      bodyMessage = m?.group(1);
    }

    if (status == 401) {
      return ApiException(
        bodyMessage ?? 'Sua sessão expirou. Entre novamente para continuar.',
        statusCode: 401,
        isUnauthorized: true,
      );
    }

    if (bodyMessage != null) {
      return ApiException(bodyMessage, statusCode: status);
    }

    final fallback = switch (status) {
      400 => 'Não foi possível concluir a operação. Revise os dados e tente novamente.',
      403 => 'Você não tem permissão para acessar este recurso.',
      404 => 'Não encontramos o que você procura.',
      409 => 'Este registro entra em conflito com outro já existente.',
      422 => 'Alguns campos não passaram na validação.',
      429 => 'Muitas tentativas em pouco tempo. Aguarde um instante e tente de novo.',
      500 || 502 || 503 => 'O servidor teve um problema. Tente novamente em alguns minutos.',
      _ => switch (error.type) {
          DioExceptionType.connectionTimeout ||
          DioExceptionType.sendTimeout ||
          DioExceptionType.receiveTimeout =>
            'A conexão demorou demais. Verifique sua internet e tente novamente.',
          DioExceptionType.connectionError =>
            'Sem conexão com o servidor. Verifique sua internet.',
          _ => 'Algo deu errado ao falar com o servidor.',
        },
    };

    return ApiException(fallback, statusCode: status);
  }
}
