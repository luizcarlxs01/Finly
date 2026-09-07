import 'package:intl/intl.dart';

/// Formatação idêntica à do web (Intl "pt-BR", moeda BRL, datas dd/MM/yyyy).
/// Ver apps/web/src/utils/date-format.ts e os `Intl.NumberFormat` espalhados
/// pelos componentes.
class Fmt {
  Fmt._();

  static final NumberFormat _currency =
      NumberFormat.currency(locale: 'pt_BR', symbol: 'R\$');

  static final DateFormat _date = DateFormat('dd/MM/yyyy', 'pt_BR');
  static final DateFormat _monthYear = DateFormat("MMMM 'de' y", 'pt_BR');
  static final DateFormat _dayMonth = DateFormat('dd/MM', 'pt_BR');

  static String currency(num value) => _currency.format(value);

  /// Máscara "••••••" quando os valores estão ocultos (olhinho do web).
  static String maskedCurrency(num value, {required bool hidden}) =>
      hidden ? '••••••' : currency(value);

  /// "YYYY-MM-DD" -> "DD/MM/YYYY" (formatBusinessDateBr do web).
  static String? businessDate(String? value) {
    if (value == null) return null;
    final match =
        RegExp(r'^(\d{4})-(\d{2})-(\d{2})').firstMatch(value.trim());
    if (match == null) return null;
    return '${match[3]}/${match[2]}/${match[1]}';
  }

  static String date(DateTime value) => _date.format(value);

  static String monthYearLabel(DateTime value) => _monthYear.format(value);

  static String dayMonth(DateTime value) => _dayMonth.format(value);

  /// Rótulo do mês seguinte ao de referência — getNextMonthLabel do web.
  static String nextMonthLabel([DateTime? reference]) {
    final base = reference ?? DateTime.now();
    return monthYearLabel(DateTime(base.year, base.month + 1, 1));
  }
}
