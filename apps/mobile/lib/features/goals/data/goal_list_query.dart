import '../../../shared/models/categories.dart';
import '../../../shared/models/goal.dart';

enum GoalTab { active, completed, all }

enum GoalSort {
  newest,
  nearestDeadline,
  closestProgress,
  furthestProgress,
  highestCurrent,
  highestTarget,
}

class GoalListResult {
  const GoalListResult({
    required this.visible,
    required this.filteredCount,
    required this.activeCount,
    required this.completedCount,
    required this.approachingCount,
    required this.pageCount,
  });

  final List<Goal> visible;
  final int filteredCount;
  final int activeCount;
  final int completedCount;
  final int approachingCount;
  final int pageCount;
}

/// Filtros e paginação usados no painel de metas da web, em forma independente
/// de widget para manter a mesma seleção em telas de qualquer largura.
class GoalListQuery {
  const GoalListQuery({
    required this.goals,
    required this.today,
    this.tab = GoalTab.active,
    this.search = '',
    this.category,
    this.from,
    this.to,
    this.sort = GoalSort.newest,
    this.page = 1,
    this.pageSize = 5,
  });

  final List<Goal> goals;
  final DateTime today;
  final GoalTab tab;
  final String search;
  final String? category;
  final String? from;
  final String? to;
  final GoalSort sort;
  final int page;
  final int? pageSize;

  GoalListResult resolve() {
    final query = search.trim().toLowerCase();
    final matching = goals.where((goal) {
      final categoryLabel = TransactionCategories.goalLabel(goal.category);
      final searchable = '${goal.title} $categoryLabel'.toLowerCase();
      if (query.isNotEmpty && !searchable.contains(query)) return false;
      if (category != null &&
          category!.isNotEmpty &&
          goal.category != category &&
          !(category == 'general' && goal.category == 'geral')) {
        return false;
      }
      if (from != null &&
          to != null &&
          (goal.deadline == null ||
              goal.deadline!.compareTo(from!) < 0 ||
              goal.deadline!.compareTo(to!) > 0)) {
        return false;
      }
      return true;
    }).toList();
    final activeCount = matching.where((g) => g.progressPercent < 100).length;
    final todayKey = _key(today);
    final untilKey = _key(today.add(const Duration(days: 30)));
    final approachingCount = matching
        .where((goal) =>
            goal.progressPercent < 100 &&
            goal.deadline != null &&
            goal.deadline!.compareTo(todayKey) >= 0 &&
            goal.deadline!.compareTo(untilKey) <= 0)
        .length;
    final filtered = matching
        .where((goal) => switch (tab) {
              GoalTab.active => goal.progressPercent < 100,
              GoalTab.completed => goal.progressPercent >= 100,
              GoalTab.all => true,
            })
        .toList();
    filtered.sort((a, b) {
      final compared = switch (sort) {
        GoalSort.newest => 0,
        GoalSort.nearestDeadline =>
          (a.deadline ?? '9999').compareTo(b.deadline ?? '9999'),
        GoalSort.closestProgress =>
          b.progressPercent.compareTo(a.progressPercent),
        GoalSort.furthestProgress =>
          a.progressPercent.compareTo(b.progressPercent),
        GoalSort.highestCurrent => b.currentAmount.compareTo(a.currentAmount),
        GoalSort.highestTarget => b.targetAmount.compareTo(a.targetAmount),
      };
      return compared != 0
          ? compared
          : b.createdAt.compareTo(a.createdAt) != 0
              ? b.createdAt.compareTo(a.createdAt)
              : a.id.compareTo(b.id);
    });
    final size =
        pageSize == null || pageSize! < 1 ? filtered.length : pageSize!;
    final pageCount =
        size == 0 ? 1 : (filtered.length / size).ceil().clamp(1, 999999);
    final safePage = page.clamp(1, pageCount);
    final visible = size == 0
        ? <Goal>[]
        : filtered.skip((safePage - 1) * size).take(size).toList();
    return GoalListResult(
      visible: visible,
      filteredCount: filtered.length,
      activeCount: activeCount,
      completedCount: matching.length - activeCount,
      approachingCount: approachingCount,
      pageCount: pageCount,
    );
  }

  static String _key(DateTime date) =>
      '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
}
