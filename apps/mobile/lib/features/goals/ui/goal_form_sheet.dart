import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/format/formatters.dart';
import '../../../core/widgets/form_fields.dart';
import '../../../core/widgets/widgets.dart';
import '../../../shared/models/categories.dart';
import '../../transactions/ui/sheet_scaffold.dart';
import '../state/goals_controller.dart';

/// "Nova meta" — espelha apps/web/src/components/dashboard/goal-form.tsx.
/// (categoria e prazo existem no formulário do web; a API só persiste
/// título/valores/deadline — mantemos os campos para paridade de UI.)
Future<void> showGoalFormSheet(BuildContext context) {
  return showFinlySheet(
    context: context,
    title: 'Nova meta',
    builder: (_) => const _GoalFormSheet(),
  );
}

class _GoalFormSheet extends ConsumerStatefulWidget {
  const _GoalFormSheet();

  @override
  ConsumerState<_GoalFormSheet> createState() => _GoalFormSheetState();
}

class _GoalFormSheetState extends ConsumerState<_GoalFormSheet> {
  final _title = TextEditingController();
  final _target = TextEditingController();
  final _current = TextEditingController();
  String _category = 'general';
  String? _deadline;
  bool _busy = false;

  @override
  void dispose() {
    _title.dispose();
    _target.dispose();
    _current.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final target = parseAmount(_target.text) ?? 0;
    final current =
        _current.text.trim().isEmpty ? 0.0 : (parseAmount(_current.text) ?? 0);
    if (_title.text.trim().isEmpty || target <= 0 || current < 0) {
      showInfoSnack(context, 'Preencha título e um valor alvo válido.');
      return;
    }
    setState(() => _busy = true);
    try {
      await ref.read(goalsControllerProvider.notifier).createGoal(
            title: _title.text,
            targetAmount: target,
            currentAmount: current,
            category: _category,
            deadline: _deadline,
          );
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      if (mounted) showErrorSnack(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final categories = ['general', ...TransactionCategories.all];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        LabeledField(
          label: 'Título',
          child: AppTextField(
              controller: _title, hint: 'Ex.: Reserva de emergência'),
        ),
        const SizedBox(height: 14),
        LabeledField(
          label: 'Valor alvo',
          child: AppTextField(
            controller: _target,
            hint: 'Ex.: 10000',
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            inputFormatters: [
              FilteringTextInputFormatter.allow(RegExp(r'[0-9.,]')),
            ],
          ),
        ),
        const SizedBox(height: 14),
        LabeledField(
          label: 'Valor atual',
          child: AppTextField(
            controller: _current,
            hint: 'Ex.: 1500',
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            inputFormatters: [
              FilteringTextInputFormatter.allow(RegExp(r'[0-9.,]')),
            ],
          ),
        ),
        const SizedBox(height: 14),
        LabeledField(
          label: 'Categoria',
          child: AppDropdown<String>(
            value: _category,
            items: categories,
            labelBuilder: TransactionCategories.goalLabel,
            onChanged: (v) => setState(() => _category = v),
          ),
        ),
        const SizedBox(height: 14),
        LabeledField(
          label: 'Prazo (opcional)',
          child: Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  icon: const Icon(Icons.calendar_today_outlined, size: 16),
                  label: Text(_deadline == null
                      ? 'Sem prazo'
                      : (Fmt.businessDate(_deadline) ?? _deadline!)),
                  onPressed: () async {
                    final picked = await showDatePicker(
                      context: context,
                      initialDate: DateTime.now(),
                      firstDate: DateTime.now(),
                      lastDate: DateTime(2100),
                    );
                    if (picked != null) {
                      setState(() => _deadline =
                          '${picked.year.toString().padLeft(4, '0')}-'
                          '${picked.month.toString().padLeft(2, '0')}-'
                          '${picked.day.toString().padLeft(2, '0')}');
                    }
                  },
                ),
              ),
              if (_deadline != null)
                IconButton(
                  icon: const Icon(Icons.clear, size: 18),
                  onPressed: () => setState(() => _deadline = null),
                ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        ElevatedButton(
          onPressed: _busy ? null : _save,
          child: Text(_busy ? 'Salvando...' : 'Salvar meta'),
        ),
      ],
    );
  }
}
