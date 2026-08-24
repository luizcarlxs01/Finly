import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../constants/categories.dart';
import '../models/transaction.dart';
import '../providers/finance_provider.dart';
import '../theme/app_colors.dart';
import '../utils/formatters.dart';

/// Formulário de novo lançamento — variante "Formulário completo" do
/// mockup (Único/Parcelado/Recorrente), com a mesma lógica de geração de
/// occurrences do resto do app (utils/occurrence_generation.dart) para o
/// modo local, e o mesmo payload do web (use-create-transaction.ts) para o
/// modo API. financeProvider decide sozinho qual caminho seguir.
Future<void> showAddTransactionSheet(BuildContext context) {
  return showModalBottomSheet(
    context: context,
    backgroundColor: Colors.transparent,
    isScrollControlled: true,
    useSafeArea: true,
    builder: (context) => const _NewTransactionSheet(),
  );
}

final _chipCategories =
    kCategories.where((category) => category.id != 'geral').toList();

class _NewTransactionSheet extends ConsumerStatefulWidget {
  const _NewTransactionSheet();

  @override
  ConsumerState<_NewTransactionSheet> createState() =>
      _NewTransactionSheetState();
}

class _NewTransactionSheetState extends ConsumerState<_NewTransactionSheet> {
  final _titleController = TextEditingController();
  final _amountController = TextEditingController();

  TransactionType _type = TransactionType.expense;
  String _categoryId = _chipCategories.first.id;
  TransactionKind _kind = TransactionKind.single;

  DateTime _transactionDate = DateTime.now();

  int _installmentCount = 2;
  DateTime _installmentStartDate = DateTime.now();

  int _recurrenceDay = DateTime.now().day;
  DateTime _recurrenceStartDate = DateTime.now();
  RecurrenceMode _recurrenceMode = RecurrenceMode.indefinite;
  DateTime _recurrenceEndDate = DateTime.now();
  int _recurrenceMonths = 3;

  bool _isSubmitting = false;
  String? _errorMessage;

  @override
  void dispose() {
    _titleController.dispose();
    _amountController.dispose();
    super.dispose();
  }

