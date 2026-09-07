/// Espelha DashboardSummaryResponseDto / apps/web/src/types/dashboard.ts.
///
/// Regra de negócio (seção 10 + 21 do CLAUDE.md): `currentBalance` é a soma das
/// Occurrences com status `Paid` — o backend calcula, o mobile só exibe.
class DashboardSummary {
  DashboardSummary({
    required this.initialBalance,
    required this.totalIncome,
    required this.totalExpense,
    required this.currentBalance,
    required this.transactionCount,
    required this.goalCount,
    required this.completedGoalCount,
  });

  final double initialBalance;
  final double totalIncome;
  final double totalExpense;
  final double currentBalance;
  final int transactionCount;
  final int goalCount;
  final int completedGoalCount;

  factory DashboardSummary.fromJson(Map<String, dynamic> json) =>
      DashboardSummary(
        initialBalance: (json['initialBalance'] as num?)?.toDouble() ?? 0,
        totalIncome: (json['totalIncome'] as num?)?.toDouble() ?? 0,
        totalExpense: (json['totalExpense'] as num?)?.toDouble() ?? 0,
        currentBalance: (json['currentBalance'] as num?)?.toDouble() ?? 0,
        transactionCount: (json['transactionCount'] as num?)?.toInt() ?? 0,
        goalCount: (json['goalCount'] as num?)?.toInt() ?? 0,
        completedGoalCount: (json['completedGoalCount'] as num?)?.toInt() ?? 0,
      );

  static final empty = DashboardSummary(
    initialBalance: 0,
    totalIncome: 0,
    totalExpense: 0,
    currentBalance: 0,
    transactionCount: 0,
    goalCount: 0,
    completedGoalCount: 0,
  );
}
