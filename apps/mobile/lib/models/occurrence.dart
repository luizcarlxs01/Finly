/// Status de uma Occurrence — nunca "Cancelled" no lado local/normalizado
/// (occurrences canceladas já vêm filtradas do backend, mesma regra do web).
enum OccurrenceStatus { pending, paid }

OccurrenceStatus occurrenceStatusFromApi(String raw) {
  switch (raw.toLowerCase()) {
    case 'paid':
      return OccurrenceStatus.paid;
    default:
      return OccurrenceStatus.pending;
  }
}

String occurrenceStatusToApi(OccurrenceStatus status) {
  return status == OccurrenceStatus.paid ? 'Paid' : 'Pending';
}

/// Espelha Finly.Domain/Entities/Occurrence.cs e apps/web types/occurrence.ts.
/// Ver CLAUDE.md seção 21 — arquitetura Transaction + Occurrence.
class Occurrence {
  final String id;
  final String transactionId;
  final int? installmentIndex;
  final String dueDate;
  final double amount;
  final OccurrenceStatus status;
  final String? paidAt;
  final bool isCustomized;
  final String createdAt;

  const Occurrence({
    required this.id,
    required this.transactionId,
    required this.installmentIndex,
    required this.dueDate,
    required this.amount,
    required this.status,
    required this.paidAt,
    required this.isCustomized,
    required this.createdAt,
  });

  factory Occurrence.fromJson(Map<String, dynamic> json) {
    return Occurrence(
      id: json['id'] as String,
      transactionId: json['transactionId'] as String,
      installmentIndex: json['installmentIndex'] as int?,
      dueDate: json['dueDate'] as String,
      amount: (json['amount'] as num).toDouble(),
      status: occurrenceStatusFromApi(json['status'] as String),
      paidAt: json['paidAt'] as String?,
      isCustomized: json['isCustomized'] as bool? ?? false,
      createdAt: json['createdAt'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'transactionId': transactionId,
      'installmentIndex': installmentIndex,
      'dueDate': dueDate,
      'amount': amount,
      'status': occurrenceStatusToApi(status),
      'paidAt': paidAt,
      'isCustomized': isCustomized,
      'createdAt': createdAt,
    };
  }

  Occurrence copyWith({
    String? dueDate,
    double? amount,
    OccurrenceStatus? status,
    String? paidAt,
    bool? isCustomized,
  }) {
    return Occurrence(
      id: id,
      transactionId: transactionId,
      installmentIndex: installmentIndex,
      dueDate: dueDate ?? this.dueDate,
      amount: amount ?? this.amount,
      status: status ?? this.status,
      paidAt: paidAt ?? this.paidAt,
      isCustomized: isCustomized ?? this.isCustomized,
      createdAt: createdAt,
    );
  }
}
