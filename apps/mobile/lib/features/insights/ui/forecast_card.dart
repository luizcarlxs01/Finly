import 'package:flutter/material.dart';

import '../../../app/theme.dart';
import '../../../core/format/formatters.dart';
import '../../../core/widgets/widgets.dart';

/// Espelha apps/web/src/components/dashboard/financial-forecast-card.tsx.
class ForecastCard extends StatelessWidget {
  const ForecastCard({
    super.key,
    required this.totalIncome,
    required this.totalExpense,
    required this.projectedBalance,
  });

  final double totalIncome;
  final double totalExpense;
  final double projectedBalance;

  ({Color bg, Color border, Color value, String label}) _tone(
      BuildContext context) {
    final scheme = context.scheme;
    if (projectedBalance < 0) {
      return (
        bg: scheme.tertiary.withValues(alpha: 0.25),
        border: scheme.tertiary.withValues(alpha: 0.6),
        value: scheme.onSurface,
        label: 'Atenção',
      );
    }
    if (projectedBalance > 0) {
      return (
        bg: scheme.primary.withValues(alpha: 0.10),
        border: scheme.primary.withValues(alpha: 0.20),
        value: scheme.primary,
        label: 'Folga',
      );
    }
    return (
      bg: scheme.surface,
      border: scheme.outline,
      value: scheme.onSurface,
      label: 'Em dia',
    );
  }

  @override
  Widget build(BuildContext context) {
    final tone = _tone(context);
    final scheme = context.scheme;

    return FinlyCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Próximo período',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
          const SizedBox(height: 2),
          Text('Um olhar rápido para o que pode vir pela frente.',
              style: TextStyle(fontSize: 12.5, color: context.mutedForeground)),
          const SizedBox(height: 12),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: tone.bg,
              borderRadius: BorderRadius.circular(AppColors.fieldRadius),
              border: Border.all(color: tone.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Text('Saldo previsto',
                        style: TextStyle(
                            fontSize: 13, fontWeight: FontWeight.w600)),
                    const SizedBox(width: 8),
                    PillBadge(label: tone.label, foreground: tone.value),
                  ],
                ),
                const SizedBox(height: 6),
                Text(Fmt.currency(projectedBalance),
                    style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                        color: tone.value)),
              ],
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: _Cell(
                    label: 'Entradas',
                    value: Fmt.currency(totalIncome),
                    color: scheme.primary),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _Cell(
                    label: 'Saídas',
                    value: Fmt.currency(totalExpense),
                    color: scheme.onSurface),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _Cell extends StatelessWidget {
  const _Cell({required this.label, required this.value, required this.color});
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: context.scheme.surface,
        borderRadius: BorderRadius.circular(AppColors.fieldRadius),
        border: Border.all(color: context.scheme.outline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style: TextStyle(fontSize: 11, color: context.mutedForeground)),
          const SizedBox(height: 2),
          Text(value,
              style: TextStyle(
                  fontSize: 16, fontWeight: FontWeight.w700, color: color)),
        ],
      ),
    );
  }
}
