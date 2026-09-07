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
class AuthState {
  const AuthState({
    this.session,
    this.isBootstrapping = true,
    this.isSubmitting = false,
  });

  final AuthSession? session;
  final bool isBootstrapping;
  final bool isSubmitting;

  bool get authenticated => session != null && !session!.isExpired;

  AuthState copyWith({
    AuthSession? session,
    bool clearSession = false,
    bool? isBootstrapping,
    bool? isSubmitting,
  }) {
    return AuthState(
      session: clearSession ? null : (session ?? this.session),
      isBootstrapping: isBootstrapping ?? this.isBootstrapping,
      isSubmitting: isSubmitting ?? this.isSubmitting,
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
      final session = await ref.read(authRepositoryProvider).login(request);
      await ref.read(secureStorageProvider).saveSession(session);
      _applySession(session);
    } finally {
      state = state.copyWith(isSubmitting: false);
    }
  }

  Future<void> register(RegisterRequest request) async {
    state = state.copyWith(isSubmitting: true);
    try {
      final session = await ref.read(authRepositoryProvider).register(request);
      await ref.read(secureStorageProvider).saveSession(session);
      _applySession(session);
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
