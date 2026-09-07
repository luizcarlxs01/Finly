import '../../../shared/models/enums.dart';
import '../../../shared/models/transaction.dart';

String _today() {
  final now = DateTime.now();
  return '${now.year.toString().padLeft(4, '0')}-'
      '${now.month.toString().padLeft(2, '0')}-'
      '${now.day.toString().padLeft(2, '0')}';
}

/// Entrada do formulário de transação — espelha `LocalFinanceTransactionInput`
/// do web + o estado local de transaction-form.tsx / transaction-edit-modal.tsx.
/// O `kind` aqui é sempre um dos 3 do formulário (single/installment/recurring);
/// a conversão para o vocabulário do contrato acontece no repositório.
class TransactionFormInput {
  TransactionFormInput({
    required this.title,
    required this.amount,
    required this.type,
    required this.category,
    required this.kind,
    String? transactionDate,
    this.installmentCount,
    String? installmentStartDate,
    this.recurrenceDay,
    String? recurrenceStartDate,
    this.recurrenceMode = RecurrenceMode.indefinite,
    this.recurrenceEndDate,
    this.recurrenceMonths,
  })  : transactionDate = transactionDate ?? _today(),
        installmentStartDate = installmentStartDate ?? _today(),
        recurrenceStartDate = recurrenceStartDate ?? _today();

  final String title;
  final double amount;
  final TransactionType type;
  final String category;
  final ContractKind kind;

  final String transactionDate;
  final int? installmentCount;
  final String installmentStartDate;
  final int? recurrenceDay;
  final String recurrenceStartDate;
  final RecurrenceMode recurrenceMode;
  final String? recurrenceEndDate;
  final int? recurrenceMonths;

  /// Estado inicial do editor a partir de um contrato existente — espelha o
  /// `useEffect` de reset de transaction-edit-modal.tsx.
  factory TransactionFormInput.fromContract(TransactionContract c) {
    return TransactionFormInput(
      title: c.title,
      amount: c.amount,
      type: c.type,
      category: c.category,
      kind: c.kind,
      transactionDate: c.transactionDate.isEmpty ? null : c.transactionDate,
      installmentCount: c.installmentCount,
      installmentStartDate:
          c.kind == ContractKind.installment ? c.transactionDate : null,
      recurrenceDay: c.recurrenceDay,
      recurrenceStartDate: c.recurrenceStartDate,
      recurrenceMode: c.inferredRecurrenceMode,
      recurrenceEndDate: c.recurrenceEndDate,
      recurrenceMonths: c.recurrenceMonths,
    );
  }

  bool get isRecurring => kind == ContractKind.recurring;

  /// Data-âncora do contrato — mesma precedência do web
  /// (installmentStartDate ?? recurrenceStartDate ?? transactionDate).
  String get anchorDate => switch (kind) {
        ContractKind.installment => installmentStartDate,
        ContractKind.recurring => recurrenceStartDate,
        ContractKind.single => transactionDate,
      };

  /// Validação equivalente a isValidTransactionInput + buildTransactionInput.
  bool get isValid {
    if (title.trim().isEmpty || amount <= 0 || category.trim().isEmpty) {
      return false;
    }
    if (kind == ContractKind.installment) {
      if ((installmentCount ?? 0) < 2) return false;
    }
    if (kind == ContractKind.recurring) {
      final day = recurrenceDay ?? 0;
      if (day < 1 || day > 31) return false;
      if (recurrenceMode == RecurrenceMode.untilDate) {
        final end = recurrenceEndDate;
        if (end == null || end.compareTo(recurrenceStartDate) < 0) return false;
      }
      if (recurrenceMode == RecurrenceMode.forMonths) {
        if ((recurrenceMonths ?? 0) < 1) return false;
      }
    }
    return true;
  }
}
