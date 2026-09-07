import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme.dart';
import '../../../core/format/formatters.dart';
import '../../../core/widgets/widgets.dart';
import '../../../shared/models/categories.dart';
import '../../../shared/models/enums.dart';
import '../../../shared/models/transaction.dart';
import '../../transactions/state/finance_controller.dart';
import '../../transactions/ui/transaction_edit_sheet.dart';
import '../../transactions/ui/transaction_tile.dart';
import '../data/financial_calendar.dart';

/// Espelha apps/web/src/components/dashboard/overlays/financial-calendar-modal.tsx
/// + grid + day-panel. No mobile não há hover: tocar no dia abre o painel
/// abaixo da grade (PASSO 5 do briefing). "Editar" abre a mesma folha de edição.
class CalendarScreen extends ConsumerStatefulWidget {
  const CalendarScreen({super.key});

  @override
  ConsumerState<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends ConsumerState<CalendarScreen> {
  late DateTime _visibleMonth;
  String? _selectedDate;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _visibleMonth = DateTime(now.year, now.month);
  }

  void _shiftMonth(int step) {
    setState(() {
      _visibleMonth = DateTime(_visibleMonth.year, _visibleMonth.month + step);
      _selectedDate = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final financeAsync = ref.watch(financeControllerProvider);
    final finance = financeAsync.valueOrNull ?? FinanceData.empty;
    final now = DateTime.now();
    final isCurrentMonth = _visibleMonth.year == now.year &&
        _visibleMonth.month == now.month;

    final month = getCalendarMonthData(
      transactions: finance.lineItems,
      year: _visibleMonth.year,
      monthIndex: _visibleMonth.month - 1,
      currentBalance: finance.currentBalance,
    );
    final selectedDay = _selectedDate == null
        ? null
        : month.days.where((d) => d.dateValue == _selectedDate).firstOrNull;

    return Scaffold(
      appBar: AppBar(title: const Text('Calendário')),
      body: financeAsync.isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
              children: [
                Row(
                  children: [
                    IconButton(
                      onPressed: () => _shiftMonth(-1),
                      icon: const Icon(Icons.chevron_left),
                    ),
                    Expanded(
                      child: Text(
                        _capitalize(month.monthLabel),
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                            fontSize: 16, fontWeight: FontWeight.w700),
                      ),
                    ),
                    IconButton(
                      onPressed: () => _shiftMonth(1),
                      icon: const Icon(Icons.chevron_right),
                    ),
                  ],
                ),
                if (!isCurrentMonth)
                  Center(
                    child: TextButton(
                      onPressed: () => setState(() {
                        _visibleMonth = DateTime(now.year, now.month);
                        _selectedDate = null;
                      }),
                      child: const Text('Hoje'),
                    ),
                  ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    _SummaryBox(
                        label: 'Entradas previstas',
                        value: Fmt.currency(month.summary.totalIncome),
                        color: context.scheme.primary),
                    const SizedBox(width: 8),
                    _SummaryBox(
                        label: 'Saídas previstas',
                        value: Fmt.currency(month.summary.totalExpense),
                        color: context.scheme.onSurface),
                    const SizedBox(width: 8),
                    _SummaryBox(
                      label: 'Saldo projetado',
                      value: Fmt.currency(month.summary.cumulativeBalance),
                      color: month.summary.cumulativeBalance < 0
                          ? context.scheme.error
                          : context.scheme.onSurface,
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                if (month.summary.occurrenceCount == 0)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(AppColors.fieldRadius),
                      border: Border.all(color: context.scheme.outline),
                    ),
                    child: Text('Nenhum lançamento neste mês.',
                        style: TextStyle(
                            fontSize: 13, color: context.mutedForeground)),
                  ),
                const SizedBox(height: 12),
                _CalendarGrid(
                  month: month,
                  selectedDate: _selectedDate,
                  onSelect: (d) => setState(() => _selectedDate = d),
                ),
                const SizedBox(height: 16),
                _DayPanel(
                  day: selectedDay,
                  onEdit: (item) => showTransactionEditSheet(context, item),
                ),
              ],
            ),
    );
  }

  static String _capitalize(String s) =>
      s.isEmpty ? s : s[0].toUpperCase() + s.substring(1);
}

class _SummaryBox extends StatelessWidget {
  const _SummaryBox(
      {required this.label, required this.value, required this.color});
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: context.scheme.surface,
          borderRadius: BorderRadius.circular(AppColors.fieldRadius),
          border: Border.all(color: context.scheme.outline),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label,
                style: TextStyle(
                    fontSize: 10, color: context.mutedForeground)),
            const SizedBox(height: 4),
            Text(value,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                    fontSize: 13, fontWeight: FontWeight.w700, color: color)),
          ],
        ),
      ),
    );
  }
}

class _CalendarGrid extends StatelessWidget {
  const _CalendarGrid({
    required this.month,
    required this.selectedDate,
    required this.onSelect,
  });

  final CalendarMonthData month;
  final String? selectedDate;
  final ValueChanged<String> onSelect;

