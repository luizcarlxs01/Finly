import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';

import '../models/transaction.dart';
import '../services/local_storage_service.dart';
import '../utils/formatters.dart';
import '../utils/occurrence_generation.dart';
import 'auth_provider.dart';
import 'profile_provider.dart';

const _uuid = Uuid();

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
    final profile = await _ref.read(primaryProfileProvider.future);

    if (profile == null) {
      throw Exception('Não foi possível identificar o perfil da conta.');
    }

    final response = await client.dio.get<List<dynamic>>(
      '/api/transactions',
      queryParameters: {'financialProfileId': profile.id},
    );

    final lines = <TransactionLine>[];
    for (final raw in response.data ?? []) {
      lines.addAll(TransactionLine.flattenFromApi(raw as Map<String, dynamic>));
    }

    state = FinanceData(transactions: lines, initialBalance: profile.initialBalance);
  }

  /// Cria um novo lançamento — decide local vs API internamente, igual ao
  /// resto do hook. UI nunca sabe qual caminho foi seguido.
  Future<void> createTransaction(NewTransactionInput input) {
    return _source == FinanceSource.local
        ? _createLocal(input)
        : _createApi(input);
  }

  Future<void> _createLocal(NewTransactionInput input) async {
    final storage = _ref.read(localStorageProvider);
    final profile = await storage.load();

    final generated = generateOccurrences(GenerateOccurrencesInput(
      kind: input.kind,
      amount: input.amount,
      transactionDate: input.transactionDate,
      installmentCount: input.installmentCount,
      installmentStartDate: input.installmentStartDate,
      recurrenceDay: input.recurrenceDay,
      recurrenceStartDate: input.recurrenceStartDate,
      recurrenceMode: input.recurrenceMode,
      recurrenceEndDate: input.recurrenceEndDate,
      recurrenceMonths: input.recurrenceMonths,
    ));

    if (generated.isEmpty) {
      throw Exception('Não foi possível gerar as ocorrências deste lançamento.');
    }

    final transactionId = _uuid.v4();
    final createdAt = DateTime.now().toUtc().toIso8601String();
    final isRecurring = input.kind == TransactionKind.recurring;

    final newLines = generated
        .map((occurrence) => TransactionLine(
              id: '${transactionId}_${_uuid.v4()}',
              transactionId: transactionId,
              title: input.title,
              amount: occurrence.amount,
              type: input.type,
              category: input.category,
              transactionKind: input.kind,
              occurrenceId: _uuid.v4(),
              occurrenceDate: occurrence.dueDate,
              occurrenceStatus: occurrence.status,
              installmentIndex: occurrence.installmentIndex,
              installmentCount: input.installmentCount,
              isCustomized: false,
              recurrenceMode:
                  isRecurring ? (input.recurrenceMode ?? RecurrenceMode.indefinite) : null,
              recurrenceDay: isRecurring ? input.recurrenceDay : null,
              createdAt: createdAt,
            ))
        .toList();

    final updatedTransactions = [...newLines, ...profile.transactions];
    await storage.save(profile.copyWith(transactions: updatedTransactions));

    state = state.copyWith(transactions: updatedTransactions);
  }

  Future<void> _createApi(NewTransactionInput input) async {
    final client = _ref.read(apiClientProvider);
    final profile = await _ref.read(primaryProfileProvider.future);

    if (profile == null) {
      throw Exception('Não foi possível identificar o perfil da conta.');
    }

    final isInstallment = input.kind == TransactionKind.installment;
    final isRecurring = input.kind == TransactionKind.recurring;

    final transactionDate = isInstallment
        ? input.installmentStartDate!
        : isRecurring
            ? input.recurrenceStartDate!
            : input.transactionDate!;

    await client.dio.post<Map<String, dynamic>>('/api/transactions', data: {
      'financialProfileId': profile.id,
      'title': input.title,
      'amount': input.amount,
      'type': input.type == TransactionType.income ? 'Income' : 'Expense',
      'category': input.category,
      'transactionKind': _backendKind(input.kind),
      'transactionDate': formatDateValue(transactionDate),
      'sourceId': null,
      'installmentIndex': null,
      'installmentCount': isInstallment ? input.installmentCount : null,
      'isRecurring': isRecurring,
      'recurrenceStartDate':
          isRecurring ? formatDateValue(input.recurrenceStartDate!) : null,
      'recurrenceEndDate':
          isRecurring && input.recurrenceMode == RecurrenceMode.untilDate
              ? formatDateValue(input.recurrenceEndDate!)
              : null,
      'recurrenceDay': isRecurring ? input.recurrenceDay : null,
      'recurrenceMonths':
          isRecurring && input.recurrenceMode == RecurrenceMode.forMonths
              ? input.recurrenceMonths
              : null,
    });

    await load();
  }

  String _backendKind(TransactionKind kind) {
    switch (kind) {
      case TransactionKind.installment:
        return 'Installment';
      case TransactionKind.recurring:
        return 'Recurring';
      case TransactionKind.single:
        return 'Single';
    }
  }
}

final financeProvider =
    StateNotifierProvider<FinanceNotifier, FinanceData>((ref) {
  ref.watch(authProvider.select((auth) => auth.source));
  return FinanceNotifier(ref);
});
