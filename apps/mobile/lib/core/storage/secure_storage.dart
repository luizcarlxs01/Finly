import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../features/auth/data/auth_models.dart';

/// Persistência do JWT — espelha apps/web/src/lib/auth-storage.ts, só que em
/// `flutter_secure_storage` (Keychain / Keystore) em vez de localStorage.
/// A sessão é considerada inválida quando `expiresAt` já passou, exatamente
/// como no web (isSessionExpired).
class SecureStorage {
  SecureStorage(this._storage);

  static const _sessionKey = 'finly.auth-session';

  final FlutterSecureStorage _storage;

  Future<void> saveSession(AuthSession session) =>
      _storage.write(key: _sessionKey, value: jsonEncode(session.toJson()));

  Future<AuthSession?> readSession() async {
    final raw = await _storage.read(key: _sessionKey);
    if (raw == null || raw.isEmpty) return null;
    try {
      final session = AuthSession.fromJson(
        jsonDecode(raw) as Map<String, dynamic>,
      );
      if (session.isExpired) {
        await clearSession();
        return null;
      }
      return session;
    } catch (_) {
      await clearSession();
      return null;
    }
  }

  Future<void> clearSession() => _storage.delete(key: _sessionKey);
}

final secureStorageProvider = Provider<SecureStorage>((ref) {
  return SecureStorage(
    const FlutterSecureStorage(
      aOptions: AndroidOptions(encryptedSharedPreferences: true),
    ),
  );
});