  Future<void> _pickDate(DateTime initial, ValueChanged<DateTime> onPicked) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(initial.year - 5),
      lastDate: DateTime(initial.year + 5),
      helpText: 'Selecione a data',
    );
    if (picked != null) onPicked(picked);
  }

  NewTransactionInput? _buildInput() {
    final title = _titleController.text.trim();
    final amount = parseAmountInput(_amountController.text);

    if (title.isEmpty || amount == null || amount <= 0) {
      return null;
    }

    switch (_kind) {
      case TransactionKind.single:
        return NewTransactionInput(
          title: title,
          amount: amount,
          type: _type,
          category: _categoryId,
          kind: _kind,
          transactionDate: _transactionDate,
        );
      case TransactionKind.installment:
        if (_installmentCount < 2) return null;
        return NewTransactionInput(
          title: title,
          amount: amount,
          type: _type,
          category: _categoryId,
          kind: _kind,
          installmentCount: _installmentCount,
          installmentStartDate: _installmentStartDate,
        );
      case TransactionKind.recurring:
        if (_recurrenceMode == RecurrenceMode.forMonths && _recurrenceMonths < 1) {
          return null;
        }
        if (_recurrenceMode == RecurrenceMode.untilDate &&
            _recurrenceEndDate.isBefore(_recurrenceStartDate)) {
          return null;
        }
        return NewTransactionInput(
          title: title,
          amount: amount,
          type: _type,
          category: _categoryId,
          kind: _kind,
          recurrenceDay: _recurrenceDay,
          recurrenceStartDate: _recurrenceStartDate,
          recurrenceMode: _recurrenceMode,
          recurrenceEndDate:
              _recurrenceMode == RecurrenceMode.untilDate ? _recurrenceEndDate : null,
          recurrenceMonths:
              _recurrenceMode == RecurrenceMode.forMonths ? _recurrenceMonths : null,
        );
    }
  }

  Future<void> _submit() async {
    final input = _buildInput();

    if (input == null) {
      setState(() => _errorMessage = 'Preencha valor, título e os campos deste tipo de lançamento.');
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    try {
      await ref.read(financeProvider.notifier).createTransaction(input);
      if (mounted) Navigator.of(context).pop();
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _isSubmitting = false;
        _errorMessage = _friendlyError(error);
      });
    }
  }

  String _friendlyError(Object error) {
    if (error is DioException) {
      final data = error.response?.data;
      if (data is Map<String, dynamic>) {
        final message = data['message'] ?? data['title'];
        if (message is String && message.isNotEmpty) return message;
      }
      return 'Não foi possível conectar. Verifique sua internet.';
    }

    final text = error.toString();
    return text.startsWith('Exception: ')
        ? text.substring(11)
        : 'Não foi possível salvar o lançamento.';
  }

  @override
  Widget build(BuildContext context) {
    final viewInsets = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      padding: EdgeInsets.fromLTRB(20, 14, 20, 24 + viewInsets),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(32),
          topRight: Radius.circular(32),
        ),
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
            ),
            const SizedBox(height: 18),
            const Text(
              'Novo lançamento',
              style: TextStyle(fontSize: 19, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 16),
            _TypeToggle(
              type: _type,
              onChanged: (type) => setState(() => _type = type),
            ),
            const SizedBox(height: 14),
            const Text('Valor', style: _labelStyle),
            const SizedBox(height: 7),
            TextField(
              controller: _amountController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
              decoration: const InputDecoration(
                prefixText: 'R\$ ',
                prefixStyle: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: AppColors.mutedLight,
                ),
                hintText: '0,00',
              ),
            ),
            const SizedBox(height: 14),
            const Text('Título', style: _labelStyle),
            const SizedBox(height: 7),
            TextField(
              controller: _titleController,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(hintText: 'Ex.: Supermercado'),
            ),
            const SizedBox(height: 14),
            const Text('Categoria', style: _labelStyle),
            const SizedBox(height: 9),
            SizedBox(
              height: 40,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: _chipCategories.length,
                separatorBuilder: (_, __) => const SizedBox(width: 7),
                itemBuilder: (context, index) {
                  final category = _chipCategories[index];
                  final selected = category.id == _categoryId;
                  return _CategoryChip(
                    category: category,
                    selected: selected,
                    onTap: () => setState(() => _categoryId = category.id),
                  );
                },
              ),
            ),
            const SizedBox(height: 14),
            const Text('Tipo de lançamento', style: _labelStyle),
            const SizedBox(height: 9),
            _KindToggle(
              kind: _kind,
              onChanged: (kind) => setState(() => _kind = kind),
            ),
            const SizedBox(height: 14),
            if (_kind == TransactionKind.single)
              _DateField(
                label: 'Data do lançamento',
                date: _transactionDate,
                onTap: () => _pickDate(
                  _transactionDate,
                  (picked) => setState(() => _transactionDate = picked),
                ),
              ),
            if (_kind == TransactionKind.installment) ...[
              _DateField(
                label: 'Data da primeira parcela',
                date: _installmentStartDate,
                onTap: () => _pickDate(
                  _installmentStartDate,
                  (picked) => setState(() => _installmentStartDate = picked),
                ),
              ),
              const SizedBox(height: 14),
              _InstallmentStepper(
                count: _installmentCount,
                amountText: _amountController.text,
                onChanged: (count) => setState(() => _installmentCount = count),
              ),
            ],
            if (_kind == TransactionKind.recurring) ...[
              _DateField(
                label: 'Começa em',
                date: _recurrenceStartDate,
                onTap: () => _pickDate(
                  _recurrenceStartDate,
                  (picked) => setState(() => _recurrenceStartDate = picked),
                ),
              ),
              const SizedBox(height: 14),
              _RecurrenceDayStepper(
                day: _recurrenceDay,
                onChanged: (day) => setState(() => _recurrenceDay = day),
              ),
              const SizedBox(height: 14),
              const Text('Repetir', style: _labelStyle),
              const SizedBox(height: 9),
              _RecurrenceModeToggle(
                mode: _recurrenceMode,
                onChanged: (mode) => setState(() => _recurrenceMode = mode),
              ),
              const SizedBox(height: 14),
              if (_recurrenceMode == RecurrenceMode.untilDate)
                _DateField(
                  label: 'Repetir até',
                  date: _recurrenceEndDate,
                  onTap: () => _pickDate(
                    _recurrenceEndDate,
                    (picked) => setState(() => _recurrenceEndDate = picked),
                  ),
                ),
              if (_recurrenceMode == RecurrenceMode.forMonths)
                _MonthsStepper(
                  months: _recurrenceMonths,
                  onChanged: (months) => setState(() => _recurrenceMonths = months),
                ),
            ],
            if (_errorMessage != null) ...[
              const SizedBox(height: 14),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.dangerSoft,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Text(
                  _errorMessage!,
                  style: const TextStyle(
                    fontSize: 12.5,
                    color: AppColors.dangerText,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isSubmitting ? null : _submit,
                child: _isSubmitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.5,
                          color: Colors.white,
                        ),
                      )
                    : Text(_type == TransactionType.income
                        ? 'Registrar entrada'
                        : 'Registrar saída'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

const _labelStyle = TextStyle(
  fontSize: 11,
  fontWeight: FontWeight.w600,
  color: AppColors.muted,
);

class _TypeToggle extends StatelessWidget {
  const _TypeToggle({required this.type, required this.onChanged});

  final TransactionType type;
  final ValueChanged<TransactionType> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: AppColors.primarySofter,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Expanded(
            child: _SegmentButton(
              label: 'Saída',
              selected: type == TransactionType.expense,
              onTap: () => onChanged(TransactionType.expense),
            ),
          ),
          Expanded(
            child: _SegmentButton(
              label: 'Entrada',
              selected: type == TransactionType.income,
              onTap: () => onChanged(TransactionType.income),
            ),
          ),
        ],
      ),
    );
  }
}

