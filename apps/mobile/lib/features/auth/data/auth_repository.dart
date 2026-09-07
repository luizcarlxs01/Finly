import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import 'auth_models.dart';

/// Espelha apps/web/src/lib/api/auth.ts — POST /api/Auth/login e
/// /api/Auth/register. A validação de domínio de e-mail por registro MX
/// (Fase F do CLAUDE.md) roda no backend; o cliente só repassa a mensagem de
/// erro quando o domínio é rejeitado.
class AuthRepository {
  AuthRepository(this._client);

  final ApiClient _client;

  Future<AuthSession> login(LoginRequest request) async {
    final json = await _client.post<Map<String, dynamic>>(
      '/api/Auth/login',
      body: request.toJson(),
    );
    return AuthSession.fromJson(json);
  }

  Future<AuthSession> register(RegisterRequest request) async {
    final json = await _client.post<Map<String, dynamic>>(
      '/api/Auth/register',
      body: request.toJson(),
    );
    return AuthSession.fromJson(json);
  }
}

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(ref.read(apiClientProvider)),
);
