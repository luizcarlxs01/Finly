import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme.dart';
import '../../../core/widgets/form_fields.dart';
import '../../../core/widgets/widgets.dart';
import '../../../shared/models/enums.dart';
import '../../../shared/models/transaction.dart';
import '../data/transaction_form_input.dart';
import '../state/finance_controller.dart';
import '../state/simulation_controller.dart';
import 'sheet_scaffold.dart';
import 'transaction_form_fields.dart';

/// Espelha apps/web/src/components/dashboard/transaction-edit-modal.tsx.
/// Regra da Fase C (seção 21 do CLAUDE.md): o bloco "Esta ocorrência" só aparece
/// para Installment/Recurring (nunca Single); "Excluir toda a série" sempre.
Future<void> showTransactionEditSheet(BuildContext context, LineItem item) {
  return showFinlySheet(
    context: context,
    title: 'Editar lançamento',
    builder: (context) => _TransactionEditSheet(item: item),
  );
}

class _TransactionEditSheet extends ConsumerStatefulWidget {
  const _TransactionEditSheet({required this.item});
  final LineItem item;

  @override
  ConsumerState<_TransactionEditSheet> createState() =>
      _TransactionEditSheetState();
}

class _TransactionEditSheetState extends ConsumerState<_TransactionEditSheet> {
  final _fieldsKey = GlobalKey<TransactionFormFieldsState>();
  late final TextEditingController _occDueDate;
  late final TextEditingController _occAmount;
  late String _occDueDateValue;
  bool _busy = false;

  bool get _isGeneratedInstance => widget.item.displayKind.isGeneratedInstance;

  @override
  void initState() {
    super.initState();
    _occDueDateValue = widget.item.dueDate;
    _occDueDate = TextEditingController(text: widget.item.dueDate);
    _occAmount = TextEditingController(
      text: widget.item.amount == widget.item.amount.roundToDouble()
          ? widget.item.amount.toStringAsFixed(2)
          : widget.item.amount.toString(),
    );
  }

  @override
  void dispose() {
    _occDueDate.dispose();
    _occAmount.dispose();
    super.dispose();
  }

  Future<void> _run(Future<void> Function() action) async {
    setState(() => _busy = true);
    try {
      await action();
      ref.read(simulationControllerProvider.notifier).clear();
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      if (mounted) showErrorSnack(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _saveContract() async {
    final input = _fieldsKey.currentState?.buildInput();
    if (input == null) {
      showInfoSnack(context, 'Revise os campos obrigatórios.');
      return;
    }
    await _run(() => ref
        .read(financeControllerProvider.notifier)
        .updateContract(widget.item.contract, input));
  }

  Future<void> _saveOccurrence() async {
    final amount =
        parseAmount(_occAmount.text) ?? 0;
    if (amount <= 0) {
      showInfoSnack(context, 'Informe um valor válido para a ocorrência.');
      return;
    }
    await _run(() => ref.read(financeControllerProvider.notifier).saveOccurrence(
          widget.item.occurrenceId,
          dueDate: _occDueDateValue,
          amount: amount,
        ));
  }

  Future<void> _toggleStatus() async {
    await _run(() => ref
        .read(financeControllerProvider.notifier)
        .toggleOccurrenceStatus(widget.item));
  }

  Future<void> _deleteSeries() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Excluir toda a série'),
        content: const Text(
          'Isso remove o lançamento inteiro e todas as suas parcelas ou '
          'competências, incluindo as já pagas. Essa ação não pode ser desfeita.',
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancelar')),
          FilledButton(
            style: FilledButton.styleFrom(
                backgroundColor: Theme.of(ctx).colorScheme.error),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Excluir toda a série'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      await _run(() => ref
          .read(financeControllerProvider.notifier)
          .deleteContract(widget.item.contractId));
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = context.scheme;
    final item = widget.item;
    // Estado inicial dos campos "Dados gerais". Para instância gerada, o kind
    // fica travado (não dá pra converter a série pelo modal).
    final initial = TransactionFormInput.fromContract(item.contract);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (_isGeneratedInstance)
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: scheme.surface,
              borderRadius: BorderRadius.circular(AppColors.fieldRadius),
              border: Border.all(color: scheme.outline),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Lançamento gerado automaticamente',
                    style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                const SizedBox(height: 4),
                Text(
                  item.displayKind == DisplayKind.installmentInstance
                      ? 'Esta transação veio de um parcelamento. Ajuste a série no item original.'
                      : 'Esta transação veio de uma recorrência. Ajuste a série no item original.',
                  style: TextStyle(
                      fontSize: 12.5, color: context.mutedForeground),
                ),
              ],
            ),
          ),
        if (_isGeneratedInstance) const SizedBox(height: 14),
        TransactionFormFields(
          key: _fieldsKey,
          initial: initial,
          lockKind: _isGeneratedInstance,
        ),
        const SizedBox(height: 20),
        ElevatedButton(
          onPressed: _busy ? null : _saveContract,
          child: Text(_busy ? 'Salvando...' : 'Salvar alterações'),
        ),

        // ---- Bloco "Esta ocorrência" (só Installment/Recurring) ----
        if (item.displayKind != DisplayKind.single) ...[
          const SizedBox(height: 18),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: scheme.surface,
              borderRadius: BorderRadius.circular(AppColors.fieldRadius),
              border: Border.all(color: scheme.outline),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Esta ocorrência',
                    style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                const SizedBox(height: 4),
                Text(
                  'Data e valor apenas desta parcela ou competência, sem afetar as demais da série.',
                  style: TextStyle(
                      fontSize: 12.5, color: context.mutedForeground),
                ),
                const SizedBox(height: 12),
                LabeledField(
                  label: 'Data de vencimento',
                  child: DateField(
                    value: _occDueDateValue,
                    onChanged: (v) => setState(() {
                      _occDueDateValue = v;
                      _occDueDate.text = v;
                    }),
                  ),
                ),
                const SizedBox(height: 12),
                LabeledField(
                  label: 'Valor desta ocorrência',
                  child: AppTextField(
                    controller: _occAmount,
                    keyboardType:
                        const TextInputType.numberWithOptions(decimal: true),
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'[0-9.,]')),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: _busy ? null : _saveOccurrence,
                        child: const Text('Salvar esta ocorrência'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: OutlinedButton(
                        onPressed: _busy ? null : _toggleStatus,
                        child: Text(item.isPaid
                            ? 'Marcar como pendente'
                            : 'Marcar como paga'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],

        // ---- "Excluir toda a série" (sempre) ----
        const SizedBox(height: 18),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: scheme.error.withValues(alpha: 0.05),
            borderRadius: BorderRadius.circular(AppColors.fieldRadius),
            border: Border.all(color: scheme.error.withValues(alpha: 0.35)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Excluir toda a série',
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
              const SizedBox(height: 4),
              Text(
                'Remove o lançamento inteiro e todas as suas parcelas ou competências, incluindo as já pagas.',
                style:
                    TextStyle(fontSize: 12.5, color: context.mutedForeground),
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  foregroundColor: scheme.error,
                  side: BorderSide(color: scheme.error.withValues(alpha: 0.5)),
                ),
                onPressed: _busy ? null : _deleteSeries,
                icon: const Icon(Icons.delete_outline, size: 16),
                label: const Text('Excluir toda a série'),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
