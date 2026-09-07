import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

import '../../../shared/models/enums.dart';
import '../../../shared/models/transaction.dart';
import 'occurrence_generation.dart';
import 'transaction_form_input.dart';

const _uuid = Uuid();

String _fmt(DateTime d) =>
    '${d.year.toString().padLeft(4, '0')}-'
    '${d.month.toString().padLeft(2, '0')}-'
    '${d.day.toString().padLeft(2, '0')}';

/// O "contrato" no modo sem conta — espelha `LocalTransactionContract`
/// (apps/web/src/types/local-finance-profile.ts): sem `financialProfileId` nem
/// `occurrences` embutidas. As Occurrences vivem à parte em
/// [LocalFinanceProfile.occurrences] e são unidas sob demanda.
class LocalContract {
  LocalContract({
    required this.id,
    required this.title,
    required this.amount,
    required this.type,
    required this.category,
    required this.kind,
    required this.transactionDate,
    required this.sourceId,
    required this.installmentCount,
    required this.isRecurring,
    required this.recurrenceStartDate,
    required this.recurrenceEndDate,
    required this.recurrenceDay,
    required this.recurrenceMonths,
    required this.createdAt,
  });

  final String id;
  final String title;
  final double amount;
  final TransactionType type;
  final String category;
  final ContractKind kind;
  final String transactionDate;
  final String? sourceId;
  final int? installmentCount;
  final bool isRecurring;
  final String? recurrenceStartDate;
  final String? recurrenceEndDate;
  final int? recurrenceDay;
  final int? recurrenceMonths;
  final DateTime createdAt;

  factory LocalContract.fromJson(Map<String, dynamic> json) => LocalContract(
        id: json['id'] as String,
        title: json['title'] as String? ?? '',
        amount: (json['amount'] as num?)?.toDouble() ?? 0,
        type: TransactionType.fromApi(json['type'] as String? ?? 'Expense'),
        category: (json['category'] as String? ?? 'geral').toLowerCase(),
        kind: ContractKind.fromApi(json['transactionKind'] as String? ?? 'Single'),
        transactionDate:
            (json['transactionDate'] as String? ?? '').split('T').first,
        sourceId: json['sourceId'] as String?,
        installmentCount: (json['installmentCount'] as num?)?.toInt(),
        isRecurring: json['isRecurring'] as bool? ?? false,
        recurrenceStartDate:
            (json['recurrenceStartDate'] as String?)?.split('T').first,
        recurrenceEndDate:
            (json['recurrenceEndDate'] as String?)?.split('T').first,
        recurrenceDay: (json['recurrenceDay'] as num?)?.toInt(),
        recurrenceMonths: (json['recurrenceMonths'] as num?)?.toInt(),
        createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ??
            DateTime.now(),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'amount': amount,
        'type': type.apiValue,
        'category': category,
        'transactionKind': kind.apiValue,
        'transactionDate': transactionDate,
        'sourceId': sourceId,
        'installmentCount': installmentCount,
        'isRecurring': isRecurring,
        'recurrenceStartDate': recurrenceStartDate,
        'recurrenceEndDate': recurrenceEndDate,
        'recurrenceDay': recurrenceDay,
        'recurrenceMonths': recurrenceMonths,
        'createdAt': createdAt.toIso8601String(),
      };

  /// Contrato + Occurrences (não canceladas nem) → mesma estrutura da API, pra
  /// alimentar `LineItem.flatten` idêntico ao modo API.
  TransactionContract toContract(List<Occurrence> occurrences) =>
      TransactionContract(
        id: id,
        financialProfileId: '',
        title: title,
        amount: amount,
        type: type,
        category: category,
        kind: kind,
        transactionDate: transactionDate,
        sourceId: sourceId,
        installmentCount: installmentCount,
        isRecurring: isRecurring,
        recurrenceStartDate: recurrenceStartDate,
        recurrenceEndDate: recurrenceEndDate,
        recurrenceDay: recurrenceDay,
        recurrenceMonths: recurrenceMonths,
        createdAt: createdAt,
        occurrences: occurrences,
      );
}

/// Espelha `LocalFinanceProfile` do web (schema com `occurrences` à parte).
class LocalFinanceProfile {
  LocalFinanceProfile({
    required this.initialBalance,
    required this.contracts,
    required this.occurrences,
  });

  final double initialBalance;
  final List<LocalContract> contracts;
  final List<Occurrence> occurrences;

  static LocalFinanceProfile get empty =>
      LocalFinanceProfile(initialBalance: 0, contracts: const [], occurrences: const []);

  LocalFinanceProfile copyWith({
    double? initialBalance,
    List<LocalContract>? contracts,
    List<Occurrence>? occurrences,
  }) =>
      LocalFinanceProfile(
        initialBalance: initialBalance ?? this.initialBalance,
        contracts: contracts ?? this.contracts,
        occurrences: occurrences ?? this.occurrences,
      );

