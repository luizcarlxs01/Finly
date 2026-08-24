import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/goal.dart';
import 'auth_provider.dart';
import 'finance_provider.dart';
import 'profile_provider.dart';

class GoalsData {
  final List<Goal> goals;
  final bool isLoading;
  final String? error;

  const GoalsData({this.goals = const [], this.isLoading = false, this.error});

  GoalsData copyWith({List<Goal>? goals, bool? isLoading, String? error}) {
    return GoalsData(
      goals: goals ?? this.goals,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

/// Hook unificado de metas — mesma decisão local/API do FinanceNotifier,
/// nunca exposta à UI (regra absoluta da seção 2 do CLAUDE.md).
class GoalsNotifier extends StateNotifier<GoalsData> {
  GoalsNotifier(this._ref) : super(const GoalsData(isLoading: true)) {
    load();
  }

  final Ref _ref;

  FinanceSource get _source => _ref.read(authProvider).source;

  Future<void> load() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      if (_source == FinanceSource.local) {
        final profile = await _ref.read(localStorageProvider).load();
        state = GoalsData(goals: profile.goals);
      } else {
        final client = _ref.read(apiClientProvider);
        final profile = await _ref.read(primaryProfileProvider.future);

        if (profile == null) {
          throw Exception('Não foi possível identificar o perfil da conta.');
        }

        final response = await client.dio.get<List<dynamic>>(
          '/api/goals',
          queryParameters: {'financialProfileId': profile.id},
        );
        final goals = (response.data ?? [])
            .map((raw) => Goal.fromJson(raw as Map<String, dynamic>))
            .toList();
        state = GoalsData(goals: goals);
      }
    } catch (_) {
      state = state.copyWith(
        isLoading: false,
        error: 'Não foi possível carregar suas metas.',
      );
    }
  }
}

final goalsProvider = StateNotifierProvider<GoalsNotifier, GoalsData>((ref) {
  ref.watch(authProvider.select((auth) => auth.source));
  return GoalsNotifier(ref);
});
