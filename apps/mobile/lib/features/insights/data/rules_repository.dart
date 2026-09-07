import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../shared/models/financial_rule.dart';

/// Payload de criação/edição de regra — espelha UpsertApiFinancialRuleRequest
/// (apps/web/src/lib/api/financial-rules.ts).
class RuleInput {
  RuleInput({
    required this.title,
    required this.amount,
    required this.ruleType,
    required this.recurrenceMode,
    required this.dayOfMonth,
    required this.startDate,
    required this.endDate,
    required this.totalMonths,
    required this.isActive,
  });

  final String title;
  final double amount;
  final String ruleType;
  final String? recurrenceMode;
  final int dayOfMonth;
  final String startDate;
  final String? endDate;
  final int? totalMonths;
  final bool isActive;

  Map<String, dynamic> toJson(String profileId) => {
        'financialProfileId': profileId,
        'title': title.trim(),
        'amount': amount,
        'ruleType': ruleType,
        'recurrenceMode': recurrenceMode,
        'dayOfMonth': dayOfMonth,
        'startDate': startDate,
        'endDate': endDate,
        'totalMonths': totalMonths,
        'isActive': isActive,
      };
}

/// Espelha apps/web/src/lib/api/{financial-rules,rule-processing}.ts.
class RulesRepository {
  RulesRepository(this._client);

  final ApiClient _client;

  Future<List<FinancialRule>> getRules(String profileId) async {
    final list = await _client.get<List<dynamic>>(
      '/api/FinancialRules',
      query: {'financialProfileId': profileId},
    );
    return list
        .map((e) => FinancialRule.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> createRule(RuleInput input, String profileId) =>
      _client.post<Map<String, dynamic>>('/api/FinancialRules',
          body: input.toJson(profileId));

  Future<void> updateRule(String id, RuleInput input, String profileId) =>
      _client.put<Map<String, dynamic>>('/api/FinancialRules/$id',
          body: input.toJson(profileId));

  Future<void> deleteRule(String id) =>
      _client.delete('/api/FinancialRules/$id');

  Future<RuleProcessingResult> process(String profileId) async {
    final now = DateTime.now();
    final referenceDate = '${now.year.toString().padLeft(4, '0')}-'
        '${now.month.toString().padLeft(2, '0')}-'
        '${now.day.toString().padLeft(2, '0')}';
    final json = await _client.post<Map<String, dynamic>>(
      '/api/RuleProcessing/$profileId',
      body: {'referenceDate': referenceDate},
    );
    return RuleProcessingResult.fromJson(json);
  }
}

final rulesRepositoryProvider = Provider<RulesRepository>(
  (ref) => RulesRepository(ref.read(apiClientProvider)),
);
