class Goal {
  final String id;
  final String title;
  final double targetAmount;
  final double currentAmount;
  final String category;
  final String? deadline;
  final String createdAt;

  const Goal({
    required this.id,
    required this.title,
    required this.targetAmount,
    required this.currentAmount,
    required this.category,
    required this.deadline,
    required this.createdAt,
  });

  double get progress =>
      targetAmount <= 0 ? 0 : (currentAmount / targetAmount).clamp(0.0, 1.0);

  double get remaining =>
      (targetAmount - currentAmount).clamp(0.0, double.infinity);

  factory Goal.fromJson(Map<String, dynamic> json) {
    return Goal(
      id: json['id'] as String,
      title: json['title'] as String,
      targetAmount: (json['targetAmount'] as num).toDouble(),
      currentAmount: (json['currentAmount'] as num).toDouble(),
      category: json['category'] as String? ?? 'geral',
      deadline: json['deadline'] as String?,
      createdAt: json['createdAt'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'targetAmount': targetAmount,
      'currentAmount': currentAmount,
      'category': category,
      'deadline': deadline,
      'createdAt': createdAt,
    };
  }

  Goal copyWith({
    String? title,
    double? targetAmount,
    double? currentAmount,
    String? category,
    String? deadline,
  }) {
    return Goal(
      id: id,
      title: title ?? this.title,
      targetAmount: targetAmount ?? this.targetAmount,
      currentAmount: currentAmount ?? this.currentAmount,
      category: category ?? this.category,
      deadline: deadline ?? this.deadline,
      createdAt: createdAt,
    );
  }
}
