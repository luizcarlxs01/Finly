import 'enums.dart';

double _toDouble(dynamic v) => (v as num?)?.toDouble() ?? 0;
int? _toInt(dynamic v) => v == null ? null : (v as num).toInt();

/// Ocorrência real de uma Transaction — espelha OccurrenceResponseDto
/// (apps/api/.../Occurrences/OccurrenceResponseDto.cs) e ApiOccurrence do web.
class Occurrence {
  Occurrence({
    required this.id,
    required this.transactionId,
    required this.installmentIndex,
    required this.dueDate,
    required this.amount,
    required this.status,
    required this.paidAt,
    required this.isCustomized,
  });

  final String id;
  final String transactionId;
  final int? installmentIndex;

  /// "YYYY-MM-DD" (DateOnly no backend).
  final String dueDate;
  final double amount;
  final OccurrenceStatus status;
  final DateTime? paidAt;
  final bool isCustomized;

  factory Occurrence.fromJson(Map<String, dynamic> json) => Occurrence(
        id: json['id'] as String,
        transactionId: json['transactionId'] as String,
        installmentIndex: _toInt(json['installmentIndex']),
        dueDate: (json['dueDate'] as String).split('T').first,
        amount: _toDouble(json['amount']),
        status: OccurrenceStatus.fromApi(json['status'] as String? ?? 'Pending'),
        paidAt: json['paidAt'] == null
            ? null
            : DateTime.tryParse(json['paidAt'] as String),
        isCustomized: json['isCustomized'] as bool? ?? false,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'transactionId': transactionId,
        'installmentIndex': installmentIndex,
        'dueDate': dueDate,
        'amount': amount,
        'status': switch (status) {
          OccurrenceStatus.paid => 'Paid',
          OccurrenceStatus.cancelled => 'Cancelled',
          OccurrenceStatus.pending => 'Pending',
        },
        'paidAt': paidAt?.toIso8601String(),
        'isCustomized': isCustomized,
      };

  Occurrence copyWith({
    String? dueDate,
    double? amount,
    OccurrenceStatus? status,
    DateTime? paidAt,
    bool clearPaidAt = false,
    bool? isCustomized,
  }) =>
      Occurrence(
        id: id,
        transactionId: transactionId,
        installmentIndex: installmentIndex,
        dueDate: dueDate ?? this.dueDate,
        amount: amount ?? this.amount,
        status: status ?? this.status,
        paidAt: clearPaidAt ? null : (paidAt ?? this.paidAt),
        isCustomized: isCustomized ?? this.isCustomized,
      );
}

/// O "contrato" — espelha TransactionResponseDto (com Occurrences embutidas).
/// Guardado cru para montar o payload de PUT sem perder SourceId / datas do
/// contrato (mesma razão do `apiContractTransactions` no web —
/// use-update-transaction.ts).
class TransactionContract {
  TransactionContract({
    required this.id,
    required this.financialProfileId,
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
    required this.occurrences,
  });

  final String id;
  final String financialProfileId;
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
  final List<Occurrence> occurrences;

  factory TransactionContract.fromJson(Map<String, dynamic> json) {
    final rawOccurrences = (json['occurrences'] as List<dynamic>? ?? [])
        .map((e) => Occurrence.fromJson(e as Map<String, dynamic>))
        .toList();
    return TransactionContract(
      id: json['id'] as String,
      financialProfileId: json['financialProfileId'] as String? ?? '',
      title: json['title'] as String? ?? '',
      amount: _toDouble(json['amount']),
      type: TransactionType.fromApi(json['type'] as String? ?? 'Expense'),
      category: (json['category'] as String? ?? 'geral').toLowerCase(),
      kind: ContractKind.fromApi(json['transactionKind'] as String? ?? 'Single'),
      transactionDate:
          (json['transactionDate'] as String? ?? '').split('T').first,
      sourceId: json['sourceId'] as String?,
      installmentCount: _toInt(json['installmentCount']),
      isRecurring: json['isRecurring'] as bool? ?? false,
      recurrenceStartDate:
          (json['recurrenceStartDate'] as String?)?.split('T').first,
      recurrenceEndDate:
          (json['recurrenceEndDate'] as String?)?.split('T').first,
      recurrenceDay: _toInt(json['recurrenceDay']),
      recurrenceMonths: _toInt(json['recurrenceMonths']),
      createdAt:
          DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
      occurrences: rawOccurrences,
    );
  }

  /// Modo de recorrência inferido dos campos persistidos — inferContractRecurrenceMode.
  RecurrenceMode get inferredRecurrenceMode {
    if (recurrenceEndDate != null) return RecurrenceMode.untilDate;
    if (recurrenceMonths != null) return RecurrenceMode.forMonths;
    return RecurrenceMode.indefinite;
  }
}

/// Uma linha de UI — 1 por Occurrence. Espelha `Transaction` (achatada) do web
/// (flattenApiTransactionToLineItems). Ocorrências `Cancelled` **nunca** viram
/// LineItem (o backend já as filtra; replicamos a garantia aqui).
class LineItem {
  LineItem({
    required this.occurrenceId,
    required this.contractId,
    required this.title,
    required this.amount,
    required this.type,
    required this.category,
    required this.displayKind,
    required this.dueDate,
    required this.installmentIndex,
    required this.installmentCount,
    required this.status,
    required this.isCustomized,
    required this.contract,
  });

  final String occurrenceId;
  final String contractId;
  final String title;
  final double amount;
  final TransactionType type;
  final String category;
  final DisplayKind displayKind;

  /// "YYYY-MM-DD".
  final String dueDate;
  final int? installmentIndex;
  final int? installmentCount;
  final OccurrenceStatus status;
  final bool isCustomized;

  /// Contrato de origem — necessário para editar a série inteira.
  final TransactionContract contract;

  bool get isPaid => status.isPaid;

  DateTime? get dueDateTime => DateTime.tryParse(dueDate);

  static List<LineItem> flatten(TransactionContract contract) {
    final displayKind = DisplayKind.fromContract(contract.kind);
    return contract.occurrences
        .where((o) => o.status != OccurrenceStatus.cancelled)
        .map(
          (o) => LineItem(
            occurrenceId: o.id,
            contractId: contract.id,
            title: contract.title,
            amount: o.amount,
            type: contract.type,
            category: contract.category,
            displayKind: displayKind,
            dueDate: o.dueDate,
            installmentIndex: o.installmentIndex,
            installmentCount: contract.installmentCount,
            status: o.status,
            isCustomized: o.isCustomized,
            contract: contract,
          ),
        )
        .toList();
  }
}
