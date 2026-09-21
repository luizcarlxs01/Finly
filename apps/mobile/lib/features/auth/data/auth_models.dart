/// Espelha AuthResponseDto e os requests de Login/Register
/// (apps/api/.../DTOs/Auth) + apps/web/src/types/auth.ts.
class AuthSession {
  AuthSession({
    required this.token,
    required this.expiresAt,
    required this.userId,
    required this.name,
    required this.email,
  });

  final String token;
  final DateTime expiresAt;
  final String userId;
  final String name;
  final String email;

  bool get isExpired => !expiresAt.isAfter(DateTime.now());

  factory AuthSession.fromJson(Map<String, dynamic> json) => AuthSession(
        token: json['token'] as String,
        expiresAt: DateTime.parse(json['expiresAt'] as String),
        userId: json['userId'] as String,
        name: json['name'] as String? ?? '',
        email: json['email'] as String? ?? '',
      );

  Map<String, dynamic> toJson() => {
        'token': token,
        'expiresAt': expiresAt.toIso8601String(),
        'userId': userId,
        'name': name,
        'email': email,
      };
}

class LoginRequest {
  LoginRequest({required this.email, required this.password});
  final String email;
  final String password;
  Map<String, dynamic> toJson() => {'email': email, 'password': password};
}

class RegisterRequest {
  RegisterRequest({
    required this.name,
    required this.email,
    required this.password,
  });
  final String name;
  final String email;
  final String password;
  Map<String, dynamic> toJson() =>
      {'name': name, 'email': email, 'password': password};
}

/// Resultado de login/register — espelha `AuthOutcome` de
/// apps/web/src/types/auth.ts. O backend sempre devolve `requiresVerification`;
/// quando `true`, [session] vem nulo e é preciso confirmar o código antes de
/// ter uma sessão de verdade.
class AuthOutcome {
  AuthOutcome({required this.requiresVerification, this.session, this.email, this.name});

  final bool requiresVerification;
  final AuthSession? session;
  final String? email;
  final String? name;

  factory AuthOutcome.fromJson(Map<String, dynamic> json) {
    final requiresVerification = json['requiresVerification'] as bool? ?? false;

    if (requiresVerification) {
      return AuthOutcome(
        requiresVerification: true,
        email: json['email'] as String?,
        name: json['name'] as String?,
      );
    }

    return AuthOutcome(
      requiresVerification: false,
      session: AuthSession.fromJson(json),
    );
  }
}

class VerifyEmailCodeRequest {
  VerifyEmailCodeRequest({required this.email, required this.code});
  final String email;
  final String code;
  Map<String, dynamic> toJson() => {'email': email, 'code': code};
}

class ResendVerificationCodeRequest {
  ResendVerificationCodeRequest({required this.email});
  final String email;
  Map<String, dynamic> toJson() => {'email': email};
}

class ForgotPasswordRequest {
  ForgotPasswordRequest({required this.email});
  final String email;
  Map<String, dynamic> toJson() => {'email': email};
}
