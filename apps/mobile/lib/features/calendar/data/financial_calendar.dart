import '../../../core/format/formatters.dart';
import '../../../shared/models/enums.dart';
import '../../../shared/models/transaction.dart';

/// Réplica de apps/web/src/utils/financial-calendar.ts (getCalendarMonthData).
/// Agrupa as ocorrências achatadas por dia, monta a grade do mês e calcula o
/// resumo. Ocorrências Cancelled já não chegam aqui (LineItem.flatten as exclui).
///
/// ⚠️ "Saldo projetado" do mês (cumulativeBalance) = currentBalance +
/// pendências líquidas até o último dia do mês exibido. NÃO é o saldo do mês
/// isolado — é o mesmo cálculo do web (seção 22 do CLAUDE.md).

const calendarWeekdayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

class CalendarDay {
  CalendarDay({
    required this.dateValue,
    required this.dayNumber,
    required this.isToday,
    required this.isPast,
    required this.occurrences,
  });

  final String dateValue;
  final int dayNumber;
  final bool isToday;
  final bool isPast;
  final List<LineItem> occurrences;

  int get paidCount => occurrences.where((o) => o.isPaid).length;
  int get pendingCount => occurrences.where((o) => !o.isPaid).length;
}

class CalendarMonthSummary {
  CalendarMonthSummary({
    required this.totalIncome,
    required this.totalExpense,
    required this.cumulativeBalance,
    required this.occurrenceCount,
  });

  final double totalIncome;
  final double totalExpense;
  final double cumulativeBalance;
  final int occurrenceCount;

  double get monthBalance => totalIncome - totalExpense;
}

class CalendarMonthData {
  CalendarMonthData({
    required this.year,
    required this.monthIndex,
    required this.monthLabel,
    required this.leadingBlankDays,
    required this.days,
    required this.summary,
  });

  final int year;
  final int monthIndex;
  final String monthLabel;
  final int leadingBlankDays;
  final List<CalendarDay> days;
  final CalendarMonthSummary summary;
}

String _fmt(DateTime d) =>
    '${d.year.toString().padLeft(4, '0')}-'
    '${d.month.toString().padLeft(2, '0')}-'
    '${d.day.toString().padLeft(2, '0')}';

CalendarMonthData getCalendarMonthData({
  required List<LineItem> transactions,
  required int year,
  required int monthIndex, // 0-based
  required double currentBalance,
  DateTime? referenceDate,
}) {
  final today = referenceDate ?? DateTime.now();
  final todayValue = _fmt(DateTime(today.year, today.month, today.day));

  final daysInMonth = DateTime(year, monthIndex + 2, 0).day;
  final lastDayValue = _fmt(DateTime(year, monthIndex + 1, daysInMonth));

  final byDay = <int, List<LineItem>>{};
  var totalIncome = 0.0;
  var totalExpense = 0.0;
  var occurrenceCount = 0;
  var pendingNetToEndOfMonth = 0.0;

  for (final t in transactions) {
    final date = t.dueDateTime;
    if (date == null) continue;
    final dateValue = _fmt(DateTime(date.year, date.month, date.day));

    if (dateValue.compareTo(lastDayValue) <= 0 && !t.isPaid) {
      pendingNetToEndOfMonth +=
          t.type == TransactionType.income ? t.amount : -t.amount;
    }

    if (date.year != year || date.month != monthIndex + 1) continue;

    byDay.putIfAbsent(date.day, () => []).add(t);
    occurrenceCount += 1;
    if (t.type == TransactionType.income) {
      totalIncome += t.amount;
    } else {
      totalExpense += t.amount;
    }
  }

  int typeRank(LineItem i) => i.type == TransactionType.income ? 0 : 1;

  final days = List<CalendarDay>.generate(daysInMonth, (index) {
    final dayNumber = index + 1;
    final dateValue = _fmt(DateTime(year, monthIndex + 1, dayNumber));
    final occurrences = (byDay[dayNumber] ?? [])
      ..sort((a, b) {
        if (typeRank(a) != typeRank(b)) return typeRank(a) - typeRank(b);
        return a.title.toLowerCase().compareTo(b.title.toLowerCase());
      });
    return CalendarDay(
      dateValue: dateValue,
      dayNumber: dayNumber,
      isToday: dateValue == todayValue,
      isPast: dateValue.compareTo(todayValue) < 0,
      occurrences: occurrences,
    );
  });

  return CalendarMonthData(
    year: year,
    monthIndex: monthIndex,
    monthLabel: Fmt.monthYearLabel(DateTime(year, monthIndex + 1, 1)),
    leadingBlankDays: DateTime(year, monthIndex + 1, 1).weekday % 7, // Dom=0
    days: days,
    summary: CalendarMonthSummary(
      totalIncome: totalIncome,
      totalExpense: totalExpense,
      cumulativeBalance: currentBalance + pendingNetToEndOfMonth,
      occurrenceCount: occurrenceCount,
    ),
  );
}
