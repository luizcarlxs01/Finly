import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/finance_source.dart';
import '../../../shared/models/goal.dart';
import '../../transactions/state/finance_controller.dart';
import '../data/goals_repository.dart';
import '../data/local_goals_store.dart';

/// Espelha apps/web/src/hooks/use-goals-data.ts + hooks de escrita de meta.
/// Modo API: usa o perfil selecionado pelo FinanceController. Modo sem conta:
/// metas do `shared_preferences` (LocalGoalsStore).
class GoalsState {
  GoalsState({required this.goals});

  final List<Goal> goals;

  double get totalTarget => goals.fold(0, (sum, g) => sum + g.targetAmount);
  double get totalProgress => goals.fold(0, (sum, g) => sum + g.currentAmount);
  double get remaining =>
      (totalTarget - totalProgress).clamp(0, double.infinity).toDouble();

  static final empty = GoalsState(goals: const []);
}

class GoalsController extends AsyncNotifier<GoalsState> {
  GoalsRepository get _repo => ref.read(goalsRepositoryProvider);

  bool get _isLocal =>
      ref.read(financeSourceProvider) == FinanceSource.local;

  LocalGoalsStore get _local => ref.read(localGoalsStoreProvider.notifier);

  @override
  Future<GoalsState> build() async {
    final source = ref.watch(financeSourceProvider);
    if (source == FinanceSource.local) {
      final goals = ref.watch(localGoalsStoreProvider).valueOrNull ?? const [];
      return GoalsState(goals: goals);
    }
    return _load();
  }

  Future<GoalsState> _load() async {
    final profileId = await _resolveProfileId();
    if (profileId == null) return GoalsState.empty;
    final goals = await _repo.getGoals(profileId);
    goals.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return GoalsState(goals: goals);
  }

  Future<String?> _resolveProfileId() async {
    final finance = await ref.read(financeControllerProvider.future);
    return finance.profile?.id;
  }

  Future<void> refresh() async {
    if (_isLocal) {
      ref.invalidate(localGoalsStoreProvider);
      return;
    }
    state = await AsyncValue.guard(_load);
  }

  Future<void> createGoal({
    required String title,
    required double targetAmount,
    required double currentAmount,
    String category = 'general',
    String? deadline,
  }) async {
    if (_isLocal) {
      return _local.addGoal(
        title: title,
        targetAmount: targetAmount,
        currentAmount: currentAmount,
        category: category,
        deadline: deadline,
      );
    }
    final profileId = await _resolveProfileId();
    if (profileId == null) throw StateError('Perfil da conta indisponível.');
    await _repo.createGoal(
      profileId: profileId,
      title: title,
      targetAmount: targetAmount,
      currentAmount: currentAmount,
      deadline: deadline,
    );
    await refresh();
  }

  Future<void> updateProgress(String goalId, double currentAmount) async {
    if (_isLocal) return _local.updateProgress(goalId, currentAmount);
    await _repo.updateProgress(goalId, currentAmount);
    await refresh();
  }

  Future<void> deleteGoal(String goalId) async {
    if (_isLocal) return _local.removeGoal(goalId);
    await _repo.deleteGoal(goalId);
    await refresh();
  }
}

final goalsControllerProvider =
    AsyncNotifierProvider<GoalsController, GoalsState>(GoalsController.new);
