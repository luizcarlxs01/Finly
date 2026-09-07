/// Espelha FinancialRuleResponseDto / apps/web/src/types/api-financial-rule.ts
/// e o resultado de RuleProcessing (ProcessFinancialRulesResponseDto).
class FinancialRule {
  FinancialRule({
    required this.id,
    required this.financialProfileId,
    required this.title,
    required this.amount,
    required this.ruleType,
    required this.recurrenceMode,
    required this.dayOfMonth,
    required this.startDate,
    required this.endDate,
    required this.totalMonths,
    required this.isActive,
    required this.lastProcessedDate,
  });

  final String id;
  final String financialProfileId;
  final String title;
  final double amount;
  final String ruleType;
  final String? recurrenceMode;
  final int dayOfMonth;
  final String startDate;
  final String? endDate;
  final int? totalMonths;
  final bool isActive;
  final String? lastProcessedDate;

  factory FinancialRule.fromJson(Map<String, dynamic> json) => FinancialRule(
        id: json['id'] as String,
        financialProfileId: json['financialProfileId'] as String? ?? '',
        title: json['title'] as String? ?? '',
        amount: (json['amount'] as num?)?.toDouble() ?? 0,
        ruleType: json['ruleType'] as String? ?? '',
        recurrenceMode: json['recurrenceMode'] as String?,
        dayOfMonth: (json['dayOfMonth'] as num?)?.toInt() ?? 1,
        startDate: (json['startDate'] as String? ?? '').split('T').first,
        endDate: (json['endDate'] as String?)?.split('T').first,
        totalMonths: (json['totalMonths'] as num?)?.toInt(),
        isActive: json['isActive'] as bool? ?? false,
        lastProcessedDate:
            (json['lastProcessedDate'] as String?)?.split('T').first,
      );

  bool get isInstallment => ruleType == 'InstallmentExpense';
}

class RuleProcessingResult {
  RuleProcessingResult({
    required this.processedRuleCount,
    required this.createdTransactionCount,
    required this.skippedTransactionCount,
  });

  final int processedRuleCount;
  final int createdTransactionCount;
  final int skippedTransactionCount;

  factory RuleProcessingResult.fromJson(Map<String, dynamic> json) =>
      RuleProcessingResult(
        processedRuleCount: (json['processedRuleCount'] as num?)?.toInt() ?? 0,
        createdTransactionCount:
            (json['createdTransactionCount'] as num?)?.toInt() ?? 0,
        skippedTransactionCount:
            (json['skippedTransactionCount'] as num?)?.toInt() ?? 0,
      );
}
