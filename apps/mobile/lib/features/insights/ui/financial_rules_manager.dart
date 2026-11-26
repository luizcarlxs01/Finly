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
/// O formulário (inline na web) abre numa folha: "Nova regra" / "Editar".
class FinancialRulesManager extends ConsumerStatefulWidget {
  const FinancialRulesManager({super.key});

  static String ruleTypeLabel(String value) => switch (value) {
        'Salary' => 'Salário',
        'RecurringIncome' => 'Receita recorrente',
        'RecurringExpense' => 'Despesa recorrente',
        'InstallmentExpense' => 'Despesa parcelada',
        _ => value,
      };

  static String? recurrenceLabel(String? value) => switch (value) {
        'Indefinite' => 'Indefinida',
        'UntilDate' => 'Até uma data',
        'ForMonths' => 'Por meses',
        _ => value,
      };

  @override
  ConsumerState<FinancialRulesManager> createState() =>
      _FinancialRulesManagerState();
}

class _FinancialRulesManagerState extends ConsumerState<FinancialRulesManager> {
  bool _processing = false;
  String? _processError;
  String? _actionError;

  Future<void> _process() async {
    setState(() {
      _processing = true;
      _processError = null;
    });
    try {
      await ref.read(rulesControllerProvider.notifier).process();
    } catch (e) {
      if (mounted) setState(() => _processError = e.toString());
    } finally {
      if (mounted) setState(() => _processing = false);
    }
  }

  Future<void> _delete(String id) async {
    setState(() => _actionError = null);
    try {
      await ref.read(rulesControllerProvider.notifier).deleteRule(id);
    } catch (e) {
      if (mounted) setState(() => _actionError = e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    final rulesAsync = ref.watch(rulesControllerProvider);
    final lastResult =
        ref.read(rulesControllerProvider.notifier).lastProcessingResult;
    final rules = rulesAsync.valueOrNull ?? const <FinancialRule>[];
    final isLoading = rulesAsync.isLoading && !rulesAsync.hasValue;

    return FinlyCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Regras financeiras da conta',
              style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w600,
                  color: context.scheme.onSurface)),
          const SizedBox(height: 8),
          Text(
            'Crie, ajuste e processe regras automáticas sem sair da UI principal.',
            style: TextStyle(
                fontSize: 14, height: 1.5, color: context.mutedForeground),
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: (_processing || isLoading) ? null : _process,
            icon: _processing
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Icons.play_arrow, size: 18),
            label:
                Text(_processing ? 'Processando...' : 'Processar regras agora'),
          ),
          const SizedBox(height: 16),
          _Notice(
            color: context.mutedForeground,
            border: context.scheme.outline.withValues(alpha: 0.5),
            text:
                'O processamento gera transações reais a partir das regras ativas. O saldo atual continua considerando apenas lançamentos com data até hoje.',
          ),
          if (_processError != null) ...[
            const SizedBox(height: 12),
            _Notice(
              color: context.scheme.error,
              border: context.scheme.error.withValues(alpha: 0.25),
              background: context.scheme.error.withValues(alpha: 0.05),
              text: _processError!,
            ),
          ],
          if (lastResult != null) ...[
            const SizedBox(height: 12),
            _StatBox(
                label: 'Regras processadas',
                value: lastResult.processedRuleCount),
            const SizedBox(height: 8),
            _StatBox(
                label: 'Transações criadas',
                value: lastResult.createdTransactionCount),
            const SizedBox(height: 8),
            _StatBox(
                label: 'Transações ignoradas',
                value: lastResult.skippedTransactionCount),
          ],
          const SizedBox(height: 16),
          OutlinedButton.icon(
            onPressed: () => showRuleFormSheet(context),
            icon: const Icon(Icons.add, size: 16),
            label: const Text('Nova regra'),
          ),
          if (_actionError != null) ...[
            const SizedBox(height: 12),
            _Notice(
              color: context.scheme.error,
              border: context.scheme.error.withValues(alpha: 0.25),
              background: context.scheme.error.withValues(alpha: 0.05),
              text: _actionError!,
            ),
          ],
          const SizedBox(height: 16),
          if (isLoading)
            const _DashedBox(text: 'Carregando regras financeiras...')
          else if (rulesAsync.hasError && !rulesAsync.hasValue)
            ErrorBanner(rulesAsync.error.toString())
          else if (rules.isEmpty)
            const _DashedBox(
                text: 'Nenhuma regra financeira criada nesta conta ainda.')
          else
            for (final rule in rules)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _RuleCard(
                  rule: rule,
                  onEdit: () => showRuleFormSheet(context, rule: rule),
                  onRemove: () => _delete(rule.id),
                ),
              ),
        ],
      ),
    );
  }
}

