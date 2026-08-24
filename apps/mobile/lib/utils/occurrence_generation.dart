import '../models/occurrence.dart';
import '../models/transaction.dart';
import 'formatters.dart' show formatDateValue;

/// Réplica em Dart de apps/web/src/utils/occurrence-generation.ts, que por
/// sua vez replica Finly.Application/Services/OccurrenceGenerationService.cs.
/// Fonte única de geração de occurrences no modo local do mobile — não
/// duplicar esta lógica. Ver CLAUDE.md seção 21.

class GeneratedOccurrence {
  final String dueDate;
  final double amount;
  final int? installmentIndex;
  final OccurrenceStatus status;

  const GeneratedOccurrence({
    required this.dueDate,
    required this.amount,
    required this.installmentIndex,
    required this.status,
  });
}

class GenerateOccurrencesInput {
  final TransactionKind kind;
  final double amount;
  final DateTime? transactionDate;
  final int? installmentCount;
  final DateTime? installmentStartDate;
  final int? recurrenceDay;
  final DateTime? recurrenceStartDate;
  final RecurrenceMode? recurrenceMode;
  final DateTime? recurrenceEndDate;
  final int? recurrenceMonths;

  const GenerateOccurrencesInput({
    required this.kind,
    required this.amount,
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

DateTime _dateOnly(DateTime date) => DateTime(date.year, date.month, date.day);

int _daysInMonth(int year, int month) {
  // Dart normaliza mês 13 → janeiro do ano seguinte e dia 0 → último dia do
  // mês anterior, exatamente como new Date(year, monthIndex + 1, 0) em JS.
  return DateTime(year, month + 1, 0).day;
}

/// Soma monthOffset meses ao anchor e devolve a data com o dia clampado ao
/// tamanho do mês de destino (equivalente a buildOccurrenceDate no web).
DateTime _monthlyOccurrenceDate(DateTime anchor, int dayOfMonth, int monthOffset) {
  final totalMonths = (anchor.month - 1) + monthOffset;
  final year = anchor.year + (totalMonths ~/ 12);
  final month = (totalMonths % 12) + 1;
  final clampedDay = dayOfMonth > _daysInMonth(year, month)
      ? _daysInMonth(year, month)
      : dayOfMonth;

  return DateTime(year, month, clampedDay);
}

List<GeneratedOccurrence> generateOccurrences(GenerateOccurrencesInput input) {
  final today = _dateOnly(DateTime.now());

  GeneratedOccurrence build(DateTime dueDate, int? installmentIndex) {
    return GeneratedOccurrence(
      dueDate: formatDateValue(dueDate),
      amount: input.amount,
      installmentIndex: installmentIndex,
      status: !dueDate.isAfter(today)
          ? OccurrenceStatus.paid
          : OccurrenceStatus.pending,
    );
  }

  if (input.kind == TransactionKind.installment) {
    final startDate = input.installmentStartDate;
    final count = input.installmentCount;

    if (startDate == null || count == null || count <= 0) return [];

    final dayOfMonth = startDate.day;
    final occurrences = <GeneratedOccurrence>[];

    for (var index = 0; index < count; index++) {
      final dueDate = _monthlyOccurrenceDate(startDate, dayOfMonth, index);
      occurrences.add(build(dueDate, index + 1));
    }

    return occurrences;
  }

  if (input.kind == TransactionKind.recurring) {
    final startDate = input.recurrenceStartDate;
    if (startDate == null) return [];

    final dayOfMonth = input.recurrenceDay ?? startDate.day;
    final mode = input.recurrenceMode ?? RecurrenceMode.indefinite;
    final endDate = input.recurrenceEndDate;
    final occurrences = <GeneratedOccurrence>[];
    var monthOffset = 0;

    while (true) {
      final dueDate = _monthlyOccurrenceDate(startDate, dayOfMonth, monthOffset);

      if (mode == RecurrenceMode.untilDate) {
        if (endDate != null && dueDate.isAfter(endDate)) break;
      } else if (mode == RecurrenceMode.forMonths) {
        if (monthOffset >= (input.recurrenceMonths ?? 0)) break;
      } else if (monthOffset >= 12) {
        break;
      }

      occurrences.add(build(dueDate, monthOffset + 1));
      monthOffset += 1;
    }

    return occurrences;
  }

  final transactionDate = input.transactionDate ?? today;
  return [build(transactionDate, null)];
}
