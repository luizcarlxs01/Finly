import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme.dart';
import '../../../core/format/formatters.dart';
import '../../../core/widgets/widgets.dart';
import '../../../shared/models/financial_rule.dart';
import '../state/rules_controller.dart';
import 'rule_form_sheet.dart';

/// Espelha apps/web/src/components/dashboard/financial-rules-manager.tsx —
/// mostrado na aba Insights quando há conta + perfil (accountAutomationView).
class FinancialRulesManager extends ConsumerWidget {
  const FinancialRulesManager({super.key});

  static String _ruleTypeLabel(String value) => switch (value) {
        'Salary' => 'Salário',
        'RecurringIncome' => 'Receita recorrente',
        'RecurringExpense' => 'Despesa recorrente',
        'InstallmentExpense' => 'Despesa parcelada',
        _ => value,
      };

  static String? _recurrenceLabel(String? value) => switch (value) {
        'Indefinite' => 'Indefinida',
        'UntilDate' => 'Até uma data',
        'ForMonths' => 'Por meses',
        _ => value,
      };

  Future<void> _process(BuildContext context, WidgetRef ref) async {
    try {
      final result =
          await ref.read(rulesControllerProvider.notifier).process();
      if (context.mounted) {
        showInfoSnack(context,
            '${result.processedRuleCount} regra(s) processada(s), ${result.createdTransactionCount} transação(ões) criada(s).');
      }
    } catch (e) {
      if (context.mounted) showErrorSnack(context, e);
    }
  }

  Future<void> _delete(BuildContext context, WidgetRef ref, String id) async {
    try {
      await ref.read(rulesControllerProvider.notifier).deleteRule(id);
    } catch (e) {
      if (context.mounted) showErrorSnack(context, e);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final rulesAsync = ref.watch(rulesControllerProvider);
    final lastResult =
        ref.read(rulesControllerProvider.notifier).lastProcessingResult;
    final rules = rulesAsync.valueOrNull ?? const <FinancialRule>[];

    return FinlyCard(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Regras financeiras da conta',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Text(
            'Crie, ajuste e processe regras automáticas. O processamento gera transações reais a partir das regras ativas.',
            style: TextStyle(fontSize: 12.5, color: context.mutedForeground),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed:
                  rulesAsync.isLoading ? null : () => _process(context, ref),
              icon: const Icon(Icons.play_arrow, size: 18),
              label: const Text('Processar regras agora'),
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () => showRuleFormSheet(context),
              icon: const Icon(Icons.add, size: 16),
              label: const Text('Nova regra'),
            ),
          ),
          if (lastResult != null) ...[
            const SizedBox(height: 12),
            Text(
              '${lastResult.processedRuleCount} regra(s) processada(s) · '
              '${lastResult.createdTransactionCount} criada(s) · '
              '${lastResult.skippedTransactionCount} ignorada(s)',
              style: TextStyle(fontSize: 12, color: context.mutedForeground),
            ),
          ],
          const SizedBox(height: 12),
          if (rulesAsync.isLoading && !rulesAsync.hasValue)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (rulesAsync.hasError && !rulesAsync.hasValue)
            ErrorBanner(rulesAsync.error.toString())
          else if (rules.isEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: context.scheme.surface,
                borderRadius: BorderRadius.circular(AppColors.fieldRadius),
                border: Border.all(color: context.scheme.outline),
              ),
              child: Text(
                'Nenhuma regra financeira nesta conta ainda. Crie regras de receita, despesa recorrente ou parcelamento.',
                style:
                    TextStyle(fontSize: 12.5, color: context.mutedForeground),
              ),
            )
          else
            for (final rule in rules)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _RuleCard(
                  rule: rule,
                  typeLabel: _ruleTypeLabel(rule.ruleType),
                  recurrenceLabel: _recurrenceLabel(rule.recurrenceMode),
                  onEdit: () => showRuleFormSheet(context, rule: rule),
                  onRemove: () => _delete(context, ref, rule.id),
                ),
              ),
        ],
      ),
    );
  }
}

class _RuleCard extends StatelessWidget {
  const _RuleCard({
    required this.rule,
    required this.typeLabel,
    required this.recurrenceLabel,
    required this.onEdit,
    required this.onRemove,
  });

  final FinancialRule rule;
  final String typeLabel;
  final String? recurrenceLabel;
  final VoidCallback onEdit;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    final scheme = context.scheme;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(AppColors.fieldRadius),
        border: Border.all(color: scheme.outline),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 8,
            runSpacing: 6,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              Text(rule.title,
                  style: const TextStyle(
                      fontSize: 14, fontWeight: FontWeight.w700)),
              PillBadge(label: typeLabel),
              PillBadge(
                label: rule.isActive ? 'Ativa' : 'Inativa',
                background: rule.isActive
                    ? scheme.primary.withValues(alpha: 0.12)
                    : scheme.surfaceContainerHighest,
                foreground:
                    rule.isActive ? scheme.primary : context.mutedForeground,
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Valor: ${Fmt.currency(rule.amount)} · dia ${rule.dayOfMonth} · início ${Fmt.businessDate(rule.startDate) ?? rule.startDate}'
            '${recurrenceLabel != null ? ' · $recurrenceLabel' : ''}'
            '${rule.totalMonths != null ? ' · ${rule.isInstallment ? 'parcelas' : 'meses'}: ${rule.totalMonths}' : ''}',
            style: TextStyle(fontSize: 12, color: context.mutedForeground),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                      minimumSize: const Size.fromHeight(38)),
                  onPressed: onEdit,
                  child: const Text('Editar'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size.fromHeight(38),
                    foregroundColor: scheme.error,
                    side: BorderSide(color: scheme.error.withValues(alpha: 0.5)),
                  ),
                  onPressed: onRemove,
                  child: const Text('Remover'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
