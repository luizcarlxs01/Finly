import 'package:flutter/material.dart';

import '../../../app/theme.dart';
import '../../../core/format/formatters.dart';
import '../../../shared/models/categories.dart';
import '../../../shared/models/category_icons.dart';
import '../../../shared/models/enums.dart';
import '../../../shared/models/transaction.dart';

String kindLabel(DisplayKind kind) => switch (kind) {
      DisplayKind.installmentInstance => 'Parcelado',
      DisplayKind.recurringInstance => 'Recorrente',
      DisplayKind.single => 'Único',
    };

/// Linha do extrato — espelha `transaction-statement.tsx` da web (ícone de
/// categoria, status/tipo, data, valor e menu de ações Editar/Remover).
class TransactionTile extends StatelessWidget {
  const TransactionTile({
    super.key,
    required this.item,
    required this.onEdit,
    required this.onRemove,
    this.hidden = false,
  });

  final LineItem item;
  final VoidCallback onEdit;
  final VoidCallback onRemove;
  final bool hidden;

  @override
  Widget build(BuildContext context) {
    final scheme = context.scheme;
    final isIncome = item.type == TransactionType.income;
    final displayDate = Fmt.businessDate(item.dueDate) ?? item.dueDate;
    final parcel = item.displayKind == DisplayKind.installmentInstance &&
            item.installmentIndex != null &&
            item.installmentCount != null
        ? ' · ${item.installmentIndex}/${item.installmentCount}'
        : '';

    return Container(
      padding: const EdgeInsets.fromLTRB(0, 10, 0, 10),
      decoration: BoxDecoration(
        border: Border(
            bottom: BorderSide(color: scheme.outline.withValues(alpha: 0.6))),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 20,
            backgroundColor: scheme.primary.withValues(alpha: 0.07),
            child: Icon(categoryIcon(item.category),
                size: 20, color: scheme.primary),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        fontSize: 14, fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text(
                    '${item.isPaid ? 'Pago' : 'Pendente'} · ${kindLabel(item.displayKind)}$parcel',
                    style: TextStyle(
                        fontSize: 11, color: context.mutedForeground)),
                Text(
                    '${TransactionCategories.label(item.category)} · $displayDate',
                    style: TextStyle(
                        fontSize: 11, color: context.mutedForeground)),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Text(
            hidden
                ? '••••••'
                : '${isIncome ? '+' : '−'} ${Fmt.currency(item.amount)}',
            style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: isIncome ? scheme.primary : scheme.onSurface),
          ),
          PopupMenuButton<String>(
            tooltip: 'Opções de ${item.title}',
            icon: const Icon(Icons.more_horiz, size: 20),
            onSelected: (value) => value == 'edit' ? onEdit() : onRemove(),
            itemBuilder: (_) => [
              const PopupMenuItem(
                  value: 'edit',
                  child: Row(children: [
                    Icon(Icons.edit_outlined, size: 18),
                    SizedBox(width: 10),
                    Text('Editar')
                  ])),
              PopupMenuItem(
                  value: 'remove',
                  child: Row(children: [
                    Icon(Icons.delete_outline, size: 18, color: scheme.error),
                    const SizedBox(width: 10),
                    Text('Remover', style: TextStyle(color: scheme.error))
                  ])),
            ],
          ),
        ],
      ),
    );
  }
}
