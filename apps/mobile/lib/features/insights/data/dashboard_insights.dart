import '../../../core/format/formatters.dart';
import '../../../shared/models/categories.dart';
import '../../../shared/models/enums.dart';
import '../../../shared/models/goal.dart';
import '../../../shared/models/transaction.dart';

/// Réplica de apps/web/src/utils/dashboard-insights.ts — mesmas 5 leituras,
/// mesmos textos, mesma lógica de tom. As transações consideradas são as
/// **pagas** (postedTransactions no web).
enum InsightTone { neutral, positive, warning }

class DashboardInsight {
  DashboardInsight({
    required this.id,
    required this.title,
    required this.description,
    required this.tone,
  });

  final String id;
  final String title;
  final String description;
  final InsightTone tone;
}

({String category, double amount})? _topExpenseCategory(List<LineItem> items) {
  final totals = <String, double>{};
  for (final t in items) {
    if (t.type != TransactionType.expense) continue;
    totals[t.category] = (totals[t.category] ?? 0) + t.amount;
  }
  String? topCategory;
  var topAmount = 0.0;
  totals.forEach((category, amount) {
    if (amount > topAmount) {
      topCategory = category;
      topAmount = amount;
    }
  });
  if (topCategory == null) return null;
  return (category: topCategory!, amount: topAmount);
}

({Goal goal, double percentage})? _closestGoal(List<Goal> goals) {
  final withProgress = goals
      .where((g) => g.targetAmount > 0)
      .map((g) => (
            goal: g,
            percentage:
                ((g.currentAmount / g.targetAmount) * 100).clamp(0, 100).toDouble(),
          ))
      .where((e) => e.percentage < 100)
      .toList()
    ..sort((a, b) => b.percentage.compareTo(a.percentage));
  return withProgress.isEmpty ? null : withProgress.first;
}

/// Classifica o saldo atual conforme os limiares do perfil de gastos (seção 29
/// do CLAUDE.md) — não é mais um corte único de 50% da despesa pra todo mundo.
/// Negativo é sempre "ruim", independente do perfil.
({String label, String description, InsightTone tone}) _balanceStatus(
  double currentBalance,
  ({double ok, double good}) thresholds,
) {
  if (currentBalance < 0) {
    return (
      label: 'Saldo negativo',
      description:
          'Seu saldo atual está abaixo de zero e pede revisão das próximas movimentações.',
      tone: InsightTone.warning,
    );
  }
  if (currentBalance >= thresholds.good) {
    return (
      label: 'Saldo saudável',
      description: 'Seu saldo atual mantém uma folga confortável para o seu perfil de gastos.',
      tone: InsightTone.positive,
    );
  }
  if (currentBalance >= thresholds.ok) {
    return (
      label: 'Saldo em atenção',
      description: 'Seu saldo está numa faixa intermediária para o seu perfil — dá pra melhorar.',
      tone: InsightTone.neutral,
    );
  }
  return (
    label: 'Saldo baixo',
    description: 'Seu saldo está abaixo do esperado para o seu perfil de gastos.',
    tone: InsightTone.warning,
  );
}

List<DashboardInsight> buildDashboardInsights({
  required List<LineItem> paidTransactions,
  required List<Goal> goals,
  required double totalIncome,
  required double totalExpense,
  required double currentBalance,
  required ({double ok, double good}) spendingThresholds,
}) {
  final topExpense = _topExpenseCategory(paidTransactions);
  final expenseRatio =
      totalIncome > 0 ? ((totalExpense / totalIncome) * 100).round() : null;
  final closest = _closestGoal(goals);
  final balance = _balanceStatus(currentBalance, spendingThresholds);

  return [
    DashboardInsight(
      id: 'balance-status',
      title: balance.label,
      description: balance.description,
      tone: balance.tone,
    ),
    DashboardInsight(
      id: 'top-expense-category',
      title: topExpense != null
          ? 'Maior categoria de gasto: ${TransactionCategories.label(topExpense.category)}'
          : 'Maior categoria de gasto indisponível',
      description: topExpense != null
          ? 'Até agora, ${Fmt.currency(topExpense.amount)} saíram nessa categoria.'
          : 'Adicione saídas para entender onde seu dinheiro está concentrado.',
      tone: topExpense != null ? InsightTone.warning : InsightTone.neutral,
    ),
    DashboardInsight(
      id: 'expense-ratio',
      title: expenseRatio != null
          ? 'Saídas equivalem a $expenseRatio% das entradas'
          : 'Relação entre entradas e saídas indisponível',
      description: expenseRatio != null
          ? 'Essa leitura ajuda a entender o quanto sua receita já está comprometida.'
          : 'Registre entradas para acompanhar melhor o peso das saídas.',
      tone: expenseRatio == null
          ? InsightTone.neutral
          : (expenseRatio <= 70 ? InsightTone.positive : InsightTone.warning),
    ),
    DashboardInsight(
      id: 'active-goals',
      title:
          '${goals.length} meta${goals.length == 1 ? '' : 's'} ativa${goals.length == 1 ? '' : 's'}',
      description: goals.isNotEmpty
          ? 'Suas metas já fazem parte da leitura estratégica da dashboard.'
          : 'Crie metas para começar a acompanhar objetivos financeiros no MVP.',
      tone: goals.isNotEmpty ? InsightTone.positive : InsightTone.neutral,
    ),
    DashboardInsight(
      id: 'closest-goal',
      title: closest != null
          ? 'Meta mais próxima: ${closest.goal.title}'
          : 'Nenhuma meta próxima da conclusão ainda',
      description: closest != null
          ? '${closest.percentage.toStringAsFixed(0)}% concluído, faltando ${Fmt.currency((closest.goal.targetAmount - closest.goal.currentAmount).clamp(0, double.infinity))}.'
          : 'Conforme suas metas avançarem, esta seção mostra o objetivo mais perto de ser concluído.',
      tone: closest != null ? InsightTone.positive : InsightTone.neutral,
    ),
  ];
}
