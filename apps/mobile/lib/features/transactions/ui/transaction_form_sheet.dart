import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/widgets.dart';
import '../state/finance_controller.dart';
import '../state/simulation_controller.dart';
import 'sheet_scaffold.dart';
import 'transaction_form_fields.dart';

/// "Nova transação" — espelha transaction-form.tsx, incluindo o botão
/// "Simular impacto" (não salva; atualiza o card de resumo).
Future<void> showTransactionFormSheet(BuildContext context) {
  return showFinlySheet(
    context: context,
    title: 'Nova transação',
    builder: (context) => const _TransactionFormSheet(),
  );
}

class _TransactionFormSheet extends ConsumerStatefulWidget {
  const _TransactionFormSheet();

  @override
  ConsumerState<_TransactionFormSheet> createState() =>
      _TransactionFormSheetState();
}

class _TransactionFormSheetState extends ConsumerState<_TransactionFormSheet> {
  final _fieldsKey = GlobalKey<TransactionFormFieldsState>();
  bool _submitting = false;

  Future<void> _save() async {
    final input = _fieldsKey.currentState?.buildInput();
    if (input == null) {
      showInfoSnack(context, 'Revise os campos obrigatórios da transação.');
      return;
    }
    setState(() => _submitting = true);
    try {
      await ref.read(financeControllerProvider.notifier).createTransaction(input);
      ref.read(simulationControllerProvider.notifier).clear();
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      if (mounted) showErrorSnack(context, e);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _simulate() {
    final input = _fieldsKey.currentState?.buildInput();
    if (input == null) {
      showInfoSnack(context, 'Preencha a transação para simular.');
      return;
    }
    ref.read(simulationControllerProvider.notifier).simulate(input);
    showInfoSnack(context, 'Simulação aplicada ao resumo financeiro.');
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        TransactionFormFields(key: _fieldsKey),
        const SizedBox(height: 20),
        ElevatedButton(
          onPressed: _submitting ? null : _save,
          child: Text(_submitting ? 'Salvando...' : 'Salvar lançamento'),
        ),
        const SizedBox(height: 10),
        OutlinedButton.icon(
          onPressed: _submitting ? null : _simulate,
          icon: const Icon(Icons.auto_awesome, size: 16),
          label: const Text('Simular impacto'),
        ),
      ],
    );
  }
}
