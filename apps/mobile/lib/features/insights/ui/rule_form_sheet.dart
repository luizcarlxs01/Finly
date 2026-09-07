import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/form_fields.dart';
import '../../../core/widgets/widgets.dart';
import '../../../shared/models/financial_rule.dart';
import '../../transactions/ui/sheet_scaffold.dart';
import '../data/rules_repository.dart';
import '../state/rules_controller.dart';

/// Espelha o formulário de apps/web/src/components/dashboard/financial-rules-manager.tsx.
Future<void> showRuleFormSheet(BuildContext context, {FinancialRule? rule}) {
  return showFinlySheet(
    context: context,
    title: rule == null ? 'Nova regra' : 'Editar regra',
    builder: (_) => _RuleFormSheet(rule: rule),
  );
}

const _ruleTypes = {
  'Salary': 'Salário',
  'RecurringIncome': 'Receita recorrente',
  'RecurringExpense': 'Despesa recorrente',
  'InstallmentExpense': 'Despesa parcelada',
};

const _recurrenceModes = {
  'Indefinite': 'Indefinida',
  'UntilDate': 'Até uma data',
  'ForMonths': 'Por meses',
};

class _RuleFormSheet extends ConsumerStatefulWidget {
  const _RuleFormSheet({this.rule});
  final FinancialRule? rule;

  @override
  ConsumerState<_RuleFormSheet> createState() => _RuleFormSheetState();
}

class _RuleFormSheetState extends ConsumerState<_RuleFormSheet> {
  late final TextEditingController _title;
  late final TextEditingController _amount;
  late final TextEditingController _dayOfMonth;
  late final TextEditingController _totalMonths;
  late String _ruleType;
  late String _recurrenceMode;
  late String _startDate;
  late String _endDate;
  late bool _isActive;
  bool _busy = false;

  bool get _isRecurring => _ruleType != 'InstallmentExpense';
  bool get _showEndDate => _isRecurring && _recurrenceMode == 'UntilDate';
  bool get _showTotalMonths =>
      _ruleType == 'InstallmentExpense' ||
      (_isRecurring && _recurrenceMode == 'ForMonths');

  @override
  void initState() {
    super.initState();
    final r = widget.rule;
    _title = TextEditingController(text: r?.title ?? '');
    _amount = TextEditingController(
        text: r != null ? r.amount.toStringAsFixed(2) : '');
    _dayOfMonth =
        TextEditingController(text: r != null ? r.dayOfMonth.toString() : '');
    _totalMonths =
        TextEditingController(text: r?.totalMonths?.toString() ?? '');
    _ruleType = r?.ruleType ?? 'Salary';
    _recurrenceMode = r?.recurrenceMode ??
        (_ruleType == 'InstallmentExpense' ? 'Indefinite' : 'Indefinite');
    _startDate = r?.startDate.isNotEmpty == true ? r!.startDate : _today();
    _endDate = r?.endDate ?? _today();
    _isActive = r?.isActive ?? true;
  }

  static String _today() {
    final n = DateTime.now();
    return '${n.year.toString().padLeft(4, '0')}-'
        '${n.month.toString().padLeft(2, '0')}-'
        '${n.day.toString().padLeft(2, '0')}';
  }

  @override
  void dispose() {
    _title.dispose();
    _amount.dispose();
    _dayOfMonth.dispose();
    _totalMonths.dispose();
    super.dispose();
  }

