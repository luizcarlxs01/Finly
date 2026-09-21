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

  Future<AuthOutcome> login(LoginRequest request) async {
    final json = await _client.post<Map<String, dynamic>>(
      '/api/Auth/login',
      body: request.toJson(),
    );
    return AuthOutcome.fromJson(json);
  }

  Future<AuthOutcome> register(RegisterRequest request) async {
    final json = await _client.post<Map<String, dynamic>>(
      '/api/Auth/register',
      body: request.toJson(),
    );
    return AuthOutcome.fromJson(json);
  }

  Future<AuthSession> verifyEmailCode(VerifyEmailCodeRequest request) async {
    final json = await _client.post<Map<String, dynamic>>(
      '/api/Auth/verify-email',
      body: request.toJson(),
    );
    return AuthSession.fromJson(json);
  }

  Future<void> resendVerificationCode(ResendVerificationCodeRequest request) async {
    await _client.post<Map<String, dynamic>>(
      '/api/Auth/resend-code',
      body: request.toJson(),
    );
  }

  /// POST /api/Auth/forgot-password — sempre 200, exista ou não o e-mail
  /// (anti-enumeração, seção 28 do CLAUDE.md). O link de redefinição sempre
  /// abre no navegador; não há tela de redefinição no app.
  Future<void> forgotPassword(ForgotPasswordRequest request) async {
    await _client.post<Map<String, dynamic>>(
      '/api/Auth/forgot-password',
      body: request.toJson(),
    );
  }
}

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(ref.read(apiClientProvider)),
);
