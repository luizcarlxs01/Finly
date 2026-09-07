import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme.dart';
import '../../../core/format/formatters.dart';
import '../../../core/widgets/form_fields.dart';
import '../../../core/widgets/widgets.dart';
import '../state/finance_controller.dart';
import '../state/simulation_controller.dart';

/// Espelha apps/web/src/components/dashboard/finance-summary-card.tsx:
///  - "Saldo atual" + "Base inicial" sempre visíveis; toque no valor edita o
///    saldo inicial in-place (Enter salva, Esc cancela);
///  - "olhinho" mascara TODOS os valores com "••••••";
///  - "Mostrar mais/menos" revela Entradas / Saídas / Próximo período;
///  - banner "Simulação ativa" sempre visível quando há simulação, mesmo
///    colapsado.
class FinanceSummaryCard extends ConsumerStatefulWidget {
  const FinanceSummaryCard({super.key});

  @override
  ConsumerState<FinanceSummaryCard> createState() => _FinanceSummaryCardState();
}

class _FinanceSummaryCardState extends ConsumerState<FinanceSummaryCard> {
  bool _expanded = false;
  bool _hidden = false;
  bool _editing = false;
  final _balanceController = TextEditingController();

  @override
  void dispose() {
    _balanceController.dispose();
    super.dispose();
  }

  String _mask(num v) => Fmt.maskedCurrency(v, hidden: _hidden);

  @override
  Widget build(BuildContext context) {
    final financeAsync = ref.watch(financeControllerProvider);
    final data = financeAsync.valueOrNull ?? FinanceData.empty;
    final simulation = ref.watch(simulationControllerProvider);
    final forecast = buildForecast(
      currentBalance: data.currentBalance,
      totalIncome: data.totalIncome,
      totalExpense: data.totalExpense,
      simulation: simulation,
    );
    final scheme = context.scheme;

    return FinlyCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Expanded(
                child: Text('Resumo financeiro',
                    style: TextStyle(
                        fontSize: 17, fontWeight: FontWeight.w700)),
              ),
              IconButton(
                tooltip: _hidden ? 'Mostrar valores' : 'Ocultar valores',
                icon: Icon(_hidden
                    ? Icons.visibility_off_outlined
                    : Icons.visibility_outlined),
                onPressed: () => setState(() => _hidden = !_hidden),
              ),
            ],
          ),
          const SizedBox(height: 4),
          // Saldo atual — sempre visível
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: scheme.surface,
              borderRadius: BorderRadius.circular(AppColors.fieldRadius),
              border: Border.all(color: scheme.outline),
            ),
            child: _editing && !_hidden
                ? _BalanceEditor(
                    controller: _balanceController,
                    onCancel: () => setState(() => _editing = false),
                    onSubmit: () async {
                      final value = double.tryParse(
                          _balanceController.text.trim().replaceAll(',', '.'));
                      setState(() => _editing = false);
                      if (value != null) {
                        try {
                          await ref
                              .read(financeControllerProvider.notifier)
                              .updateInitialBalance(value);
                          ref.read(simulationControllerProvider.notifier).clear();
                        } catch (e) {
                          if (context.mounted) showErrorSnack(context, e);
                        }
                      }
                    },
                  )
                : Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: _hidden
                              ? null
                              : () {
                                  _balanceController.text =
                                      data.initialBalance.toString();
                                  setState(() => _editing = true);
                                },
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Saldo atual',
                                  style: TextStyle(
                                      fontSize: 13,
                                      color: context.mutedForeground)),
                              const SizedBox(height: 6),
                              Text(
                                _mask(data.currentBalance),
                                style: const TextStyle(
                                    fontSize: 22, fontWeight: FontWeight.w700),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Base inicial: ${_mask(data.initialBalance)}',
                                style: TextStyle(
                                    fontSize: 11.5,
                                    color: context.mutedForeground),
                              ),
                            ],
                          ),
                        ),
                      ),
                      Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          color: scheme.primary.withValues(alpha: 0.10),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(Icons.account_balance_wallet_outlined,
                            size: 20, color: scheme.primary),
                      ),
                    ],
                  ),
          ),
          // Simulação ativa — sempre visível quando há simulação
          if (forecast.isPreview) ...[
            const SizedBox(height: 10),
            _SimulationBanner(
              forecast: forecast,
              mask: _mask,
              onClear: () =>
                  ref.read(simulationControllerProvider.notifier).clear(),
            ),
          ],
          if (_expanded) ...[
            const SizedBox(height: 10),
            _StatRow(
              label: 'Entradas',
              value: _mask(data.totalIncome),
              valueColor: scheme.primary,
              icon: Icons.north_east,
            ),
            const SizedBox(height: 8),
            _StatRow(
              label: 'Saídas',
              value: _mask(data.totalExpense),
              valueColor: scheme.onSurface,
              icon: Icons.south_east,
            ),
            const SizedBox(height: 8),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: scheme.surfaceContainerHighest.withValues(alpha: 0.4),
                borderRadius: BorderRadius.circular(AppColors.fieldRadius),
                border: Border.all(color: scheme.outline),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Próximo período',
                      style: TextStyle(
                          fontSize: 11.5, color: context.mutedForeground)),
                  const SizedBox(height: 2),
                  Text(
                    _hidden ? '••••••' : Fmt.nextMonthLabel(),
                    style: const TextStyle(
                        fontSize: 13, fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 6),
          Center(
            child: TextButton.icon(
              onPressed: () => setState(() => _expanded = !_expanded),
              icon: Text(_expanded ? 'Mostrar menos' : 'Mostrar mais'),
              label: Icon(
                  _expanded ? Icons.expand_less : Icons.expand_more,
                  size: 18),
            ),
          ),
        ],
      ),
    );
  }
}

