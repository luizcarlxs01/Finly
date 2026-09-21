import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/storage/secure_storage.dart';
import '../data/auth_models.dart';
import '../data/auth_repository.dart';

/// Estado de sessão — espelha apps/web/src/hooks/use-auth-session.ts +
/// FinanceSourceProvider. `authenticated` decide o "modo" do app: sem sessão
/// válida → telas de acesso; com sessão → dados da API. (O web ainda tem um
/// modo local/localStorage; no mobile isso está fora de escopo — PASSO 11 do
/// briefing amarra o app à API de produção.)
class PendingVerification {
  const PendingVerification({required this.email, required this.name});
  final String email;
  final String name;
}

class AuthState {
  const AuthState({
    this.session,
    this.isBootstrapping = true,
    this.isSubmitting = false,
    this.pendingVerification,
  });

  final AuthSession? session;
  final bool isBootstrapping;
  final bool isSubmitting;
  final PendingVerification? pendingVerification;

  bool get authenticated => session != null && !session!.isExpired;

  AuthState copyWith({
    AuthSession? session,
    bool clearSession = false,
    bool? isBootstrapping,
    bool? isSubmitting,
    PendingVerification? pendingVerification,
    bool clearPendingVerification = false,
  }) {
    return AuthState(
      session: clearSession ? null : (session ?? this.session),
      isBootstrapping: isBootstrapping ?? this.isBootstrapping,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      pendingVerification: clearPendingVerification
          ? null
          : (pendingVerification ?? this.pendingVerification),
    );
  }
}

class AuthController extends Notifier<AuthState> {
  Timer? _expiryTimer;

  @override
  AuthState build() {
    ref.onDispose(() => _expiryTimer?.cancel());
    // Carrega a sessão persistida de forma assíncrona; até lá isBootstrapping.
    Future.microtask(_restore);
    return const AuthState();
  }

  Future<void> _restore() async {
    final stored = await ref.read(secureStorageProvider).readSession();
    _applySession(stored, bootstrapping: false);
  }

  void _applySession(AuthSession? session, {bool bootstrapping = false}) {
    _expiryTimer?.cancel();
    if (session != null && !session.isExpired) {
      final delay = session.expiresAt.difference(DateTime.now());
      _expiryTimer = Timer(delay, () => handleUnauthorized());
    }
    state = state.copyWith(
      session: session,
      clearSession: session == null,
      isBootstrapping: bootstrapping ? state.isBootstrapping : false,
    );
  }

  Future<void> login(LoginRequest request) async {
    state = state.copyWith(isSubmitting: true);
    try {
      final outcome = await ref.read(authRepositoryProvider).login(request);
      await _applyOutcome(outcome);
    } finally {
      state = state.copyWith(isSubmitting: false);
    }
  }

  Future<void> register(RegisterRequest request) async {
    state = state.copyWith(isSubmitting: true);
    try {
      final outcome = await ref.read(authRepositoryProvider).register(request);
      await _applyOutcome(outcome);
    } finally {
      state = state.copyWith(isSubmitting: false);
    }
  }

  Future<void> _applyOutcome(AuthOutcome outcome) async {
    if (outcome.requiresVerification) {
      state = state.copyWith(
        pendingVerification: PendingVerification(
          email: outcome.email ?? '',
          name: outcome.name ?? '',
        ),
      );
      return;
    }

    final session = outcome.session!;
    await ref.read(secureStorageProvider).saveSession(session);
    _applySession(session);
  }

  Future<void> verifyCode(String code) async {
    final pending = state.pendingVerification;
    if (pending == null) return;

    state = state.copyWith(isSubmitting: true);
    try {
      final session = await ref.read(authRepositoryProvider).verifyEmailCode(
            VerifyEmailCodeRequest(email: pending.email, code: code),
          );
      await ref.read(secureStorageProvider).saveSession(session);
      state = state.copyWith(clearPendingVerification: true);
      _applySession(session);
    } finally {
      state = state.copyWith(isSubmitting: false);
    }
  }

  Future<void> resendCode() async {
    final pending = state.pendingVerification;
    if (pending == null) return;

    state = state.copyWith(isSubmitting: true);
    try {
      await ref
          .read(authRepositoryProvider)
          .resendVerificationCode(ResendVerificationCodeRequest(email: pending.email));
    } finally {
      state = state.copyWith(isSubmitting: false);
    }
  }

  void cancelVerification() {
    state = state.copyWith(clearPendingVerification: true);
  }

  Future<void> forgotPassword(String email) async {
    state = state.copyWith(isSubmitting: true);
    try {
      await ref
          .read(authRepositoryProvider)
          .forgotPassword(ForgotPasswordRequest(email: email));
    } finally {
      state = state.copyWith(isSubmitting: false);
    }
  }

  Future<void> logout() async {
    await ref.read(secureStorageProvider).clearSession();
    _applySession(null);
  }

  /// Chamado pelo interceptor num 401 ou pelo timer de expiração.
  void handleUnauthorized() {
    if (state.session == null) return;
    if (kDebugMode) debugPrint('[auth] sessão expirada/revogada — logout');
    unawaited(ref.read(secureStorageProvider).clearSession());
    _applySession(null);
  }
}

final authControllerProvider =
    NotifierProvider<AuthController, AuthState>(AuthController.new);
