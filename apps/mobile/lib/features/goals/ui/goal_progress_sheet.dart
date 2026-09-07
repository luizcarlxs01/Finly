import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme.dart';
import '../../../core/widgets/form_fields.dart';
import '../../../core/widgets/widgets.dart';
import '../../../shared/models/goal.dart';
import '../../transactions/ui/sheet_scaffold.dart';
import '../state/goals_controller.dart';

/// Espelha apps/web/src/components/dashboard/goal-progress-modal.tsx.
Future<void> showGoalProgressSheet(BuildContext context, Goal goal) {
  return showFinlySheet(
    context: context,
    title: 'Atualizar progresso',
    builder: (_) => _GoalProgressSheet(goal: goal),
  );
}

class _GoalProgressSheet extends ConsumerStatefulWidget {
  const _GoalProgressSheet({required this.goal});
  final Goal goal;

  @override
  ConsumerState<_GoalProgressSheet> createState() => _GoalProgressSheetState();
}

class _GoalProgressSheetState extends ConsumerState<_GoalProgressSheet> {
  late final TextEditingController _amount =
      TextEditingController(text: widget.goal.currentAmount.toStringAsFixed(2));
  bool _busy = false;

  @override
  void dispose() {
    _amount.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final value = parseAmount(_amount.text) ?? -1;
    if (value < 0) {
      showInfoSnack(context, 'Informe um valor válido.');
      return;
    }
    setState(() => _busy = true);
    try {
      await ref
          .read(goalsControllerProvider.notifier)
          .updateProgress(widget.goal.id, value);
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
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: context.scheme.surface,
            borderRadius: BorderRadius.circular(AppColors.fieldRadius),
            border: Border.all(color: context.scheme.outline),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Meta',
                  style: TextStyle(
                      fontSize: 12, color: context.mutedForeground)),
              const SizedBox(height: 2),
              Text(widget.goal.title,
                  style: const TextStyle(
                      fontSize: 16, fontWeight: FontWeight.w700)),
            ],
          ),
        ),
        const SizedBox(height: 16),
        LabeledField(
          label: 'Valor atual',
          child: AppTextField(
            controller: _amount,
            hint: 'Ex.: 2500',
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            inputFormatters: [
              FilteringTextInputFormatter.allow(RegExp(r'[0-9.,]')),
            ],
          ),
        ),
        const SizedBox(height: 20),
        ElevatedButton(
          onPressed: _busy ? null : _save,
          child: Text(_busy ? 'Salvando...' : 'Salvar'),
        ),
      ],
    );
  }
}