  factory LocalFinanceProfile.fromJson(Map<String, dynamic> json) =>
      LocalFinanceProfile(
        initialBalance: (json['initialBalance'] as num?)?.toDouble() ?? 0,
        contracts: (json['transactions'] as List<dynamic>? ?? [])
            .map((e) => LocalContract.fromJson(e as Map<String, dynamic>))
            .toList(),
        occurrences: (json['occurrences'] as List<dynamic>? ?? [])
            .map((e) => Occurrence.fromJson(e as Map<String, dynamic>))
            .toList(),
      );

  Map<String, dynamic> toJson() => {
        'initialBalance': initialBalance,
        'transactions': contracts.map((c) => c.toJson()).toList(),
        'occurrences': occurrences.map((o) => o.toJson()).toList(),
      };

  List<TransactionContract> toContracts() => contracts
      .map((c) => c.toContract(
          occurrences.where((o) => o.transactionId == c.id).toList()))
      .toList();
}

/// Espelha apps/web/src/hooks/use-local-finance.ts — finanças no
/// `shared_preferences` (equivalente ao `localStorage`). `addTransaction` /
/// `updateContract` geram e sincronizam Occurrences reais pela mesma
/// `generateOccurrences`; `updateContract` replica o fix do Bug 1 da Fase C
/// (Single propaga amount/dueDate pra sua única Occurrence). `cancelOccurrence`
/// é soft-delete (status Cancelled), igual ao backend.
class LocalFinanceStore extends AsyncNotifier<LocalFinanceProfile> {
  static const _key = 'finly.local-finance';

