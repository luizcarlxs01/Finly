import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/goal.dart';
import '../models/transaction.dart';

const _profileKey = 'finly_local_profile';

/// Perfil financeiro do modo sem conta. O schema espelha
/// apps/web types/local-finance-profile.ts — transações já achatadas em
/// occurrences, mesma semântica de saldo (só occurrences pagas contam).
class LocalFinanceProfile {
  final double initialBalance;
  final List<TransactionLine> transactions;
  final List<Goal> goals;

  const LocalFinanceProfile({
    required this.initialBalance,
    required this.transactions,
    required this.goals,
  });

  static const empty = LocalFinanceProfile(
    initialBalance: 0,
    transactions: [],
    goals: [],
  );

  LocalFinanceProfile copyWith({
    double? initialBalance,
    List<TransactionLine>? transactions,
    List<Goal>? goals,
  }) {
    return LocalFinanceProfile(
      initialBalance: initialBalance ?? this.initialBalance,
      transactions: transactions ?? this.transactions,
      goals: goals ?? this.goals,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'initialBalance': initialBalance,
      'transactions': transactions.map((t) => t.toLocalJson()).toList(),
      'goals': goals.map((g) => g.toJson()).toList(),
    };
  }

  factory LocalFinanceProfile.fromJson(Map<String, dynamic> json) {
    return LocalFinanceProfile(
      initialBalance: (json['initialBalance'] as num?)?.toDouble() ?? 0,
      transactions: (json['transactions'] as List<dynamic>? ?? [])
          .map((raw) =>
              TransactionLine.fromLocalJson(raw as Map<String, dynamic>))
          .toList(),
      goals: (json['goals'] as List<dynamic>? ?? [])
          .map((raw) => Goal.fromJson(raw as Map<String, dynamic>))
          .toList(),
    );
  }
}

class LocalStorageService {
  Future<LocalFinanceProfile> load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_profileKey);
    if (raw == null || raw.isEmpty) return LocalFinanceProfile.empty;

    return LocalFinanceProfile.fromJson(
      jsonDecode(raw) as Map<String, dynamic>,
    );
  }

  Future<void> save(LocalFinanceProfile profile) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_profileKey, jsonEncode(profile.toJson()));
  }

  Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_profileKey);
  }
}
