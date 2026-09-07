import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/widgets/form_fields.dart';
import '../../../shared/models/categories.dart';
import '../../../shared/models/enums.dart';
import '../data/transaction_form_input.dart';

/// Campos compartilhados entre "Nova transação" (transaction-form.tsx) e o topo
/// do "Editar lançamento" (transaction-edit-modal.tsx). Mantém o próprio estado
/// e devolve um [TransactionFormInput] via [buildInput].
class TransactionFormFields extends StatefulWidget {
  const TransactionFormFields({
    super.key,
    this.initial,
    this.lockKind = false,
    this.onChanged,
  });

  final TransactionFormInput? initial;

  /// Ocorrências geradas (recurring/installment instance) não trocam de kind
  /// no web — o bloco de seleção some.
  final bool lockKind;
  final VoidCallback? onChanged;

  @override
  State<TransactionFormFields> createState() => TransactionFormFieldsState();
}

class TransactionFormFieldsState extends State<TransactionFormFields> {
  late final TextEditingController _title;
  late final TextEditingController _amount;
  late final TextEditingController _installmentCount;
  late final TextEditingController _recurrenceDay;
  late final TextEditingController _recurrenceMonths;

  late TransactionType _type;
  late String _category;
  late ContractKind _kind;
  late String _transactionDate;
  late String _installmentStartDate;
  late String _recurrenceStartDate;
  late RecurrenceMode _recurrenceMode;
  late String _recurrenceEndDate;

  @override
  void initState() {
    super.initState();
    final i = widget.initial;
    _title = TextEditingController(text: i?.title ?? '');
    _amount = TextEditingController(
        text: i != null ? _trimAmount(i.amount) : '');
    _installmentCount =
        TextEditingController(text: (i?.installmentCount ?? 2).toString());
    _recurrenceDay = TextEditingController(
        text: (i?.recurrenceDay ?? DateTime.now().day).toString());
    _recurrenceMonths =
        TextEditingController(text: (i?.recurrenceMonths ?? 3).toString());

    _type = i?.type ?? TransactionType.expense;
    _category = i?.category ?? TransactionCategories.defaultCategory;
    _kind = i?.kind ?? ContractKind.single;
    _transactionDate = i?.transactionDate ?? _today();
    _installmentStartDate = i?.installmentStartDate ?? _today();
    _recurrenceStartDate = i?.recurrenceStartDate ?? _today();
    _recurrenceMode = i?.recurrenceMode ?? RecurrenceMode.indefinite;
    _recurrenceEndDate = i?.recurrenceEndDate ?? _today();

    for (final c in [
      _title,
      _amount,
      _installmentCount,
      _recurrenceDay,
      _recurrenceMonths
    ]) {
      c.addListener(() => widget.onChanged?.call());
    }
  }

  static String _today() {
    final n = DateTime.now();
    return '${n.year.toString().padLeft(4, '0')}-'
        '${n.month.toString().padLeft(2, '0')}-'
        '${n.day.toString().padLeft(2, '0')}';
  }

  static String _trimAmount(double v) =>
      v == v.roundToDouble() ? v.toStringAsFixed(2) : v.toString();

  @override
  void dispose() {
    _title.dispose();
    _amount.dispose();
    _installmentCount.dispose();
    _recurrenceDay.dispose();
    _recurrenceMonths.dispose();
    super.dispose();
  }

  /// Monta o input; retorna null se inválido (mesma checagem do web).
  TransactionFormInput? buildInput() {
    final amount = parseAmount(_amount.text) ?? 0;
    final input = TransactionFormInput(
      title: _title.text,
      amount: amount,
      type: _type,
      category: _category,
      kind: _kind,
      transactionDate: _transactionDate,
      installmentCount: int.tryParse(_installmentCount.text),
      installmentStartDate: _installmentStartDate,
      recurrenceDay: int.tryParse(_recurrenceDay.text),
      recurrenceStartDate: _recurrenceStartDate,
      recurrenceMode: _recurrenceMode,
      recurrenceEndDate: _recurrenceMode == RecurrenceMode.untilDate
          ? _recurrenceEndDate
          : null,
      recurrenceMonths: _recurrenceMode == RecurrenceMode.forMonths
          ? int.tryParse(_recurrenceMonths.text)
          : null,
    );
    return input.isValid ? input : null;
  }

