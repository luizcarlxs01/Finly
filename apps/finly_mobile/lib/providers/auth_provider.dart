import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../models/auth_session.dart';
import '../services/api_client.dart';

final secureStorageProvider = Provider<FlutterSecureStorage>((ref) {
  return const FlutterSecureStorage();
});

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(ref.watch(secureStorageProvider));
});

/// Modo de origem dos dados. A UI nunca lê isto para decidir layout —
/// só os providers de dados usam, replicando o FinanceSourceProvider do web.
enum FinanceSource { local, api }

class AuthState {
  final AuthSession? session;
  final bool isLoading;
  final String? error;

  const AuthState({this.session, this.isLoading = false, this.error});

  bool get isAuthenticated => session != null && !session!.isExpired;

  FinanceSource get source =>
      isAuthenticated ? FinanceSource.api : FinanceSource.local;

  AuthState copyWith({
    AuthSession? session,
    bool? isLoading,
    String? error,
    bool clearSession = false,
    bool clearError = false,
  }) {
    return AuthState(
      session: clearSession ? null : (session ?? this.session),
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier(this._apiClient) : super(const AuthState());

  final ApiClient _apiClient;

  Future<void> login(String email, String password) async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final response = await _apiClient.dio.post<Map<String, dynamic>>(
        '/api/auth/login',
        data: {'email': email, 'password': password},
      );

      final session = AuthSession.fromJson(response.data!);
      await _apiClient.saveToken(session.token);
      state = AuthState(session: session);
    } on DioException catch (error) {
      state = state.copyWith(
        isLoading: false,
        error: _messageFrom(error),
      );
    }
  }

  Future<void> register(String name, String email, String password) async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final response = await _apiClient.dio.post<Map<String, dynamic>>(
        '/api/auth/register',
        data: {'name': name, 'email': email, 'password': password},
      );

      final session = AuthSession.fromJson(response.data!);
      await _apiClient.saveToken(session.token);
      state = AuthState(session: session);
    } on DioException catch (error) {
      state = state.copyWith(
        isLoading: false,
        error: _messageFrom(error),
      );
    }
  }

  Future<void> logout() async {
    await _apiClient.clearToken();
    state = const AuthState();
  }

  String _messageFrom(DioException error) {
    final data = error.response?.data;
    if (data is Map<String, dynamic>) {
      final message = data['message'] ?? data['title'];
      if (message is String && message.isNotEmpty) return message;
    }
    if (error.response?.statusCode == 429) {
      return 'Muitas tentativas. Aguarde alguns minutos.';
    }
    return 'Não foi possível conectar. Verifique sua internet.';
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.watch(apiClientProvider));
});
