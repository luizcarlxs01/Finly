/// Vocabulário cru do backend (Finly.Domain/Enums) + os "display kinds" que o
/// web usa na UI depois de achatar o contrato em ocorrências
/// (apps/web/src/types/transaction.ts + utils/flatten-transaction.ts).

enum TransactionType {
  income,
  expense;

  String get apiValue => this == TransactionType.income ? 'Income' : 'Expense';

  static TransactionType fromApi(String value) =>
      value.trim().toLowerCase() == 'income'
          ? TransactionType.income
          : TransactionType.expense;

  bool get isIncome => this == TransactionType.income;
}

/// Kind do **contrato** (Transaction) no modelo novo — seção 21 do CLAUDE.md.
enum ContractKind {
  single,
  installment,
  recurring;

  String get apiValue => switch (this) {
        ContractKind.single => 'Single',
        ContractKind.installment => 'Installment',
        ContractKind.recurring => 'Recurring',
      };

  /// Cobre defensivamente os valores legados depreciados (mesmo check por
  /// substring do flatten-transaction.ts do web).
  static ContractKind fromApi(String value) {
    final v = value.trim().toLowerCase();
    if (v.contains('installment')) return ContractKind.installment;
    if (v.contains('recurring')) return ContractKind.recurring;
    return ContractKind.single;
  }
}

/// Kind exibido em cada **linha** de UI (1 por ocorrência).
enum DisplayKind {
  single,
  installmentInstance,
  recurringInstance;

  static DisplayKind fromContract(ContractKind kind) => switch (kind) {
        ContractKind.installment => DisplayKind.installmentInstance,
        ContractKind.recurring => DisplayKind.recurringInstance,
        ContractKind.single => DisplayKind.single,
      };

  bool get isGeneratedInstance => this != DisplayKind.single;
}

enum OccurrenceStatus {
  pending,
  paid,
  cancelled;

  static OccurrenceStatus fromApi(String value) => switch (value.trim().toLowerCase()) {
        'paid' => OccurrenceStatus.paid,
        'cancelled' => OccurrenceStatus.cancelled,
        _ => OccurrenceStatus.pending,
      };

  bool get isPaid => this == OccurrenceStatus.paid;
}

/// Modo de recorrência do formulário/edição — mesmos 3 valores do web.
enum RecurrenceMode {
  indefinite,
  untilDate,
  forMonths;

  String get apiValue => switch (this) {
        RecurrenceMode.indefinite => 'Indefinite',
        RecurrenceMode.untilDate => 'UntilDate',
        RecurrenceMode.forMonths => 'ForMonths',
      };
}