class _KindToggle extends StatelessWidget {
  const _KindToggle({required this.kind, required this.onChanged});

  final TransactionKind kind;
  final ValueChanged<TransactionKind> onChanged;

  static const _options = [
    (TransactionKind.single, 'Único'),
    (TransactionKind.installment, 'Parcelado'),
    (TransactionKind.recurring, 'Recorrente'),
  ];

  @override
  Widget build(BuildContext context) {
    return Row(
      children: _options
          .map((option) => Expanded(
                child: Padding(
                  padding: EdgeInsets.only(
                      right: option == _options.last ? 0 : 6),
                  child: _OutlinedSegment(
                    label: option.$2,
                    selected: kind == option.$1,
                    onTap: () => onChanged(option.$1),
                  ),
                ),
              ))
          .toList(),
    );
  }
}

class _RecurrenceModeToggle extends StatelessWidget {
  const _RecurrenceModeToggle({required this.mode, required this.onChanged});

  final RecurrenceMode mode;
  final ValueChanged<RecurrenceMode> onChanged;

  static const _options = [
    (RecurrenceMode.indefinite, 'Indefinida'),
    (RecurrenceMode.untilDate, 'Até uma data'),
    (RecurrenceMode.forMonths, 'Por X meses'),
  ];

  @override
  Widget build(BuildContext context) {
    return Row(
      children: _options
          .map((option) => Expanded(
                child: Padding(
                  padding: EdgeInsets.only(
                      right: option == _options.last ? 0 : 6),
                  child: _OutlinedSegment(
                    label: option.$2,
                    selected: mode == option.$1,
                    onTap: () => onChanged(option.$1),
                  ),
                ),
              ))
          .toList(),
    );
  }
}

class _SegmentButton extends StatelessWidget {
  const _SegmentButton({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        height: 40,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: selected ? Colors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          boxShadow: selected
              ? [
                  BoxShadow(
                    color: AppColors.ink.withValues(alpha: 0.1),
                    blurRadius: 6,
                  ),
                ]
              : null,
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: selected ? AppColors.ink : AppColors.muted,
          ),
        ),
      ),
    );
  }
}

class _OutlinedSegment extends StatelessWidget {
  const _OutlinedSegment({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        height: 44,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: selected ? AppColors.primarySoft : Colors.white,
          borderRadius: BorderRadius.circular(15),
          border: Border.all(
            color: selected ? AppColors.primary : AppColors.border,
          ),
        ),
        child: Text(
          label,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 11.5,
            fontWeight: FontWeight.w700,
            color: selected ? AppColors.primaryDark : AppColors.muted,
          ),
        ),
      ),
    );
  }
}

class _CategoryChip extends StatelessWidget {
  const _CategoryChip({
    required this.category,
    required this.selected,
    required this.onTap,
  });

