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
    final divider = scheme.outline.withValues(alpha: 0.6);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: scheme.surface.withValues(alpha: 0.72),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF031533).withValues(alpha: 0.06),
            blurRadius: 28,
            offset: const Offset(0, 8),
          )
        ],
      ),
      child: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.only(bottom: 10),
            decoration: BoxDecoration(
                border: Border(bottom: BorderSide(color: divider))),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('Saldo previsto',
                        style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: context.mutedForeground)),
                    const SizedBox(width: 8),
                    PillBadge(
                        label: tone.label,
                        background: tone.bg,
                        foreground: tone.value),
                  ],
                ),
                const SizedBox(height: 8),
                FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Text(Fmt.currency(projectedBalance),
                      style: TextStyle(
                          fontSize: 30,
                          fontWeight: FontWeight.w600,
                          color: tone.value)),
                ),
                const SizedBox(height: 4),
                Text('Próximo período',
                    style: TextStyle(
                        fontSize: 14, color: context.mutedForeground)),
              ],
            ),
          ),
          const SizedBox(height: 10),
          IntrinsicHeight(
            child: Row(
              children: [
                Expanded(
                  child: _Cell(
                      label: 'Entradas previstas',
                      value: Fmt.currency(totalIncome),
                      color: scheme.primary),
                ),
                VerticalDivider(width: 1, color: divider),
                Expanded(
                  child: _Cell(
                      label: 'Saídas previstas',
                      value: Fmt.currency(totalExpense),
                      color: scheme.onSurface),
                ),
              ],
            ),
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
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: Column(
        children: [
          Text(label,
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: context.mutedForeground)),
          const SizedBox(height: 4),
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(value,
                style: TextStyle(
                    fontSize: 19, fontWeight: FontWeight.w600, color: color)),
          ),
        ],
      ),
    );
  }
}