  RuleInput? _build() {
    final title = _title.text.trim();
    final amount = parseAmount(_amount.text) ?? 0;
    final day = int.tryParse(_dayOfMonth.text) ?? 0;
    final totalMonths =
        _totalMonths.text.trim().isEmpty ? null : int.tryParse(_totalMonths.text);

    if (title.isEmpty ||
        amount <= 0 ||
        day < 1 ||
        day > 31 ||
        _startDate.isEmpty) {
      return null;
    }
    final recurrenceMode = _isRecurring ? _recurrenceMode : null;
    if (_isRecurring && recurrenceMode == null) return null;
    if (recurrenceMode == 'UntilDate' && _endDate.isEmpty) return null;
    if (_showTotalMonths && (totalMonths == null || totalMonths <= 0)) {
      return null;
    }

    return RuleInput(
      title: title,
      amount: amount,
      ruleType: _ruleType,
      recurrenceMode: recurrenceMode,
      dayOfMonth: day,
      startDate: _startDate,
      endDate: recurrenceMode == 'UntilDate' ? _endDate : null,
      totalMonths: _showTotalMonths ? totalMonths : null,
      isActive: _isActive,
    );
  }

  Future<void> _save() async {
    final input = _build();
    if (input == null) {
      showInfoSnack(context, 'Revise os campos da regra.');
      return;
    }
    setState(() => _busy = true);
    try {
      final controller = ref.read(rulesControllerProvider.notifier);
      if (widget.rule == null) {
        await controller.createRule(input);
      } else {
        await controller.updateRule(widget.rule!.id, input);
      }
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      if (mounted) showErrorSnack(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        LabeledField(
            label: 'Título',
            child: AppTextField(controller: _title, hint: 'Ex.: Aluguel')),
        const SizedBox(height: 14),
        LabeledField(
          label: 'Valor',
          child: AppTextField(
            controller: _amount,
            hint: 'Ex.: 1200',
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            inputFormatters: [
              FilteringTextInputFormatter.allow(RegExp(r'[0-9.,]')),
            ],
          ),
        ),
        const SizedBox(height: 14),
        LabeledField(
          label: 'Tipo',
          child: AppDropdown<String>(
            value: _ruleType,
            items: _ruleTypes.keys.toList(),
            labelBuilder: (k) => _ruleTypes[k]!,
            onChanged: (v) => setState(() {
              _ruleType = v;
              if (v == 'InstallmentExpense') _recurrenceMode = 'Indefinite';
            }),
          ),
        ),
        const SizedBox(height: 14),
        Row(
          children: [
            Expanded(
              child: LabeledField(
                label: 'Dia do mês',
                child: AppTextField(
                  controller: _dayOfMonth,
                  keyboardType: TextInputType.number,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: LabeledField(
                label: 'Data inicial',
                child: DateField(
                  value: _startDate,
                  onChanged: (v) => setState(() => _startDate = v),
                ),
              ),
            ),
          ],
        ),
        if (_isRecurring) ...[
          const SizedBox(height: 14),
          LabeledField(
            label: 'Recorrência',
            child: AppDropdown<String>(
              value: _recurrenceMode,
              items: _recurrenceModes.keys.toList(),
              labelBuilder: (k) => _recurrenceModes[k]!,
              onChanged: (v) => setState(() => _recurrenceMode = v),
            ),
          ),
        ],
        if (_showEndDate) ...[
          const SizedBox(height: 14),
          LabeledField(
            label: 'Data final',
            child: DateField(
              value: _endDate,
              onChanged: (v) => setState(() => _endDate = v),
            ),
          ),
        ],
        if (_showTotalMonths) ...[
          const SizedBox(height: 14),
          LabeledField(
            label: _ruleType == 'InstallmentExpense'
                ? 'Parcelas'
                : 'Quantidade de meses',
            child: AppTextField(
              controller: _totalMonths,
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            ),
          ),
        ],
        const SizedBox(height: 8),
        SwitchListTile.adaptive(
          contentPadding: EdgeInsets.zero,
          value: _isActive,
          onChanged: (v) => setState(() => _isActive = v),
          title: const Text('Regra ativa'),
        ),
        const SizedBox(height: 12),
        ElevatedButton(
          onPressed: _busy ? null : _save,
          child: Text(_busy
              ? 'Salvando...'
              : (widget.rule == null ? 'Criar regra' : 'Salvar alterações')),
        ),
      ],
    );
  }
}
