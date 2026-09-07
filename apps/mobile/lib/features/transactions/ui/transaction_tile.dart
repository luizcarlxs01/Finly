import 'package:flutter/material.dart';

import '../../../app/theme.dart';
import '../../../core/format/formatters.dart';
import '../../../core/widgets/widgets.dart';
import '../../../shared/models/categories.dart';
import '../../../shared/models/enums.dart';
import '../../../shared/models/transaction.dart';

String kindLabel(DisplayKind kind) => switch (kind) {
      DisplayKind.installmentInstance => 'Parcelado',
      DisplayKind.recurringInstance => 'Recorrente',
      DisplayKind.single => 'Único',
    };

/// Espelha apps/web/src/components/dashboard/transaction-list.tsx (um cartão por
/// linha). "Remover" cancela a ocorrência (soft-delete); "Editar" abre o modal.
class TransactionTile extends StatelessWidget {
  const TransactionTile({
    super.key,
    required this.item,
    required this.onEdit,
    required this.onRemove,
  });

  final LineItem item;
  final VoidCallback onEdit;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    final scheme = context.scheme;
    final isIncome = item.type == TransactionType.income;
    final displayDate = Fmt.businessDate(item.dueDate) ?? item.dueDate;

    return FinlyCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(item.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                            fontSize: 16, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(Icons.event_outlined,
                            size: 14, color: context.mutedForeground),
                        const SizedBox(width: 6),
                        Text(displayDate,
                            style: TextStyle(
                                fontSize: 12.5,
                                color: context.mutedForeground)),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '${isIncome ? '+' : '-'}${Fmt.currency(item.amount)}',
                style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                    color: context.amountColor(isIncome)),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              PillBadge(
                label: isIncome ? 'Entrada' : 'Saída',
                background: isIncome
                    ? scheme.primary.withValues(alpha: 0.12)
                    : scheme.tertiary.withValues(alpha: 0.30),
                foreground: isIncome ? scheme.primary : scheme.onSurface,
              ),
              PillBadge(label: TransactionCategories.label(item.category)),
              PillBadge(label: kindLabel(item.displayKind)),
              if (item.displayKind == DisplayKind.installmentInstance &&
                  item.installmentIndex != null &&
                  item.installmentCount != null)
                PillBadge(
                    label:
                        'Parcela ${item.installmentIndex}/${item.installmentCount}'),
              PillBadge(
                label: item.isPaid ? 'Pago' : 'Pendente',
                leadingDot: item.isPaid
                    ? context.success
                    : context.mutedForeground.withValues(alpha: 0.45),
                background: item.isPaid
                    ? context.success.withValues(alpha: 0.12)
                    : scheme.surfaceContainerHighest,
                foreground: item.isPaid ? context.success : context.mutedForeground,
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                      minimumSize: const Size.fromHeight(40)),
                  onPressed: onEdit,
                  icon: const Icon(Icons.edit_outlined, size: 16),
                  label: const Text('Editar'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size.fromHeight(40),
                    foregroundColor: scheme.error,
                    side: BorderSide(color: scheme.error.withValues(alpha: 0.5)),
                  ),
                  onPressed: onRemove,
                  icon: const Icon(Icons.delete_outline, size: 16),
                  label: const Text('Remover'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
