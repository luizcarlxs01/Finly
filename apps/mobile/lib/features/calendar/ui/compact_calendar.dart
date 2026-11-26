import 'package:flutter/material.dart';

import '../../../app/theme.dart';
import '../../../core/format/formatters.dart';
import '../../../shared/models/transaction.dart';

/// Versão compacta do calendário exibido ao lado do extrato na web.
class CompactCalendar extends StatefulWidget {
  const CompactCalendar(
      {super.key, required this.items, required this.onOpenFull});

  final List<LineItem> items;
  final VoidCallback onOpenFull;

  @override
  State<CompactCalendar> createState() => _CompactCalendarState();
}

class _CompactCalendarState extends State<CompactCalendar> {
  static const _months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  static const _weekdays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  late DateTime _month = DateTime(DateTime.now().year, DateTime.now().month);
  late DateTime _selected = DateTime.now();

  String _key(DateTime date) =>
      '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';

  void _changeMonth(int amount) {
    setState(() {
      _month = DateTime(_month.year, _month.month + amount);
      _selected = DateTime(_month.year, _month.month, 1);
    });
  }

  @override
  Widget build(BuildContext context) {
    final firstOffset = _month.weekday % 7;
    final days = DateTime(_month.year, _month.month + 1, 0).day;
    final cells = ((firstOffset + days + 6) ~/ 7) * 7;
    final selectedItems =
        widget.items.where((item) => item.dueDate == _key(_selected)).toList();
    final scheme = context.scheme;

    return Container(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 8),
      decoration: BoxDecoration(
        color: scheme.surface.withValues(alpha: 0.9),
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF031533).withValues(alpha: 0.07),
            blurRadius: 20,
            offset: const Offset(0, 6),
          )
        ],
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(
              child: Text('${_months[_month.month - 1]} ${_month.year}',
                  style: const TextStyle(
                      fontSize: 17, fontWeight: FontWeight.w700))),
          IconButton(
              tooltip: 'Mês anterior',
              onPressed: () => _changeMonth(-1),
              icon: const Icon(Icons.chevron_left)),
          IconButton(
              tooltip: 'Próximo mês',
              onPressed: () => _changeMonth(1),
              icon: const Icon(Icons.chevron_right)),
        ]),
        Row(children: [
          for (final day in _weekdays)
            Expanded(
                child: Center(
                    child: Text(day,
                        style: TextStyle(
                            fontSize: 11, color: context.mutedForeground))))
        ]),
        const SizedBox(height: 5),
        GridView.builder(
          itemCount: cells,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 7,
            childAspectRatio: 1.12,
          ),
          itemBuilder: (context, index) {
            final day = index - firstOffset + 1;
            if (day < 1 || day > days) return const SizedBox.shrink();
            final date = DateTime(_month.year, _month.month, day);
            final dayItems =
                widget.items.where((item) => item.dueDate == _key(date));
            final isSelected = _key(date) == _key(_selected);
            final paid = dayItems.any((item) => item.isPaid);
            final pending = dayItems.any((item) => !item.isPaid);
            return InkWell(
              onTap: () => setState(() => _selected = date),
              borderRadius: BorderRadius.circular(20),
              child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 31,
                      height: 31,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isSelected ? scheme.primary : Colors.transparent,
                      ),
                      child: Text('$day',
                          style: TextStyle(
                              fontSize: 12,
                              fontWeight: isSelected
                                  ? FontWeight.w700
                                  : FontWeight.w500,
                              color: isSelected
                                  ? scheme.onPrimary
                                  : scheme.onSurface)),
                    ),
                    Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                      if (paid) _DayDot(context.success),
                      if (pending) _DayDot(context.mutedForeground),
                    ]),
                  ]),
            );
          },
        ),
        const Divider(height: 22),
        Text(
            'Lançamentos em ${_selected.day} de ${_months[_selected.month - 1].toLowerCase()}',
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
        const SizedBox(height: 8),
        if (selectedItems.isEmpty)
          Text('Nenhum lançamento nesta data.',
              style: TextStyle(fontSize: 12, color: context.mutedForeground))
        else
          ...selectedItems.take(3).map((item) => Padding(
                padding: const EdgeInsets.only(bottom: 7),
                child: Row(children: [
                  Expanded(
                      child: Text(item.title,
                          maxLines: 1, overflow: TextOverflow.ellipsis)),
                  Text(Fmt.currency(item.amount)),
                ]),
              )),
        Align(
          alignment: Alignment.centerRight,
          child: TextButton(
              onPressed: widget.onOpenFull,
              child: const Text('Abrir calendário completo')),
        ),
      ]),
    );
  }
}

class _DayDot extends StatelessWidget {
  const _DayDot(this.color);
  final Color color;

  @override
  Widget build(BuildContext context) => Container(
        width: 4,
        height: 4,
        margin: const EdgeInsets.symmetric(horizontal: 1),
        decoration: BoxDecoration(color: color, shape: BoxShape.circle),
      );
}