class _BalanceEditor extends StatelessWidget {
  const _BalanceEditor({
    required this.controller,
    required this.onCancel,
    required this.onSubmit,
  });

  final TextEditingController controller;
  final VoidCallback onCancel;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: AppTextField(
            controller: controller,
            hint: 'Ex.: 1500.00',
            keyboardType:
                const TextInputType.numberWithOptions(decimal: true, signed: true),
            inputFormatters: [
              FilteringTextInputFormatter.allow(RegExp(r'[0-9.,-]')),
            ],
            textInputAction: TextInputAction.done,
            onSubmitted: (_) => onSubmit(),
          ),
        ),
        IconButton(
            onPressed: onSubmit, icon: const Icon(Icons.check, size: 20)),
        IconButton(
            onPressed: onCancel, icon: const Icon(Icons.close, size: 20)),
      ],
    );
  }
}

class _SimulationBanner extends StatelessWidget {
  const _SimulationBanner({
    required this.forecast,
    required this.mask,
    required this.onClear,
  });

  final ForecastSnapshot forecast;
  final String Function(num) mask;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    final scheme = context.scheme;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: scheme.primary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(AppColors.fieldRadius),
        border: Border.all(color: scheme.primary.withValues(alpha: 0.20)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Expanded(
                child: Text('Simulação ativa',
                    style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
              ),
              Icon(Icons.auto_awesome, size: 18, color: scheme.primary),
            ],
          ),
          const SizedBox(height: 2),
          Text('O impacto abaixo ainda não foi salvo.',
              style: TextStyle(fontSize: 12, color: context.mutedForeground)),
          const SizedBox(height: 12),
          _MiniStat(label: 'Saldo projetado', value: mask(forecast.projectedBalance)),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: _MiniStat(
                    label: 'Entradas',
                    value: mask(forecast.totalIncome),
                    color: scheme.primary),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _MiniStat(
                    label: 'Saídas', value: mask(forecast.totalExpense)),
              ),
            ],
          ),
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton(
                onPressed: onClear, child: const Text('Limpar simulação')),
          ),
        ],
      ),
    );
  }
}

class _MiniStat extends StatelessWidget {
  const _MiniStat({required this.label, required this.value, this.color});
  final String label;
  final String value;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final scheme = context.scheme;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: scheme.outline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style: TextStyle(fontSize: 11, color: context.mutedForeground)),
          const SizedBox(height: 2),
          Text(value,
              style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: color ?? scheme.onSurface)),
        ],
      ),
    );
  }
}

class _StatRow extends StatelessWidget {
  const _StatRow({
    required this.label,
    required this.value,
    required this.valueColor,
    required this.icon,
  });

  final String label;
  final String value;
  final Color valueColor;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final scheme = context.scheme;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(AppColors.fieldRadius),
        border: Border.all(color: scheme.outline),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: TextStyle(
                        fontSize: 13, color: context.mutedForeground)),
                const SizedBox(height: 4),
                Text(value,
                    style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: valueColor)),
              ],
            ),
          ),
          Icon(icon, size: 18, color: valueColor),
        ],
      ),
    );
  }
}
