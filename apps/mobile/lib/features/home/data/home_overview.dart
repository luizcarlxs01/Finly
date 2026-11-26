import '../../../shared/models/enums.dart';
import '../../../shared/models/transaction.dart';

enum HomePeriod { sixMonths, ytd, year }

class MonthlyFlow {
  const MonthlyFlow(this.key, this.income, this.expense);

  final String key;
  final double income;
  final double expense;
}

/// Mesma seleção de dados do DashboardHomeView da web: somente ocorrências
/// pagas com data até hoje entram nas transações recentes e no fluxo mensal.
class HomeOverview {
  const HomeOverview({
    required this.recent,
    required this.months,
    required this.monthlyResult,
    required this.insightTitle,
    required this.insightBadge,
    required this.insightDescription,
  });

  final List<LineItem> recent;
  final List<MonthlyFlow> months;
  final double monthlyResult;
  final String insightTitle;
  final String insightBadge;
  final String insightDescription;

  static HomeOverview build({
    required List<LineItem> items,
    required double currentBalance,
    required DateTime today,
    required HomePeriod period,
  }) {
    final todayKey = _dateKey(today);
    final recent = items
        .where((item) => item.isPaid && item.dueDate.compareTo(todayKey) <= 0)
        .toList()
      ..sort((a, b) {
        final byDate = b.dueDate.compareTo(a.dueDate);
        return byDate != 0
            ? byDate
            : b.contract.createdAt.compareTo(a.contract.createdAt);
      });

    final count = switch (period) {
      HomePeriod.sixMonths => 6,
      HomePeriod.ytd => today.month,
      HomePeriod.year => 12,
    };
    final months = <MonthlyFlow>[];
    for (var index = 0; index < count; index++) {
      final month = DateTime(today.year, today.month - count + index + 1);
      final key = '${month.year}-${month.month.toString().padLeft(2, '0')}';
      final matching = recent.where((item) => item.dueDate.startsWith(key));
      final income = matching
          .where((item) => item.type == TransactionType.income)
          .fold<double>(0, (sum, item) => sum + item.amount);
      final expense = matching
          .where((item) => item.type == TransactionType.expense)
          .fold<double>(0, (sum, item) => sum + item.amount);
      months.add(MonthlyFlow(key, income, expense));
    }

    final current = months.last;
    final healthy =
        current.expense > 0 && currentBalance >= current.expense * 2;
    final noExpenses = current.expense == 0;
    return HomeOverview(
      recent: recent,
      months: months,
      monthlyResult: current.income - current.expense,
      insightTitle: healthy
          ? 'Saldo saudável'
          : noExpenses
              ? 'Saldo sem comparação'
              : 'Acompanhe o saldo',
      insightBadge: healthy
          ? 'Bom sinal'
          : noExpenses
              ? 'Sem dados'
              : 'Atenção',
      insightDescription: healthy
          ? 'Seu saldo atual cobre pelo menos duas vezes as despesas lançadas neste mês.'
          : noExpenses
              ? 'Ainda não há despesas neste mês para avaliar o saldo.'
              : currentBalance <= 0
                  ? 'Seu saldo atual não cobre as despesas lançadas neste mês.'
                  : 'Seu saldo atual cobre menos de duas vezes as despesas lançadas neste mês.',
    );
  }

  static String _dateKey(DateTime date) =>
      '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
}
