import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/transaction.dart';
import '../../providers/finance_provider.dart';
import '../../providers/ui_state_provider.dart';
import '../../theme/app_colors.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/transaction_tile.dart';

enum _StatementFilter { all, income, expense }

class StatementScreen extends ConsumerStatefulWidget {
  const StatementScreen({super.key});

  @override
  ConsumerState<StatementScreen> createState() => _StatementScreenState();
}

class _StatementScreenState extends ConsumerState<StatementScreen> {
  var _filter = _StatementFilter.all;

  @override
  Widget build(BuildContext context) {
    final finance = ref.watch(financeProvider);
    final hideValues = ref.watch(hideValuesProvider);

    final filtered = finance.transactions.where((line) {
      switch (_filter) {
        case _StatementFilter.income:
          return line.type == TransactionType.income;
        case _StatementFilter.expense:
          return line.type == TransactionType.expense;
        case _StatementFilter.all:
          return true;
      }
    }).toList()
      ..sort((a, b) => b.occurrenceDate.compareTo(a.occurrenceDate));

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () => ref.read(financeProvider.notifier).load(),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(22, 12, 22, 32),
            children: [
              const Text(
                'Lançamentos',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.4,
                ),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  _FilterChip(
                    label: 'Todas',
                    icon: Icons.filter_list,
                    active: _filter == _StatementFilter.all,
                    onTap: () =>
                        setState(() => _filter = _StatementFilter.all),
                  ),
                  const SizedBox(width: 7),
                  _FilterChip(
                    label: 'Entradas',
                    icon: Icons.arrow_circle_up_outlined,
                    active: _filter == _StatementFilter.income,
                    onTap: () =>
                        setState(() => _filter = _StatementFilter.income),
                  ),
                  const SizedBox(width: 7),
                  _FilterChip(
                    label: 'Saídas',
                    icon: Icons.arrow_circle_down_outlined,
                    active: _filter == _StatementFilter.expense,
                    onTap: () =>
                        setState(() => _filter = _StatementFilter.expense),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              if (finance.isLoading)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 40),
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (filtered.isEmpty)
                const EmptyState(
                  icon: Icons.receipt_long_outlined,
                  message: 'Nenhum lançamento encontrado para este filtro.',
                )
              else
                ...filtered.map(
                  (line) => TransactionTile(line: line, hideValues: hideValues),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.icon,
    required this.active,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          height: 38,
          decoration: BoxDecoration(
            color: active ? AppColors.primarySoft : Colors.white,
            borderRadius: BorderRadius.circular(13),
            border: Border.all(
              color: active ? AppColors.primary : AppColors.border,
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 14,
                color: active ? AppColors.primaryDark : AppColors.muted,
              ),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: active ? AppColors.primaryDark : AppColors.muted,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