  final CategoryInfo category;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 9),
        decoration: BoxDecoration(
          color: selected ? AppColors.primarySoft : AppColors.backgroundSubtle,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(
            color: selected ? AppColors.primary : AppColors.border,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              category.icon,
              size: 15,
              color: selected ? AppColors.primaryDark : category.color,
            ),
            const SizedBox(width: 7),
            Text(
              category.label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: selected ? AppColors.primaryDark : AppColors.inkSoft,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DateField extends StatelessWidget {
  const _DateField({
    required this.label,
    required this.date,
    required this.onTap,
  });

  final String label;
  final DateTime date;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: _labelStyle),
        const SizedBox(height: 7),
        GestureDetector(
          onTap: onTap,
          child: Container(
            width: double.infinity,
            height: 48,
            padding: const EdgeInsets.symmetric(horizontal: 14),
            decoration: BoxDecoration(
              color: AppColors.backgroundSubtle,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              children: [
                const Icon(Icons.calendar_today_outlined,
                    size: 16, color: AppColors.muted),
                const SizedBox(width: 10),
                Text(
                  formatShortDate(date),
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _InstallmentStepper extends StatelessWidget {
  const _InstallmentStepper({
    required this.count,
    required this.amountText,
    required this.onChanged,
  });

  final int count;
  final String amountText;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    final amount = parseAmountInput(amountText);
    // "Valor" é o valor de CADA parcela (mesma semântica de
    // occurrence-generation.ts: a mesma amount se repete em toda occurrence),
    // não um total a ser dividido — daí total = amount * count, não / count.
    final perMonth = amount != null && amount > 0
        ? 'Total ${formatCurrency(amount * count)} em ${count}x'
        : 'Informe o valor da parcela';

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.primarySoft,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Parcelas',
                  style: TextStyle(
                      fontSize: 12.5,
                      fontWeight: FontWeight.w700,
                      color: AppColors.primaryDark),
                ),
                const SizedBox(height: 3),
                Text(
                  perMonth,
                  style: const TextStyle(fontSize: 11, color: AppColors.inkSoft),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(999),
            ),
            child: Row(
              children: [
                _StepperButton(
                  icon: Icons.remove,
                  onTap: count > 2 ? () => onChanged(count - 1) : null,
                ),
                SizedBox(
                  width: 28,
                  child: Text(
                    '$count',
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontWeight: FontWeight.w800),
                  ),
                ),
                _StepperButton(
                  icon: Icons.add,
                  onTap: count < 24 ? () => onChanged(count + 1) : null,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MonthsStepper extends StatelessWidget {
  const _MonthsStepper({required this.months, required this.onChanged});

  final int months;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.successSoft,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        children: [
          const Expanded(
            child: Text(
              'Quantidade de meses',
              style: TextStyle(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w700,
                  color: AppColors.successDark),
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(999),
            ),
            child: Row(
              children: [
                _StepperButton(
                  icon: Icons.remove,
                  onTap: months > 1 ? () => onChanged(months - 1) : null,
                ),
                SizedBox(
                  width: 28,
                  child: Text(
                    '$months',
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontWeight: FontWeight.w800),
                  ),
                ),
                _StepperButton(
                  icon: Icons.add,
                  onTap: months < 60 ? () => onChanged(months + 1) : null,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _RecurrenceDayStepper extends StatelessWidget {
  const _RecurrenceDayStepper({required this.day, required this.onChanged});

  final int day;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Expanded(
          child: Text('Dia da recorrência', style: _labelStyle),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
          decoration: BoxDecoration(
            color: AppColors.backgroundSubtle,
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            children: [
              _StepperButton(
                icon: Icons.remove,
                onTap: day > 1 ? () => onChanged(day - 1) : null,
              ),
              SizedBox(
                width: 28,
                child: Text(
                  '$day',
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontWeight: FontWeight.w800),
                ),
              ),
              _StepperButton(
                icon: Icons.add,
                onTap: day < 31 ? () => onChanged(day + 1) : null,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _StepperButton extends StatelessWidget {
  const _StepperButton({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        width: 26,
        height: 26,
        decoration: BoxDecoration(
          color: onTap == null ? AppColors.background : AppColors.primarySoft,
          shape: BoxShape.circle,
        ),
        child: Icon(
          icon,
          size: 15,
          color: onTap == null ? AppColors.mutedLight : AppColors.primaryDark,
        ),
      ),
    );
  }
}
