import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _key = 'finly:dashboard-values-hidden';

/// Espelha `use-value-privacy.ts` da web: a preferência de ocultar valores é
/// persistida e compartilhada por Início e Lançamentos.
class ValuePrivacyNotifier extends Notifier<bool> {
  @override
  bool build() {
    _load();
    return false;
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final stored = prefs.getBool(_key) ?? false;
    if (stored != state) state = stored;
  }

  Future<void> toggle() async {
    state = !state;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_key, state);
  }
}

final valuePrivacyProvider =
    NotifierProvider<ValuePrivacyNotifier, bool>(ValuePrivacyNotifier.new);
