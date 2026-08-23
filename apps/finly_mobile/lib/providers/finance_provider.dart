import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/transaction.dart';
import '../services/local_storage_service.dart';
import 'auth_provider.dart';

final localStorageProvider = Provider<LocalStorageService>((ref) {
  return LocalStorageService();
});

class FinanceData {
  final List<TransactionLine> transactions;
  final double initialBalance;
  final bool isLoading;
  final String? error;

  const FinanceData({
    this.transactions = const [],
    this.initialBalance = 0,
    this.isLoading = false,
    this.error,
  });

  /// Saldo atual = saldo inicial + occurrences PAGAS. Occurrences pendentes
  /// (mesmo vencidas) nunca entram — invariante da seção 10 do CLAUDE.md.
  double get currentBalance {
    var balance = initialBalance;
    for (final line in transactions) {
      if (!line.isPaid) continue;
      balance += line.type == TransactionType.income ? line.amount : -line.amount;
    }
    return balance;
  }

  double get totalIncome => _sumPaid(TransactionType.income);
  double get totalExpense => _sumPaid(TransactionType.expense);

  double _sumPaid(TransactionType type) {
    var total = 0.0;
    for (final line in transactions) {
      if (line.isPaid && line.type == type) total += line.amount;
    }
    return total;
  }

  FinanceData copyWith({
    List<TransactionLine>? transactions,
    double? initialBalance,
    bool? isLoading,
    String? error,
    bool clearError = false,
  }) {
    return FinanceData(
      transactions: transactions ?? this.transactions,
      initialBalance: initialBalance ?? this.initialBalance,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

/// Hook unificado — decide a origem dos dados internamente. A UI consome
/// sempre a mesma coisa, sem saber se veio do SharedPreferences ou da API.
/// Ver regra absoluta na seção 2 do CLAUDE.md.
class FinanceNotifier extends StateNotifier<FinanceData> {
  FinanceNotifier(this._ref) : super(const FinanceData(isLoading: true)) {
    load();
  }

  final Ref _ref;

  FinanceSource get _source => _ref.read(authProvider).source;

  Future<void> load() async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      if (_source == FinanceSource.local) {
        await _loadLocal();
      } else {
        await _loadApi();
      }
    } catch (error) {
      state = state.copyWith(
        isLoading: false,
        error: 'Não foi possível carregar seus lançamentos.',
      );
    }
  }

  Future<void> _loadLocal() async {
    final profile = await _ref.read(localStorageProvider).load();
    state = FinanceData(
      transactions: profile.transactions,
      initialBalance: profile.initialBalance,
    );
  }

  Future<void> _loadApi() async {
    final client = _ref.read(apiClientProvider);
    final response =
        await client.dio.get<List<dynamic>>('/api/transactions');

    final lines = <TransactionLine>[];
    for (final raw in response.data ?? []) {
      lines.addAll(TransactionLine.flattenFromApi(raw as Map<String, dynamic>));
    }

    final dashboard =
        await client.dio.get<Map<String, dynamic>>('/api/dashboard');
    final initialBalance =
        (dashboard.data?['initialBalance'] as num?)?.toDouble() ?? 0;

    state = FinanceData(transactions: lines, initialBalance: initialBalance);
  }
}

final financeProvider =
    StateNotifierProvider<FinanceNotifier, FinanceData>((ref) {
  ref.watch(authProvider.select((auth) => auth.source));
  return FinanceNotifier(ref);
});
