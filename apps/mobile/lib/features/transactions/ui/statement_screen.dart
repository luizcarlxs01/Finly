import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/widgets.dart';
import '../../../shared/models/enums.dart';
import '../../insights/ui/forecast_card.dart';
import '../state/finance_controller.dart';
import '../state/simulation_controller.dart';
import 'transaction_edit_sheet.dart';
import 'transaction_tile.dart';

/// Espelha apps/web/src/components/dashboard/overlays/statement-projection-modal.tsx
/// — abas "Histórico" e "Previsão".
class StatementScreen extends ConsumerStatefulWidget {
  const StatementScreen({super.key});

  @override
  ConsumerState<StatementScreen> createState() => _StatementScreenState();
}

class _StatementScreenState extends ConsumerState<StatementScreen> {
  int _mode = 0; // 0 = Histórico, 1 = Previsão
  int _typeFilter = 0; // 0 all, 1 income, 2 expense

  @override
  Widget build(BuildContext context) {
    final finance =
        ref.watch(financeControllerProvider).valueOrNull ?? FinanceData.empty;
    final simulation = ref.watch(simulationControllerProvider);
    final forecast = buildForecast(
      currentBalance: finance.currentBalance,
      totalIncome: finance.totalIncome,
      totalExpense: finance.totalExpense,
      simulation: simulation,
    );

    final items = finance.lineItems.where((t) {
      return switch (_typeFilter) {
        1 => t.type == TransactionType.income,
        2 => t.type == TransactionType.expense,
        _ => true,
      };
    }).toList();

    return Scaffold(
      appBar: AppBar(title: const Text('Extrato')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
        children: [
          SegmentedButton<int>(
            segments: const [
              ButtonSegment(value: 0, label: Text('Histórico')),
              ButtonSegment(value: 1, label: Text('Previsão')),
            ],
            selected: {_mode},
            onSelectionChanged: (s) => setState(() => _mode = s.first),
          ),
          const SizedBox(height: 16),
          if (_mode == 0) ...[
            SegmentedButton<int>(
              segments: const [
                ButtonSegment(value: 0, label: Text('Todas')),
                ButtonSegment(value: 1, label: Text('Entradas')),
                ButtonSegment(value: 2, label: Text('Saídas')),
              ],
              selected: {_typeFilter},
              onSelectionChanged: (s) => setState(() => _typeFilter = s.first),
            ),
            const SizedBox(height: 12),
            if (items.isEmpty)
              const EmptyState(
                title: 'Nenhuma transação cadastrada',
                description:
                    'Assim que você registrar movimentações, elas aparecerão aqui.',
              )
            else
              ...items.map((item) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: TransactionTile(
                      item: item,
                      onEdit: () => showTransactionEditSheet(context, item),
                      onRemove: () => ref
                          .read(financeControllerProvider.notifier)
                          .cancelOccurrence(item.occurrenceId),
                    ),
                  )),
          ] else
            ForecastCard(
              totalIncome: forecast.totalIncome,
              totalExpense: forecast.totalExpense,
              projectedBalance: forecast.projectedBalance,
            ),
        ],
      ),
    );
  }
}
