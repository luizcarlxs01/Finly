import 'package:intl/intl.dart';

final _currency = NumberFormat.currency(locale: 'pt_BR', symbol: 'R\$');
final _currencyShort = NumberFormat.currency(
  locale: 'pt_BR',
  symbol: 'R\$',
  decimalDigits: 0,
);
final _monthLabel = DateFormat('MMMM yyyy', 'pt_BR');
final _dayLabel = DateFormat("d 'de' MMMM 'de' yyyy", 'pt_BR');
final _shortDate = DateFormat('dd/MM/yyyy', 'pt_BR');

String formatCurrency(double value, {bool hidden = false, bool short = false}) {
  if (hidden) return 'R\$ ••••••';
  return short ? _currencyShort.format(value) : _currency.format(value);
}

String formatSigned(double value, {bool hidden = false}) {
  final prefix = value >= 0 ? '+ ' : '- ';
  return prefix + formatCurrency(value.abs(), hidden: hidden);
}

String formatMonthLabel(DateTime date) => _monthLabel.format(date);

String formatDayLabel(DateTime date) => _dayLabel.format(date);

String formatShortDate(DateTime date) => _shortDate.format(date);

/// Converte "YYYY-MM-DD" (convenção de Occurrence.dueDate nos dois modos)
/// para DateTime local, sem deslocamento de fuso.
DateTime? parseDateValue(String? value) {
  if (value == null || value.isEmpty) return null;
  final datePart = value.split('T').first;
  final parts = datePart.split('-');
  if (parts.length != 3) return null;

  final year = int.tryParse(parts[0]);
  final month = int.tryParse(parts[1]);
  final day = int.tryParse(parts[2]);
  if (year == null || month == null || day == null) return null;

  return DateTime(year, month, day);
}

String formatDateValue(DateTime date) {
  final month = date.month.toString().padLeft(2, '0');
  final day = date.day.toString().padLeft(2, '0');
  return '${date.year}-$month-$day';
}

/// Aceita vírgula ou ponto como separador decimal — mesma regra aplicada
/// nos inputs do apps/web.
double? parseAmountInput(String raw) {
  final normalized = raw.trim().replaceAll('.', '').replaceAll(',', '.');
  if (normalized.isEmpty) return null;
  return double.tryParse(normalized);
}