  @override
  Widget build(BuildContext context) {
    final cells = <Widget>[
      for (final w in calendarWeekdayLabels)
        Center(
          child: Text(w,
              style: TextStyle(
                  fontSize: 10.5,
                  fontWeight: FontWeight.w700,
                  color: context.mutedForeground)),
        ),
      for (var i = 0; i < month.leadingBlankDays; i++) const SizedBox.shrink(),
      for (final day in month.days)
        _DayCell(
          day: day,
          selected: day.dateValue == selectedDate,
          onTap: day.occurrences.isEmpty ? null : () => onSelect(day.dateValue),
        ),
    ];

    return Column(
      children: [
        GridView.count(
          crossAxisCount: 7,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 4,
          crossAxisSpacing: 4,
          childAspectRatio: 0.82,
          children: cells,
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            _LegendDot(color: context.success, label: 'Pago'),
            const SizedBox(width: 16),
            _LegendDot(
                color: context.mutedForeground.withValues(alpha: 0.45),
                label: 'Pendente'),
          ],
        ),
      ],
    );
  }
}

class _DayCell extends StatelessWidget {
  const _DayCell(
      {required this.day, required this.selected, required this.onTap});
  final CalendarDay day;
  final bool selected;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = context.scheme;
    final visibleDots = day.occurrences.take(4).toList();
    final hidden = day.occurrences.length - visibleDots.length;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        decoration: BoxDecoration(
          color: selected
              ? scheme.primary.withValues(alpha: 0.10)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: selected ? scheme.primary : scheme.outline,
          ),
        ),
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.start,
          children: [
            Container(
              width: 22,
              height: 22,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: day.isToday ? scheme.primary : Colors.transparent,
              ),
              child: Text(
                '${day.dayNumber}',
                style: TextStyle(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w700,
                  color: day.isToday
                      ? scheme.onPrimary
                      : (day.isPast
                          ? context.mutedForeground
                          : scheme.onSurface),
                ),
              ),
            ),
            const SizedBox(height: 3),
            Wrap(
              spacing: 2,
              runSpacing: 2,
              alignment: WrapAlignment.center,
              children: [
                for (final o in visibleDots)
                  Container(
                    width: 5,
                    height: 5,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: o.isPaid
                          ? context.success
                          : context.mutedForeground.withValues(alpha: 0.45),
                    ),
                  ),
                if (hidden > 0)
                  Text('+$hidden',
                      style: TextStyle(
                          fontSize: 8, color: context.mutedForeground)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _LegendDot extends StatelessWidget {
  const _LegendDot({required this.color, required this.label});
  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 6),
        Text(label,
            style: TextStyle(fontSize: 11, color: context.mutedForeground)),
      ],
    );
  }
}

class _DayPanel extends StatelessWidget {
  const _DayPanel({required this.day, required this.onEdit});
  final CalendarDay? day;
  final void Function(LineItem item) onEdit;

  @override
  Widget build(BuildContext context) {
    if (day == null) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(AppColors.cardRadius),
          border: Border.all(color: context.scheme.outline),
        ),
        child: Text(
          'Selecione um dia com lançamentos para ver os detalhes.',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 13, color: context.mutedForeground),
        ),
      );
    }

    final d = day!;
    final income = d.occurrences
        .where((o) => o.type == TransactionType.income)
        .fold<double>(0, (s, o) => s + o.amount);
    final expense = d.occurrences
        .where((o) => o.type == TransactionType.expense)
        .fold<double>(0, (s, o) => s + o.amount);

    return FinlyCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(Fmt.businessDate(d.dateValue) ?? d.dateValue,
              style:
                  const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Text(
            '${d.occurrences.length} lançamento${d.occurrences.length == 1 ? '' : 's'} · entradas ${Fmt.currency(income)} · saídas ${Fmt.currency(expense)}',
            style: TextStyle(fontSize: 12, color: context.mutedForeground),
          ),
          const SizedBox(height: 12),
          ...d.occurrences.map((o) {
            final isIncome = o.type == TransactionType.income;
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: context.scheme.surface,
                borderRadius: BorderRadius.circular(AppColors.fieldRadius),
                border: Border.all(color: context.scheme.outline),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(o.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                                fontSize: 13.5,
                                fontWeight: FontWeight.w700)),
                      ),
                      Text(
                        '${isIncome ? '+' : '-'}${Fmt.currency(o.amount)}',
                        style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: context.amountColor(isIncome)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: [
                      PillBadge(
                        label: o.isPaid ? 'Pago' : 'Pendente',
                        leadingDot: o.isPaid
                            ? context.success
                            : context.mutedForeground
                                .withValues(alpha: 0.45),
                      ),
                      PillBadge(
                        label: o.displayKind == DisplayKind.installmentInstance &&
                                o.installmentIndex != null &&
                                o.installmentCount != null
                            ? 'Parcela ${o.installmentIndex}/${o.installmentCount}'
                            : kindLabel(o.displayKind),
                      ),
                      PillBadge(
                          label: TransactionCategories.label(o.category)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Align(
                    alignment: Alignment.centerRight,
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                          minimumSize: const Size(0, 34),
                          padding:
                              const EdgeInsets.symmetric(horizontal: 12)),
                      onPressed: () => onEdit(o),
                      icon: const Icon(Icons.edit_outlined, size: 14),
                      label: const Text('Editar'),
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}
