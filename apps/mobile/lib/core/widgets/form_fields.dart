import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../app/theme.dart';
import '../format/formatters.dart';

/// Converte o texto do campo de valor. Mesma tolerância do web
/// (`Number(amount.replace(",", "."))`): a vírgula vira ponto decimal; um ponto
/// já é tratado como separador decimal.
double? parseAmount(String raw) =>
    double.tryParse(raw.trim().replaceAll(',', '.'));

class LabeledField extends StatelessWidget {
  const LabeledField({super.key, required this.label, required this.child});

  final String label;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 6),
        child,
      ],
    );
  }
}

class AppTextField extends StatelessWidget {
  const AppTextField({
    super.key,
    required this.controller,
    this.hint,
    this.keyboardType,
    this.obscureText = false,
    this.suffixIcon,
    this.textInputAction,
    this.onSubmitted,
    this.inputFormatters,
    this.autofillHints,
  });

  final TextEditingController controller;
  final String? hint;
  final TextInputType? keyboardType;
  final bool obscureText;
  final Widget? suffixIcon;
  final TextInputAction? textInputAction;
  final ValueChanged<String>? onSubmitted;
  final List<TextInputFormatter>? inputFormatters;
  final Iterable<String>? autofillHints;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      obscureText: obscureText,
      textInputAction: textInputAction,
      onSubmitted: onSubmitted,
      inputFormatters: inputFormatters,
      autofillHints: autofillHints,
      decoration: InputDecoration(hintText: hint, suffixIcon: suffixIcon),
    );
  }
}

class AppDropdown<T> extends StatelessWidget {
  const AppDropdown({
    super.key,
    required this.value,
    required this.items,
    required this.labelBuilder,
    required this.onChanged,
  });

  final T value;
  final List<T> items;
  final String Function(T) labelBuilder;
  final ValueChanged<T> onChanged;

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<T>(
      initialValue: value,
      isExpanded: true,
      items: items
          .map((e) => DropdownMenuItem<T>(value: e, child: Text(labelBuilder(e))))
          .toList(),
      onChanged: (v) {
        if (v != null) onChanged(v);
      },
    );
  }
}

/// Campo de data — abre o date picker nativo, mostra dd/MM/yyyy, guarda
/// "YYYY-MM-DD" (mesma convenção de DueDate no backend e no web).
class DateField extends StatelessWidget {
  const DateField({
    super.key,
    required this.value,
    required this.onChanged,
    this.firstDate,
    this.lastDate,
  });

  /// "YYYY-MM-DD".
  final String value;
  final ValueChanged<String> onChanged;
  final DateTime? firstDate;
  final DateTime? lastDate;

  @override
  Widget build(BuildContext context) {
    final parsed = DateTime.tryParse(value) ?? DateTime.now();
    return InkWell(
      borderRadius: BorderRadius.circular(AppColors.fieldRadius),
      onTap: () async {
        final picked = await showDatePicker(
          context: context,
          initialDate: parsed,
          firstDate: firstDate ?? DateTime(2000),
          lastDate: lastDate ?? DateTime(2100),
        );
        if (picked != null) {
          onChanged(
            '${picked.year.toString().padLeft(4, '0')}-'
            '${picked.month.toString().padLeft(2, '0')}-'
            '${picked.day.toString().padLeft(2, '0')}',
          );
        }
      },
      child: InputDecorator(
        decoration: const InputDecoration(),
        child: Row(
          children: [
            Icon(Icons.calendar_today_outlined,
                size: 16, color: context.mutedForeground),
            const SizedBox(width: 10),
            Text(Fmt.businessDate(value) ?? Fmt.date(parsed)),
          ],
        ),
      ),
    );
  }
}

/// Seletor segmentado — os grupos de botões "Único / Parcelado / Recorrente" e
/// "Saída / Entrada" do web (transaction-form.tsx).
class SegmentedSelector<T> extends StatelessWidget {
  const SegmentedSelector({
    super.key,
    required this.value,
    required this.options,
    required this.onChanged,
  });

  final T value;
  final List<({T value, String label})> options;
  final ValueChanged<T> onChanged;

  @override
  Widget build(BuildContext context) {
    final scheme = context.scheme;
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: options.map((opt) {
        final selected = opt.value == value;
        return GestureDetector(
          onTap: () => onChanged(opt.value),
          child: Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: selected
                  ? scheme.primary.withValues(alpha: 0.12)
                  : scheme.surface,
              borderRadius: BorderRadius.circular(AppColors.fieldRadius),
              border: Border.all(
                color: selected ? scheme.primary : scheme.outline,
              ),
            ),
            child: Text(
              opt.label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: selected ? scheme.primary : scheme.onSurface,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}
