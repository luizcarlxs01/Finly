import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../shared/models/goal.dart';

/// Espelha apps/web/src/lib/api/goals.ts.
class GoalsRepository {
  GoalsRepository(this._client);

  final ApiClient _client;

  Future<List<Goal>> getGoals(String profileId) async {
    final list = await _client.get<List<dynamic>>(
      '/api/Goals',
      query: {'financialProfileId': profileId},
    );
    return list.map((e) => Goal.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> createGoal({
    required String profileId,
    required String title,
    required double targetAmount,
    required double currentAmount,
    String? deadline,
  }) {
    return _client.post<Map<String, dynamic>>(
      '/api/Goals',
      body: {
        'financialProfileId': profileId,
        'title': title.trim(),
        'targetAmount': targetAmount,
        'currentAmount': currentAmount,
        'deadline': deadline,
      },
    );
  }

  Future<void> updateProgress(String goalId, double currentAmount) {
    return _client.patch<Map<String, dynamic>>(
      '/api/Goals/$goalId/progress',
      body: {'currentAmount': currentAmount},
    );
  }

  Future<void> deleteGoal(String goalId) => _client.delete('/api/Goals/$goalId');
}

final goalsRepositoryProvider = Provider<GoalsRepository>(
  (ref) => GoalsRepository(ref.read(apiClientProvider)),
);