  void _notify() {
    setState(() {});
    widget.onChanged?.call();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        LabeledField(
          label: 'Título',
          child: AppTextField(
              controller: _title, hint: 'Ex.: Aluguel, PIX, Salário'),
        ),
        const SizedBox(height: 14),
        LabeledField(
          label: 'Valor',
          child: AppTextField(
            controller: _amount,
            hint: 'Ex.: 250.00',
            keyboardType:
                const TextInputType.numberWithOptions(decimal: true),
            inputFormatters: [
              FilteringTextInputFormatter.allow(RegExp(r'[0-9.,]')),
            ],
          ),
        ),
        const SizedBox(height: 14),
        LabeledField(
          label: 'Natureza',
          child: SegmentedSelector<TransactionType>(
            value: _type,
            options: const [
              (value: TransactionType.expense, label: 'Saída'),
              (value: TransactionType.income, label: 'Entrada'),
            ],
            onChanged: (v) {
              _type = v;
              _notify();
            },
          ),
        ),
        const SizedBox(height: 14),
        LabeledField(
          label: 'Categoria',
          child: AppDropdown<String>(
            value: _category,
            items: TransactionCategories.all,
            labelBuilder: TransactionCategories.label,
            onChanged: (v) {
              _category = v;
              _notify();
            },
          ),
        ),
        const SizedBox(height: 14),
        if (!widget.lockKind) ...[
          LabeledField(
            label: 'Tipo de lançamento',
            child: SegmentedSelector<ContractKind>(
              value: _kind,
              options: const [
                (value: ContractKind.single, label: 'Único'),
                (value: ContractKind.installment, label: 'Parcelado'),
                (value: ContractKind.recurring, label: 'Recorrente'),
              ],
              onChanged: (v) {
                _kind = v;
                _notify();
              },
            ),
          ),
          const SizedBox(height: 14),
        ],
        if (_kind == ContractKind.single && !widget.lockKind)
          LabeledField(
            label: 'Data do lançamento',
            child: DateField(
              value: _transactionDate,
              onChanged: (v) {
                _transactionDate = v;
                _notify();
              },
            ),
          ),
        if (_kind == ContractKind.installment && !widget.lockKind) ...[
          LabeledField(
            label: 'Quantidade de parcelas',
            child: AppTextField(
              controller: _installmentCount,
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            ),
          ),
          const SizedBox(height: 14),
          LabeledField(
            label: 'Data da primeira parcela',
            child: DateField(
              value: _installmentStartDate,
              onChanged: (v) {
                _installmentStartDate = v;
                _notify();
              },
            ),
          ),
        ],
        if (_kind == ContractKind.recurring && !widget.lockKind) ...[
          LabeledField(
            label: 'Dia da recorrência',
            child: AppTextField(
              controller: _recurrenceDay,
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            ),
          ),
          const SizedBox(height: 14),
          LabeledField(
            label: 'Data de início',
            child: DateField(
              value: _recurrenceStartDate,
              onChanged: (v) {
                _recurrenceStartDate = v;
                _notify();
              },
            ),
          ),
          const SizedBox(height: 14),
          LabeledField(
            label: 'Até quando repetir',
            child: AppDropdown<RecurrenceMode>(
              value: _recurrenceMode,
              items: RecurrenceMode.values,
              labelBuilder: (m) => switch (m) {
                RecurrenceMode.indefinite => 'Indefinido',
                RecurrenceMode.untilDate => 'Até data',
                RecurrenceMode.forMonths => 'Por quantidade de meses',
              },
              onChanged: (v) {
                _recurrenceMode = v;
                _notify();
              },
            ),
          ),
          if (_recurrenceMode == RecurrenceMode.untilDate) ...[
            const SizedBox(height: 14),
            LabeledField(
              label: 'Data final',
              child: DateField(
                value: _recurrenceEndDate,
                firstDate: DateTime.tryParse(_recurrenceStartDate),
                onChanged: (v) {
                  _recurrenceEndDate = v;
                  _notify();
                },
              ),
            ),
          ],
          if (_recurrenceMode == RecurrenceMode.forMonths) ...[
            const SizedBox(height: 14),
            LabeledField(
              label: 'Quantidade de meses',
              child: AppTextField(
                controller: _recurrenceMonths,
                keyboardType: TextInputType.number,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              ),
            ),
          ],
        ],
      ],
    );
  }
}
