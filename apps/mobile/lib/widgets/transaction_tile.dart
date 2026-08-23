import 'package:flutter/material.dart';

import '../constants/categories.dart';
import '../models/transaction.dart';
import '../theme/app_colors.dart';
import '../utils/formatters.dart';

/// Uma linha de lançamento — reaproveitado entre Home, Extrato e Calendário.
/// Nunca duplicar este widget por tela (mesma regra do apps/web, seção 2 do
/// CLAUDE.md, aplicada aqui ao componente em vez de local/API).
class TransactionTile extends StatelessWidget {
  const TransactionTile({
    super.key,
    required this.line,
    required this.hideValues,
    this.onTap,
  });

  final TransactionLine line;
  final bool hideValues;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final category = categoryById(line.category);
    final isIncome = line.type == TransactionType.income;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        margin: const EdgeInsets.only(bottom: 5),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: category.soft,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(category.icon, size: 20, color: category.color),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    line.title,
                    style: const TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w700,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 3),
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          '${category.label} · ${line.occurrenceDate}',
                          style: const TextStyle(
                            fontSize: 11.5,
                            color: AppColors.muted,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (!line.isPaid) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.primarySoft,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text(
                            'A pagar',
                            style: TextStyle(
                              fontSize: 9.5,
                              fontWeight: FontWeight.w700,
                              color: AppColors.primaryDark,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
            Text(
              (isIncome ? '+ ' : '- ') +
                  formatCurrency(line.amount, hidden: hideValues),
              style: TextStyle(
                fontSize: 13.5,
                fontWeight: FontWeight.w800,
                color: isIncome ? AppColors.success : AppColors.ink,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
