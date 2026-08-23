import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../constants/categories.dart';
import '../../models/transaction.dart';
import '../../providers/finance_provider.dart';
import '../../providers/ui_state_provider.dart';
import '../../theme/app_colors.dart';
import '../../utils/formatters.dart';
import '../../widgets/empty_state.dart';

class AnalysisScreen extends ConsumerWidget {
  const AnalysisScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final finance = ref.watch(financeProvider);
    final hideValues = ref.watch(hideValuesProvider);

    final byCategory = <String, double>{};
    for (final line in finance.transactions) {
      if (!line.isPaid || line.type != TransactionType.expense) continue;
      byCategory[line.category] = (byCategory[line.category] ?? 0) + line.amount;
    }

    final entries = byCategory.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    final maxValue = entries.isEmpty ? 1.0 : entries.first.value;

    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(22, 12, 22, 32),
          children: [
            const Text(
              'Análise',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w800,
                letterSpacing: -0.4,
              ),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(26),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Saídas pagas',
                    style: TextStyle(fontSize: 11.5, color: AppColors.muted),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    formatCurrency(finance.totalExpense, hidden: hideValues),
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.3,
                    ),
                  ),
                  const SizedBox(height: 18),
                  if (entries.isEmpty)
                    const EmptyState(
                      icon: Icons.pie_chart_outline,
                      message: 'Sem saídas pagas neste período ainda.',
                    )
                  else
                    ...entries.map((entry) {
                      final category = categoryById(entry.key);
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 14),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment:
                                  MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  category.label,
                                  style: const TextStyle(
                                    fontSize: 12.5,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                Text(
                                  formatCurrency(entry.value,
                                      hidden: hideValues, short: true),
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 7),
                            ClipRRect(
                              borderRadius: BorderRadius.circular(999),
                              child: LinearProgressIndicator(
                                value: entry.value / maxValue,
                                minHeight: 10,
                                backgroundColor: AppColors.background,
                                valueColor:
                                    AlwaysStoppedAnimation(category.color),
                              ),
                            ),
                          ],
                        ),
                      );
                    }),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
