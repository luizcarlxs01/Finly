import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

import '../../../shared/models/goal.dart';

const _uuid = Uuid();

/// Espelha apps/web/src/hooks/use-local-goals.ts — metas no
/// `shared_preferences`. Mesma validação (título + alvo > 0 + atual >= 0),
/// mesma ordenação (mais recentes primeiro).
class LocalGoalsStore extends AsyncNotifier<List<Goal>> {
  static const _key = 'finly.local-goals';

  @override
  Future<List<Goal>> build() async {
    final raw = (await SharedPreferences.getInstance()).getString(_key);
    if (raw == null || raw.isEmpty) return const [];
    try {
      final list = (jsonDecode(raw) as List<dynamic>)
          .map((e) => Goal.fromJson(e as Map<String, dynamic>))
          .toList();
      _sort(list);
      return list;
    } catch (_) {
      return const [];
    }
  }

  static void _sort(List<Goal> goals) =>
      goals.sort((a, b) => b.createdAt.compareTo(a.createdAt));

  List<Goal> get _goals => state.valueOrNull ?? const [];

  Future<void> _save(List<Goal> next) async {
    _sort(next);
    state = AsyncData(next);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, jsonEncode(next.map((g) => g.toJson()).toList()));
  }

  Future<void> addGoal({
    required String title,
    required double targetAmount,
    required double currentAmount,
    String category = 'general',
    String? deadline,
  }) async {
    final trimmed = title.trim();
    if (trimmed.isEmpty || targetAmount <= 0 || currentAmount < 0) return;
    final goal = Goal(
      id: _uuid.v4(),
      financialProfileId: '',
      title: trimmed,
      targetAmount: targetAmount,
      currentAmount: currentAmount,
      deadline: (deadline != null && deadline.trim().isNotEmpty)
          ? deadline.trim()
          : null,
      status: '',
      category: category.trim().toLowerCase().isEmpty
          ? 'general'
          : category.trim().toLowerCase(),
      createdAt: DateTime.now(),
    );
    await _save([goal, ..._goals]);
  }

  Future<void> updateProgress(String id, double currentAmount) async {
    if (currentAmount < 0) return;
    await _save(_goals
        .map((g) => g.id == id ? g.copyWith(currentAmount: currentAmount) : g)
        .toList());
  }

  Future<void> removeGoal(String id) =>
      _save(_goals.where((g) => g.id != id).toList());
}

final localGoalsStoreProvider =
    AsyncNotifierProvider<LocalGoalsStore, List<Goal>>(LocalGoalsStore.new);
