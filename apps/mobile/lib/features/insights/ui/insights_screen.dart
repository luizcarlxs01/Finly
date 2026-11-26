import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/app.dart';
import '../../../app/shell.dart';
import '../../../app/theme.dart';
import '../../../core/finance_source.dart';
import '../../../core/widgets/widgets.dart';
import '../../../shared/models/spending_profile.dart';
import '../../goals/state/goals_controller.dart';
import '../../transactions/state/finance_controller.dart';
import '../../transactions/state/simulation_controller.dart';
import '../data/dashboard_insights.dart';
import '../state/rules_controller.dart';
import 'financial_rules_manager.dart';
import 'forecast_card.dart';
import 'spending_analysis_panel.dart';
import 'speed_dial_fab.dart';
import 'spending_profile_card.dart';

/// Espelha apps/web/src/components/dashboard/views/dashboard-insights-view.tsx.
///
/// Usa `SingleChildScrollView` + `Column` (não `ListView`): a tela é um punhado
/// de cartões, não uma lista longa. Com `ListView`, o `FinancialRulesManager`
/// (último filho, montado só ao rolar) fazia o `maxScrollExtent` ser estimado
/// errado e a rolagem travava depois do primeiro gesto.
class InsightsScreen extends ConsumerWidget {
  const InsightsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final financeAsync = ref.watch(financeControllerProvider);
    final goalsAsync = ref.watch(goalsControllerProvider);
    final simulation = ref.watch(simulationControllerProvider);
    ref.watch(rulesControllerProvider);

    final finance = financeAsync.valueOrNull ?? FinanceData.empty;
    final goals = goalsAsync.valueOrNull?.goals ?? const [];
    // Regras financeiras: só no modo API com perfil (igual ao web).
    final showRules = ref.watch(financeSourceProvider) == FinanceSource.api &&
        finance.profile != null;

    final paid = finance.lineItems.where((i) => i.isPaid).toList();
    final spendingThresholds =
        resolveSpendingThresholds(finance.spendingProfileSettings);
    final insights = buildDashboardInsights(
      paidTransactions: paid,
      goals: goals,
      totalIncome: finance.totalIncome,
      totalExpense: finance.totalExpense,
      currentBalance: finance.currentBalance,
      spendingThresholds: spendingThresholds,
    );
    final forecast = buildForecast(
      currentBalance: finance.currentBalance,
      totalIncome: finance.totalIncome,
      totalExpense: finance.totalExpense,
      simulation: simulation,
    );

    final showFirstLoad = financeAsync.isLoading && !financeAsync.hasValue;
    final showError = financeAsync.hasError && !financeAsync.hasValue;

    return Scaffold(
      appBar: const FinlyAppBar(
          title: 'Insights', themeToggle: ThemeToggleButton()),
      floatingActionButton: const FinlySpeedDial(),
      body: RefreshIndicator(
        onRefresh: () async {
          await ref.read(financeControllerProvider.notifier).refresh();
          await ref.read(goalsControllerProvider.notifier).refresh();
          await ref.read(rulesControllerProvider.notifier).refresh();
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 96),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (showFirstLoad)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 64),
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (showError)
                ErrorBanner(
                  financeAsync.error.toString(),
                  onRetry: () =>
                      ref.read(financeControllerProvider.notifier).refresh(),
                )
              else ...[
                SpendingProfileCard(settings: finance.spendingProfileSettings),
                const SizedBox(height: 12),
                ForecastCard(
                  totalIncome: forecast.totalIncome,
                  totalExpense: forecast.totalExpense,
                  projectedBalance: forecast.projectedBalance,
                ),
                const SizedBox(height: 12),
                Semantics(
                  label: 'Leituras rápidas',
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      for (final i in insights)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: _InsightTile(insight: i),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                SpendingAnalysisPanel(lineItems: paid),
                if (showRules) ...[
                  const SizedBox(height: 12),
                  const FinancialRulesManager(),
                ],
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _InsightTile extends StatelessWidget {
  const _InsightTile({required this.insight});
  final DashboardInsight insight;

  ({Color bg, Color fg, String label}) _badge(BuildContext context) {
    final scheme = context.scheme;
    return switch (insight.tone) {
      InsightTone.positive => (
          bg: scheme.primary.withValues(alpha: 0.10),
          fg: scheme.primary,
          label: 'Bom sinal',
        ),
      InsightTone.warning => (
          bg: scheme.tertiary.withValues(alpha: 0.25),
          fg: scheme.onSurface,
          label: 'Vale atenção',
        ),
      InsightTone.neutral => (
          bg: scheme.surfaceContainerHighest,
          fg: context.mutedForeground,
          label: 'No radar',
        ),
    };
  }

  @override
  Widget build(BuildContext context) {
    final badge = _badge(context);
    final scheme = context.scheme;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: scheme.surface.withValues(alpha: 0.55),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: scheme.outline.withValues(alpha: 0.5)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF031533).withValues(alpha: 0.05),
            blurRadius: 12,
            offset: const Offset(0, 3),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(insight.title,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                  fontSize: 13, fontWeight: FontWeight.w600, height: 1.25)),
          const SizedBox(height: 4),
          Text(insight.description,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                  fontSize: 13,
                  height: 1.4,
                  color: scheme.onSurface.withValues(alpha: 0.85))),
          const SizedBox(height: 8),
          Align(
            alignment: Alignment.centerRight,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                  color: badge.bg, borderRadius: BorderRadius.circular(99)),
              child: Text(badge.label,
                  style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                      color: badge.fg)),
            ),
          ),
        ],
      ),
    );
  }
}