  @override
  Future<LocalFinanceProfile> build() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw == null || raw.isEmpty) return LocalFinanceProfile.empty;
    try {
      final stored = LocalFinanceProfile.fromJson(
        jsonDecode(raw) as Map<String, dynamic>,
      );
      final extended = _extendIndefiniteRecurrences(stored);
      if (extended.occurrences.length != stored.occurrences.length) {
        await prefs.setString(_key, jsonEncode(extended.toJson()));
      }
      return extended;
    } catch (_) {
      return LocalFinanceProfile.empty;
    }
  }

  LocalFinanceProfile get _p => state.valueOrNull ?? LocalFinanceProfile.empty;

  Future<void> _save(LocalFinanceProfile next) async {
    state = AsyncData(next);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, jsonEncode(next.toJson()));
  }

  Future<void> updateInitialBalance(double value) =>
      _save(_p.copyWith(initialBalance: value));

  Future<void> addTransaction(TransactionFormInput input) async {
    if (!input.isValid) return;
    final contractId = _uuid.v4();
    final createdAt = DateTime.tryParse(input.anchorDate) ?? DateTime.now();
    final contract = _contractFrom(contractId, input, createdAt);
    final now = DateTime.now();
    final occ = generateOccurrences(input)
        .map((g) => Occurrence(
              id: _uuid.v4(),
              transactionId: contractId,
              installmentIndex: g.installmentIndex,
              dueDate: _fmt(g.dueDate),
              amount: g.amount,
              status:
                  g.paid ? OccurrenceStatus.paid : OccurrenceStatus.pending,
              paidAt: g.paid ? now : null,
              isCustomized: false,
            ))
        .toList();

    await _save(_p.copyWith(
      contracts: [contract, ..._p.contracts],
      occurrences: [..._p.occurrences, ...occ],
    ));
  }

  Future<void> updateContract(
    TransactionContract contract,
    TransactionFormInput input,
  ) async {
    final p = _p;
    final idx = p.contracts.indexWhere((c) => c.id == contract.id);
    if (idx < 0) return;

    final updated = _contractFrom(
      contract.id,
      input,
      p.contracts[idx].createdAt,
      sourceId: p.contracts[idx].sourceId,
      fallbackInstallmentCount: p.contracts[idx].installmentCount,
    );

    final contracts = [...p.contracts]..[idx] = updated;

    // Bug 1 da Fase C: quando o kind resolvido é Single, propaga amount/dueDate
    // para a única Occurrence.
    final occurrences = input.kind == ContractKind.single
        ? p.occurrences
            .map((o) => o.transactionId == contract.id
                ? o.copyWith(amount: input.amount, dueDate: input.anchorDate)
                : o)
            .toList()
        : p.occurrences;

    await _save(p.copyWith(contracts: contracts, occurrences: occurrences));
  }

  Future<void> deleteContract(String contractId) async {
    final p = _p;
    await _save(p.copyWith(
      contracts: p.contracts.where((c) => c.id != contractId).toList(),
      occurrences:
          p.occurrences.where((o) => o.transactionId != contractId).toList(),
    ));
  }

  Future<void> updateOccurrence(
    String occurrenceId, {
    required String dueDate,
    required double amount,
  }) async {
    await _save(_p.copyWith(
      occurrences: _p.occurrences
          .map((o) => o.id == occurrenceId
              ? o.copyWith(
                  amount: amount, dueDate: dueDate, isCustomized: true)
              : o)
          .toList(),
    ));
  }

  Future<void> markPaid(String occurrenceId) => _save(_p.copyWith(
        occurrences: _p.occurrences
            .map((o) => o.id == occurrenceId
                ? o.copyWith(
                    status: OccurrenceStatus.paid, paidAt: DateTime.now())
                : o)
            .toList(),
      ));

  Future<void> markPending(String occurrenceId) => _save(_p.copyWith(
        occurrences: _p.occurrences
            .map((o) => o.id == occurrenceId
                ? o.copyWith(
                    status: OccurrenceStatus.pending, clearPaidAt: true)
                : o)
            .toList(),
      ));

  Future<void> cancelOccurrence(String occurrenceId) => _save(_p.copyWith(
        occurrences: _p.occurrences
            .map((o) => o.id == occurrenceId
                ? o.copyWith(status: OccurrenceStatus.cancelled)
                : o)
            .toList(),
      ));

  LocalContract _contractFrom(
    String id,
    TransactionFormInput input,
    DateTime createdAt, {
    String? sourceId,
    int? fallbackInstallmentCount,
  }) {
    final recurring = input.kind == ContractKind.recurring;
    return LocalContract(
      id: id,
      title: input.title.trim(),
      amount: input.amount,
      type: input.type,
      category: input.category.trim().toLowerCase(),
      kind: input.kind,
      transactionDate: input.anchorDate,
      sourceId: sourceId,
      installmentCount: input.kind == ContractKind.installment
          ? (input.installmentCount ?? fallbackInstallmentCount)
          : null,
      isRecurring: recurring,
      recurrenceStartDate: recurring ? input.recurrenceStartDate : null,
      recurrenceEndDate:
          recurring && input.recurrenceMode == RecurrenceMode.untilDate
              ? input.recurrenceEndDate
              : null,
      recurrenceDay: recurring ? input.recurrenceDay : null,
      recurrenceMonths:
          recurring && input.recurrenceMode == RecurrenceMode.forMonths
              ? input.recurrenceMonths
              : null,
      createdAt: createdAt,
    );
  }

  /// Espelha `extendIndefiniteRecurrencesIfNeeded` de use-local-finance.ts.
  LocalFinanceProfile _extendIndefiniteRecurrences(LocalFinanceProfile p) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day, 12);
    final threshold = DateTime(today.year, today.month + 6, today.day, 12);
    final horizonEnd = DateTime(today.year, today.month + 12, today.day, 12);

    final indefinite = p.contracts.where((c) =>
        c.kind == ContractKind.recurring &&
        c.recurrenceStartDate != null &&
        c.recurrenceEndDate == null &&
        c.recurrenceMonths == null);
    if (indefinite.isEmpty) return p;

    final added = <Occurrence>[];
    for (final c in indefinite) {
      final active = p.occurrences
          .where((o) =>
              o.transactionId == c.id &&
              o.status != OccurrenceStatus.cancelled)
          .toList();
      if (active.isEmpty) continue;

      final maxDue = active
          .map((o) => o.dueDate)
          .reduce((a, b) => a.compareTo(b) >= 0 ? a : b);
      final maxDueDate = DateTime.tryParse(maxDue);
      if (maxDueDate == null) continue;
      if (!maxDueDate.isBefore(threshold)) continue;

      final indexed = active.where((o) => o.installmentIndex != null);
      final maxIndex = indexed.isEmpty
          ? 0
          : indexed.map((o) => o.installmentIndex!).reduce((a, b) => a > b ? a : b);
      final existing =
          indexed.map((o) => o.installmentIndex!).toSet();

      final fromDate =
          DateTime(maxDueDate.year, maxDueDate.month + 1, maxDueDate.day, 12);
      final recurrenceDay = c.recurrenceDay ?? fromDate.day;
      final ts = DateTime.now();

      for (final g in generateOccurrenceExtension(
        recurrenceDay: recurrenceDay,
        amount: c.amount,
        nextInstallmentIndex: maxIndex + 1,
        fromDate: fromDate,
        horizonEnd: horizonEnd,
      )) {
        if (g.installmentIndex != null &&
            existing.contains(g.installmentIndex)) {
          continue;
        }
        added.add(Occurrence(
          id: _uuid.v4(),
          transactionId: c.id,
          installmentIndex: g.installmentIndex,
          dueDate: _fmt(g.dueDate),
          amount: g.amount,
          status: g.paid ? OccurrenceStatus.paid : OccurrenceStatus.pending,
          paidAt: g.paid ? ts : null,
          isCustomized: false,
        ));
      }
    }

    if (added.isEmpty) return p;
    return p.copyWith(occurrences: [...p.occurrences, ...added]);
  }
}

final localFinanceStoreProvider =
    AsyncNotifierProvider<LocalFinanceStore, LocalFinanceProfile>(
        LocalFinanceStore.new);
