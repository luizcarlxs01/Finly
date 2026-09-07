import 'package:flutter/foundation.dart';

/// Configuração de ambiente do cliente HTTP.
///
/// PASSO 11 do briefing: a API de produção já roda em https://api.finly.systems
/// (HTTPS, no ar). Builds de release apontam para lá por padrão. Builds de debug
/// apontam para um host local, sobreponível em tempo de compilação:
///
///   flutter run --dart-define=FINLY_API_BASE_URL=http://192.168.0.10:8080
///
/// (o mesmo `NEXT_PUBLIC_API_URL` do web, seção 15 do CLAUDE.md — Docker=8080,
/// Kestrel=5149).
class ApiConfig {
  ApiConfig._();

  static const String _productionBaseUrl = 'https://api.finly.systems';

  /// `10.0.2.2` é o alias do host a partir do emulador Android; em dispositivo
  /// físico troque via --dart-define.
  static const String _defaultDebugBaseUrl = 'http://10.0.2.2:8080';

  static const String _override =
      String.fromEnvironment('FINLY_API_BASE_URL', defaultValue: '');

  static String get baseUrl {
    if (_override.isNotEmpty) return _override;
    return kReleaseMode ? _productionBaseUrl : _defaultDebugBaseUrl;
  }
}