class _Notice extends StatelessWidget {
  const _Notice({
    required this.text,
    required this.color,
    required this.border,
    this.background,
  });

  final String text;
  final Color color;
  final Color border;
  final Color? background;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: background ?? context.scheme.surface.withValues(alpha: 0.35),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: border),
        ),
        child: Text(text, style: TextStyle(fontSize: 14, color: color)),
      );
}

class _StatBox extends StatelessWidget {
  const _StatBox({required this.label, required this.value});
  final String label;
  final int value;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: context.scheme.surface.withValues(alpha: 0.4),
          borderRadius: BorderRadius.circular(10),
          border:
              Border.all(color: context.scheme.outline.withValues(alpha: 0.5)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label,
                style: TextStyle(fontSize: 12, color: context.mutedForeground)),
            const SizedBox(height: 4),
            Text('$value',
                style:
                    const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
          ],
        ),
      );
}

class _DashedBox extends StatelessWidget {
  const _DashedBox({required this.text});
  final String text;

  @override
  Widget build(BuildContext context) => Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 28),
        decoration: BoxDecoration(
          color: context.scheme.surface.withValues(alpha: 0.35),
          borderRadius: BorderRadius.circular(14),
          border:
              Border.all(color: context.scheme.outline.withValues(alpha: 0.6)),
        ),
        child: Text(text,
            style: TextStyle(fontSize: 14, color: context.mutedForeground)),
      );
}

class _RuleCard extends StatelessWidget {
  const _RuleCard({
    required this.rule,
    required this.onEdit,
    required this.onRemove,
  });

  final FinancialRule rule;
  final VoidCallback onEdit;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    final scheme = context.scheme;
    final muted = TextStyle(fontSize: 14, color: context.mutedForeground);
    final recurrence =
        FinancialRulesManager.recurrenceLabel(rule.recurrenceMode);
    final lines = <String>[
      'Valor: ${Fmt.currency(rule.amount)}',
      'Dia do mês: ${rule.dayOfMonth}',
      'Início: ${Fmt.businessDate(rule.startDate) ?? rule.startDate}',
      if (rule.endDate != null)
        'Fim: ${Fmt.businessDate(rule.endDate) ?? rule.endDate}',
      if (recurrence != null) 'Recorrência: $recurrence',
      if (rule.totalMonths != null)
        '${rule.isInstallment ? 'Parcelas' : 'Meses'}: ${rule.totalMonths}',
      if (rule.lastProcessedDate != null)
        'Último processamento: ${Fmt.businessDate(rule.lastProcessedDate) ?? rule.lastProcessedDate}',
    ];

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: scheme.surface.withValues(alpha: 0.35),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: scheme.outline.withValues(alpha: 0.5)),
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
                      fontSize: 16, fontWeight: FontWeight.w600)),
              PillBadge(
                label: FinancialRulesManager.ruleTypeLabel(rule.ruleType),
                background: scheme.surfaceContainerHighest,
                foreground: context.mutedForeground,
              ),
              PillBadge(
                label: rule.isActive ? 'Ativa' : 'Inativa',
                background: rule.isActive
                    ? scheme.primary.withValues(alpha: 0.10)
                    : scheme.surfaceContainerHighest,
                foreground:
                    rule.isActive ? scheme.primary : context.mutedForeground,
              ),
            ],
          ),
          const SizedBox(height: 10),
          for (final line in lines)
            Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Text(line, style: muted),
            ),
          const SizedBox(height: 6),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                      minimumSize: const Size.fromHeight(42)),
                  onPressed: onEdit,
                  child: const Text('Editar'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: FilledButton.icon(
                  style: FilledButton.styleFrom(
                    minimumSize: const Size.fromHeight(42),
                    backgroundColor: scheme.error.withValues(alpha: 0.12),
                    foregroundColor: scheme.error,
                  ),
                  onPressed: onRemove,
                  icon: const Icon(Icons.delete_outline, size: 16),
                  label: const Text('Remover'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
