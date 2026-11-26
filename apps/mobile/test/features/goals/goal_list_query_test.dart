import 'package:flutter_test/flutter_test.dart';
import 'package:finly_mobile/features/goals/data/goal_list_query.dart';
import 'package:finly_mobile/shared/models/goal.dart';

void main() {
  final goals = [
    goal('Viagem', 100, 20, '2026-12-02', 'lazer'),
    goal('Reserva', 200, 200, '2026-12-20', 'general'),
    goal('Notebook', 200, 80, null, 'compras'),
  ];

  test('conta status e prazos e filtra metas em andamento', () {
    final result = GoalListQuery(
      goals: goals,
      today: DateTime(2026, 11, 25),
      tab: GoalTab.active,
    ).resolve();

    expect(result.activeCount, 2);
    expect(result.completedCount, 1);
    expect(result.approachingCount, 1);
    expect(result.visible.map((g) => g.title), ['Notebook', 'Viagem']);
  });

  test('busca por título, categoria e ordena pelo prazo mais próximo', () {
    final result = GoalListQuery(
      goals: goals,
      today: DateTime(2026, 11, 25),
      tab: GoalTab.all,
      search: '',
      sort: GoalSort.nearestDeadline,
    ).resolve();

    expect(
        result.visible.map((g) => g.title), ['Viagem', 'Reserva', 'Notebook']);
    final searched = GoalListQuery(
      goals: goals,
      today: DateTime(2026, 11, 25),
      tab: GoalTab.all,
      search: 'vi',
    ).resolve();
    expect(searched.visible.map((g) => g.title), ['Viagem']);
  });
}

Goal goal(String title, double target, double current, String? deadline,
        String category) =>
    Goal(
      id: title,
      financialProfileId: '',
      title: title,
      targetAmount: target,
      currentAmount: current,
      deadline: deadline,
      status: '',
      category: category,
      createdAt: DateTime(2026, 11, title == 'Notebook' ? 3 : 2),
    );
