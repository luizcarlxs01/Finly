/// Espelha GoalResponseDto / apps/web/src/types/api-goal.ts (modo API) e o
/// Goal do `use-local-goals.ts` (modo sem conta — carrega `category`).
class Goal {
  Goal({
    required this.id,
    required this.financialProfileId,
    required this.title,
    required this.targetAmount,
    required this.currentAmount,
    required this.deadline,
    required this.status,
    this.category = 'general',
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  final String id;
  final String financialProfileId;
  final String title;
  final double targetAmount;
  final double currentAmount;

  /// "YYYY-MM-DD" ou null.
  final String? deadline;
  final String status;

  /// Só o modo local acompanha categoria; no modo API é sempre "general"
  /// (mapApiGoalToGoal do web).
  final String category;
  final DateTime createdAt;

  factory Goal.fromJson(Map<String, dynamic> json) => Goal(
        id: json['id'] as String,
        financialProfileId: json['financialProfileId'] as String? ?? '',
        title: json['title'] as String? ?? '',
        targetAmount: (json['targetAmount'] as num?)?.toDouble() ?? 0,
        currentAmount: (json['currentAmount'] as num?)?.toDouble() ?? 0,
        deadline: (json['deadline'] as String?)?.split('T').first,
        status: json['status'] as String? ?? '',
        category: (json['category'] as String?)?.trim().toLowerCase().isNotEmpty ==
                true
            ? (json['category'] as String).trim().toLowerCase()
            : 'general',
        createdAt: DateTime.tryParse(json['createdAt'] as String? ?? ''),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'financialProfileId': financialProfileId,
        'title': title,
        'targetAmount': targetAmount,
        'currentAmount': currentAmount,
        'deadline': deadline,
        'status': status,
        'category': category,
        'createdAt': createdAt.toIso8601String(),
      };

  Goal copyWith({double? currentAmount}) => Goal(
        id: id,
        financialProfileId: financialProfileId,
        title: title,
        targetAmount: targetAmount,
        currentAmount: currentAmount ?? this.currentAmount,
        deadline: deadline,
        status: status,
        category: category,
        createdAt: createdAt,
      );

  /// 0..100, teto em 100 — getGoalProgress do web (goal-list.tsx).
  double get progressPercent {
    if (targetAmount <= 0) return 0;
    return ((currentAmount / targetAmount) * 100).clamp(0, 100).toDouble();
  }

  double get remainingAmount =>
      (targetAmount - currentAmount).clamp(0, double.infinity).toDouble();
}
