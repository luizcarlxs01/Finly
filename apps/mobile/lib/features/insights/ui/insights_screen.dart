import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/app.dart';
import '../../../app/shell.dart';
import '../../../app/theme.dart';
import '../../../core/finance_source.dart';
import '../../../core/widgets/widgets.dart';
import '../../goals/state/goals_controller.dart';
import '../../transactions/state/finance_controller.dart';
import '../../transactions/state/simulation_controller.dart';
import '../data/dashboard_insights.dart';
import '../state/rules_controller.dart';
import 'financial_rules_manager.dart';
import 'forecast_card.dart';

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
    final insights = buildDashboardInsights(
      paidTransactions: paid,
      goals: goals,
      totalIncome: finance.totalIncome,
      totalExpense: finance.totalExpense,
      currentBalance: finance.currentBalance,
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
      appBar:
          const FinlyAppBar(title: 'Insights', themeToggle: ThemeToggleButton()),
      body: RefreshIndicator(
        onRefresh: () async {
          await ref.read(financeControllerProvider.notifier).refresh();
          await ref.read(goalsControllerProvider.notifier).refresh();
          await ref.read(rulesControllerProvider.notifier).refresh();
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Align(
                alignment: Alignment.centerLeft,
                child: SectionHeader(
                  subtitle: 'Veja leituras rápidas sobre sua vida financeira.',
                ),
              ),
              const SizedBox(height: 16),
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
                FinlyCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Leituras rápidas',
                          style: TextStyle(
                              fontSize: 17, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 2),
                      Text(
                        'Sinais simples para te ajudar a entender o momento atual.',
                        style: TextStyle(
                            fontSize: 12.5, color: context.mutedForeground),
                      ),
                      const SizedBox(height: 12),
                      ...insights.map((i) => Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: _InsightTile(insight: i),
                          )),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                ForecastCard(
                  totalIncome: forecast.totalIncome,
                  totalExpense: forecast.totalExpense,
                  projectedBalance: forecast.projectedBalance,
                ),
                const SizedBox(height: 12),
                FinlyCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Mais contexto, no seu tempo',
                          style: TextStyle(
                              fontSize: 15, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 4),
                      Text('Mais análises em breve.',
                          style: TextStyle(
                              fontSize: 12.5, color: context.mutedForeground)),
                    ],
                  ),
                ),
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

  ({Color bg, Color border, Color badge, String label}) _tone(
      BuildContext context) {
    final scheme = context.scheme;
    return switch (insight.tone) {
      InsightTone.positive => (
          bg: scheme.primary.withValues(alpha: 0.10),
          border: scheme.primary.withValues(alpha: 0.20),
          badge: scheme.primary,
          label: 'Bom sinal',
        ),
      InsightTone.warning => (
          bg: scheme.tertiary.withValues(alpha: 0.25),
          border: scheme.tertiary.withValues(alpha: 0.6),
          badge: scheme.onSurface,
          label: 'Vale atenção',
        ),
      InsightTone.neutral => (
          bg: scheme.surface,
          border: scheme.outline,
          badge: context.mutedForeground,
          label: 'No radar',
        ),
    };
  }

  @override
  Widget build(BuildContext context) {
    final tone = _tone(context);
    return Container(
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
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(insight.title,
                    style: const TextStyle(
                        fontSize: 13.5, fontWeight: FontWeight.w700)),
              ),
              const SizedBox(width: 8),
              PillBadge(label: tone.label, foreground: tone.badge),
            ],
          ),
          const SizedBox(height: 6),
          Text(insight.description,
              style: const TextStyle(fontSize: 13, height: 1.4)),
        ],
      ),
    );
  }
}
