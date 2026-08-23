import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../providers/auth_provider.dart';
import '../../providers/finance_provider.dart';
import '../../providers/ui_state_provider.dart';
import '../../theme/app_colors.dart';
import '../../utils/formatters.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/transaction_tile.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final finance = ref.watch(financeProvider);
    final hideValues = ref.watch(hideValuesProvider);

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () => ref.read(financeProvider.notifier).load(),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(22, 8, 22, 32),
            children: [
              _Header(
                name: auth.session?.name ?? 'Visitante',
                initials: auth.session?.initials ?? 'V',
                hideValues: hideValues,
                onToggleHide: () => ref
                    .read(hideValuesProvider.notifier)
                    .update((value) => !value),
                onOpenProfile: () => context.push('/profile'),
                onOpenNotifications: () => context.push('/notifications'),
              ),
              const SizedBox(height: 18),
              _BalanceCard(
                balance: finance.currentBalance,
                income: finance.totalIncome,
                expense: finance.totalExpense,
                isApiMode: auth.source == FinanceSource.api,
                hideValues: hideValues,
              ),
              const SizedBox(height: 18),
              _Shortcuts(
                onCalendar: () => context.push('/calendar'),
                onStatement: () => context.go('/statement'),
                onBudget: () => context.push('/budget'),
                onGoals: () => context.go('/goals'),
              ),
              const SizedBox(height: 22),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Lançamentos recentes',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                  ),
                  GestureDetector(
                    onTap: () => context.go('/statement'),
                    child: const Text(
                      'Ver todos',
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              if (finance.isLoading)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 40),
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (finance.transactions.isEmpty)
                const EmptyState(
                  icon: Icons.receipt_long_outlined,
                  message:
                      'Nenhum lançamento ainda.\nRegistre o primeiro para começar.',
                )
              else
                ...finance.transactions
                    .take(6)
                    .map((line) => TransactionTile(
                          line: line,
                          hideValues: hideValues,
                        )),
            ],
          ),
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({
    required this.name,
    required this.initials,
    required this.hideValues,
    required this.onToggleHide,
    required this.onOpenProfile,
    required this.onOpenNotifications,
  });

  final String name;
  final String initials;
  final bool hideValues;
  final VoidCallback onToggleHide;
  final VoidCallback onOpenProfile;
  final VoidCallback onOpenNotifications;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        GestureDetector(
          onTap: onOpenProfile,
          child: CircleAvatar(
            radius: 22,
            backgroundColor: AppColors.primarySoft,
            child: Text(
              initials,
              style: const TextStyle(
                color: AppColors.primary,
                fontWeight: FontWeight.w800,
                fontSize: 13,
              ),
            ),
          ),
        ),
        const SizedBox(width: 11),
        Expanded(
          child: GestureDetector(
            onTap: onOpenProfile,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Olá,',
                  style: TextStyle(fontSize: 11.5, color: AppColors.muted),
                ),
                const SizedBox(height: 3),
                Text(
                  name,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ),
        IconButton(
          onPressed: onToggleHide,
          icon: Icon(
            hideValues
                ? Icons.visibility_off_outlined
                : Icons.visibility_outlined,
            size: 18,
          ),
          style: IconButton.styleFrom(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(999),
              side: const BorderSide(color: AppColors.border),
            ),
          ),
        ),
        const SizedBox(width: 6),
        Stack(
          clipBehavior: Clip.none,
          children: [
            IconButton(
              onPressed: onOpenNotifications,
              icon: const Icon(Icons.notifications_outlined, size: 18),
              style: IconButton.styleFrom(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(999),
                  side: const BorderSide(color: AppColors.border),
                ),
              ),
            ),
            Positioned(
              top: 8,
              right: 8,
              child: Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: AppColors.danger,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _BalanceCard extends StatelessWidget {
  const _BalanceCard({
    required this.balance,
    required this.income,
    required this.expense,
    required this.isApiMode,
    required this.hideValues,
  });

  final double balance;
  final double income;
  final double expense;
  final bool isApiMode;
  final bool hideValues;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF8B4DFF), AppColors.primary, Color(0xFF6423E0)],
        ),
        borderRadius: BorderRadius.circular(30),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.4),
            blurRadius: 40,
            offset: const Offset(0, 22),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Saldo atual',
                style: TextStyle(color: Colors.white70, fontSize: 12.5),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  isApiMode ? 'Conta' : 'Modo local',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 10.5,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 9),
          Text(
            formatCurrency(balance, hidden: hideValues),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 34,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.8,
            ),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: _MiniStat(
                  icon: Icons.south_west,
                  label: 'Entradas',
                  value: formatCurrency(income, hidden: hideValues),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _MiniStat(
                  icon: Icons.north_east,
                  label: 'Saídas',
                  value: formatCurrency(expense, hidden: hideValues),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MiniStat extends StatelessWidget {
  const _MiniStat({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        children: [
          Container(
            width: 30,
            height: 30,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, size: 15, color: Colors.white),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(color: Colors.white70, fontSize: 10.5),
                ),
                const SizedBox(height: 2),
                FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: Text(
                    value,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13.5,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Shortcuts extends StatelessWidget {
  const _Shortcuts({
    required this.onCalendar,
    required this.onStatement,
    required this.onBudget,
    required this.onGoals,
  });

  final VoidCallback onCalendar;
  final VoidCallback onStatement;
  final VoidCallback onBudget;
  final VoidCallback onGoals;

  @override
  Widget build(BuildContext context) {
    final items = [
      (Icons.calendar_month_outlined, 'Calendário', onCalendar),
      (Icons.receipt_long_outlined, 'Extrato', onStatement),
      (Icons.pie_chart_outline, 'Orçamento', onBudget),
      (Icons.flag_outlined, 'Metas', onGoals),
    ];

    return Row(
      children: items
          .map(
            (item) => Expanded(
              child: GestureDetector(
                onTap: item.$3,
                child: Column(
                  children: [
                    Container(
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Icon(item.$1, size: 20, color: AppColors.primary),
                    ),
                    const SizedBox(height: 7),
                    Text(
                      item.$2,
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: AppColors.inkSoft,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          )
          .toList(),
    );
  }
}
