import '../../../shared/models/enums.dart';
import 'transaction_form_input.dart';

/// Réplica em Dart de apps/web/src/utils/occurrence-generation.ts
/// (`generateOccurrences`), que por sua vez replica
/// Finly.Application/Services/OccurrenceGenerationService.cs.
///
/// Usada pelo preview de "Simular impacto" (não persiste) **e** pelo modo sem
/// conta (LocalFinanceStore persiste o resultado de verdade). Single = 1
/// ocorrência; Installment = N mensais; Recurring = até a condição de parada
/// (até-data / por-meses / 12 meses se indefinido). Status Paid/Pending decidido
/// por `dueDate <= hoje`, igual ao backend.
class GeneratedOccurrence {
  GeneratedOccurrence({
    required this.dueDate,
    required this.amount,
    required this.installmentIndex,
    required this.paid,
  });

  final DateTime dueDate;
  final double amount;
  final int? installmentIndex;
  final bool paid;
}

DateTime _monthlyOccurrence(DateTime anchor, int dayOfMonth, int monthOffset) {
  final totalMonths = anchor.month - 1 + monthOffset;
  final year = anchor.year + (totalMonths / 12).floor();
  final monthIndex = totalMonths % 12;
  final lastDay = DateTime(year, monthIndex + 2, 0).day;
  final day = dayOfMonth < lastDay ? dayOfMonth : lastDay;
  return DateTime(year, monthIndex + 1, day, 12);
}

List<GeneratedOccurrence> generateOccurrences(TransactionFormInput input) {
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day, 12);

  GeneratedOccurrence build(DateTime dueDate, int? index) => GeneratedOccurrence(
        dueDate: dueDate,
        amount: input.amount,
        installmentIndex: index,
        paid: !dueDate.isAfter(today),
      );

  switch (input.kind) {
    case ContractKind.installment:
      final start = DateTime.tryParse(input.installmentStartDate);
      final count = input.installmentCount ?? 0;
      if (start == null || count < 1) return const [];
      return [
        for (var i = 0; i < count; i++)
          build(_monthlyOccurrence(start, start.day, i), i + 1),
      ];

    case ContractKind.recurring:
      final start = DateTime.tryParse(input.recurrenceStartDate);
      if (start == null) return const [];
      final day = input.recurrenceDay ?? start.day;
      final end = input.recurrenceEndDate == null
          ? null
          : DateTime.tryParse(input.recurrenceEndDate!);
      final result = <GeneratedOccurrence>[];
      var offset = 0;
      while (true) {
        final due = _monthlyOccurrence(start, day, offset);
        if (input.recurrenceMode == RecurrenceMode.untilDate) {
          if (end != null && due.isAfter(end)) break;
        } else if (input.recurrenceMode == RecurrenceMode.forMonths) {
          if (offset >= (input.recurrenceMonths ?? 0)) break;
        } else if (offset >= 12) {
          break;
        }
        result.add(build(due, offset + 1));
        offset += 1;
      }
      return result;

    case ContractKind.single:
      final date = DateTime.tryParse(input.transactionDate) ?? today;
      return [build(date, null)];
  }
}

/// Réplica de `generateOccurrenceExtension` (occurrence-generation.ts) — gera
/// ocorrências adicionais para uma recorrência indefinida cujo horizonte está
/// se esgotando. Espelha `TransactionService.ExtendIndefiniteRecurrencesIfNeeded`
/// do backend. Usada só no modo sem conta ao carregar (ver LocalFinanceStore).
List<GeneratedOccurrence> generateOccurrenceExtension({
  required int recurrenceDay,
  required double amount,
  required int nextInstallmentIndex,

  /// Primeira DueDate a gerar (mês seguinte ao último existente), "YYYY-MM-DD".
  required DateTime fromDate,

  /// Até quando gerar (hoje + 12 meses).
  required DateTime horizonEnd,
}) {
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day, 12);

  final result = <GeneratedOccurrence>[];
  var index = nextInstallmentIndex;
  var offset = 0;
  while (true) {
    final due = _monthlyOccurrence(fromDate, recurrenceDay, offset);
    if (due.isAfter(horizonEnd)) break;
    result.add(GeneratedOccurrence(
      dueDate: due,
      amount: amount,
      installmentIndex: index,
      paid: !due.isAfter(today),
    ));
    index += 1;
    offset += 1;
  }
  return result;
}

/// Impacto no saldo atual (apenas as ocorrências que nasceriam **pagas**) —
/// o mesmo que o web mostra no card de simulação.
double simulationPaidDelta(TransactionFormInput input) {
  final signed = input.type == TransactionType.income ? 1 : -1;
  return generateOccurrences(input)
      .where((o) => o.paid)
      .fold<double>(0, (sum, o) => sum + signed * o.amount);
}
