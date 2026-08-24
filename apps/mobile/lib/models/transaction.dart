import 'occurrence.dart';

enum TransactionType { income, expense }

/// A API devolve "Income"/"Expense" (PascalCase); o modo local grava em
/// minúsculo. Precisa normalizar como o web faz em flatten-transaction.ts —
/// sem isso, toda entrada vinda da API era lida como saída (invertia o
/// sinal no saldo).
TransactionType transactionTypeFromString(String raw) {
  return raw.trim().toLowerCase() == 'income'
      ? TransactionType.income
      : TransactionType.expense;
}

String transactionTypeToString(TransactionType type) {
  return type == TransactionType.income ? 'income' : 'expense';
}

/// Espelha Finly.Domain/Enums/TransactionKind.cs (valores atuais — os
/// deprecated installment-instance/recurring-instance não são mais
/// produzidos, ver CLAUDE.md seção 21).
enum TransactionKind { single, installment, recurring }

TransactionKind transactionKindFromString(String raw) {
  switch (raw) {
    case 'installment-template':
    case 'installment-instance':
    case 'Installment':
      return TransactionKind.installment;
    case 'recurring-template':
    case 'recurring-instance':
    case 'Recurring':
      return TransactionKind.recurring;
    default:
      return TransactionKind.single;
  }
}

enum RecurrenceMode { indefinite, untilDate, forMonths }

RecurrenceMode? recurrenceModeFromString(String? raw) {
  switch (raw) {
    case 'indefinite':
    case 'Indefinite':
      return RecurrenceMode.indefinite;
    case 'until-date':
    case 'UntilDate':
      return RecurrenceMode.untilDate;
    case 'for-months':
    case 'ForMonths':
      return RecurrenceMode.forMonths;
    default:
      return null;
  }
}

/// Contrato de uma transação — 1 Transaction pode gerar N Occurrences
/// (parcelamento/recorrência). Ver CLAUDE.md seção 21.
///
/// Esta classe já vem "achatada": cada instância representa 1 linha de UI
/// (1 Occurrence), replicando utils/flatten-transaction.ts do web. Isso
/// simplifica a UI, que nunca precisa saber se está olhando pro contrato
/// ou pra ocorrência.
class TransactionLine {
  final String id;
  final String transactionId;
  final String title;
  final double amount;
  final TransactionType type;
  final String category;
  final TransactionKind transactionKind;
  final String occurrenceId;
  final String occurrenceDate;
  final OccurrenceStatus occurrenceStatus;
  final int? installmentIndex;
  final int? installmentCount;
  final bool isCustomized;
  final RecurrenceMode? recurrenceMode;
  final int? recurrenceDay;
  final String createdAt;

  const TransactionLine({
    required this.id,
    required this.transactionId,
    required this.title,
    required this.amount,
    required this.type,
    required this.category,
    required this.transactionKind,
    required this.occurrenceId,
    required this.occurrenceDate,
    required this.occurrenceStatus,
    required this.installmentIndex,
    required this.installmentCount,
    required this.isCustomized,
    required this.recurrenceMode,
    required this.recurrenceDay,
    required this.createdAt,
  });

  bool get isPaid => occurrenceStatus == OccurrenceStatus.paid;

  /// Achata uma ApiTransaction (contrato + occurrences) em N TransactionLine,
  /// uma por Occurrence — mesma lógica de utils/flatten-transaction.ts.
  static List<TransactionLine> flattenFromApi(Map<String, dynamic> json) {
    final occurrencesRaw = json['occurrences'] as List<dynamic>? ?? [];
    final kind = transactionKindFromString(json['transactionKind'] as String);

    return occurrencesRaw.map((rawOccurrence) {
      final occurrence = Occurrence.fromJson(
        rawOccurrence as Map<String, dynamic>,
      );

      return TransactionLine(
        id: '${json['id']}_${occurrence.id}',
        transactionId: json['id'] as String,
        title: json['title'] as String,
        amount: occurrence.amount,
        type: transactionTypeFromString(json['type'] as String),
        category: json['category'] as String,
        transactionKind: kind,
        occurrenceId: occurrence.id,
        occurrenceDate: occurrence.dueDate,
        occurrenceStatus: occurrence.status,
        installmentIndex: occurrence.installmentIndex,
        installmentCount: json['installmentCount'] as int?,
        isCustomized: occurrence.isCustomized,
        recurrenceMode: null,
        recurrenceDay: json['recurrenceDay'] as int?,
        createdAt: json['createdAt'] as String,
      );
    }).toList();
  }

  factory TransactionLine.fromLocalJson(Map<String, dynamic> json) {
    return TransactionLine(
      id: json['id'] as String,
      transactionId: json['transactionId'] as String,
      title: json['title'] as String,
      amount: (json['amount'] as num).toDouble(),
      type: transactionTypeFromString(json['type'] as String),
      category: json['category'] as String,
      transactionKind:
          transactionKindFromString(json['transactionKind'] as String),
      occurrenceId: json['occurrenceId'] as String,
      occurrenceDate: json['occurrenceDate'] as String,
      occurrenceStatus:
          occurrenceStatusFromApi(json['occurrenceStatus'] as String),
      installmentIndex: json['installmentIndex'] as int?,
      installmentCount: json['installmentCount'] as int?,
      isCustomized: json['isCustomized'] as bool? ?? false,
      recurrenceMode: recurrenceModeFromString(
        json['recurrenceMode'] as String?,
      ),
      recurrenceDay: json['recurrenceDay'] as int?,
      createdAt: json['createdAt'] as String,
    );
  }

  Map<String, dynamic> toLocalJson() {
    return {
      'id': id,
      'transactionId': transactionId,
      'title': title,
      'amount': amount,
      'type': transactionTypeToString(type),
      'category': category,
      'transactionKind': transactionKind.name,
      'occurrenceId': occurrenceId,
      'occurrenceDate': occurrenceDate,
      'occurrenceStatus': occurrenceStatusToApi(occurrenceStatus),
      'installmentIndex': installmentIndex,
      'installmentCount': installmentCount,
      'isCustomized': isCustomized,
      'recurrenceMode': recurrenceMode?.name,
      'recurrenceDay': recurrenceDay,
      'createdAt': createdAt,
    };
  }
}

/// Entrada do formulário de novo lançamento — mesmos campos de
/// LocalFinanceTransactionInput (apps/web/src/hooks/use-local-finance.ts),
/// consumida tanto pelo caminho local (gera occurrences na hora) quanto
/// pelo caminho API (vira CreateTransactionRequestDto).
class NewTransactionInput {
  final String title;
  final double amount;
  final TransactionType type;
  final String category;
  final TransactionKind kind;

  /// Único.
  final DateTime? transactionDate;

  /// Parcelado.
  final int? installmentCount;
  final DateTime? installmentStartDate;

  /// Recorrente.
  final int? recurrenceDay;
  final DateTime? recurrenceStartDate;
  final RecurrenceMode? recurrenceMode;
  final DateTime? recurrenceEndDate;
  final int? recurrenceMonths;

  const NewTransactionInput({
    required this.title,
    required this.amount,
    required this.type,
    required this.category,
    required this.kind,
    this.transactionDate,
    this.installmentCount,
    this.installmentStartDate,
    this.recurrenceDay,
    this.recurrenceStartDate,
    this.recurrenceMode,
    this.recurrenceEndDate,
    this.recurrenceMonths,
  });
}
