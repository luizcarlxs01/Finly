import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../app/theme.dart';
import '../../../core/format/formatters.dart';
import '../../../core/widgets/form_fields.dart';
import '../../../core/widgets/widgets.dart';
import '../../../shared/models/categories.dart';
import '../../../shared/models/enums.dart';
import '../../../shared/models/transaction.dart';

enum _ChartType { categoryPie, monthlyEvolution, categoryRanking }

enum _Period { threeMonths, sixMonths, twelveMonths, all }

const String _allValue = 'all';

/// Painel de análise de gastos — espelha
/// apps/web/src/components/dashboard/insights/spending-analysis-panel.tsx.
/// Só lê `lineItems` já pagos, não grava nada.
class SpendingAnalysisPanel extends StatefulWidget {
  const SpendingAnalysisPanel({super.key, required this.lineItems});

  final List<LineItem> lineItems;

  @override
  State<SpendingAnalysisPanel> createState() => _SpendingAnalysisPanelState();
}

class _SpendingAnalysisPanelState extends State<SpendingAnalysisPanel> {
  _ChartType _chartType = _ChartType.categoryPie;
  String _entryType = 'expense'; // expense | income | all
  String _kind = _allValue; // all | single | installment | recurring
  String _category = _allValue;
  _Period _period = _Period.sixMonths;

  List<LineItem> get _filtered {
    DateTime? cutoff;
    if (_period != _Period.all) {
      final monthsBack = switch (_period) {
        _Period.threeMonths => 3,
        _Period.sixMonths => 6,
        _Period.twelveMonths => 12,
        _Period.all => 0,
      };
      final now = DateTime.now();
      cutoff = DateTime(now.year, now.month - monthsBack, 1);
    }

    return widget.lineItems.where((item) {
      if (_entryType != 'all' &&
          item.type.name != _entryType) {
        return false;
      }
      if (_kind != _allValue && item.contract.kind.name != _kind) {
        return false;
      }
      if (_category != _allValue && item.category != _category) {
        return false;
      }
      if (cutoff != null) {
        final date = item.dueDateTime;
        if (date == null || date.isBefore(cutoff)) return false;
      }
      return true;
    }).toList();
  }

  List<({String category, double amount})> get _categoryData {
    final totals = <String, double>{};
    for (final item in _filtered) {
      totals[item.category] = (totals[item.category] ?? 0) + item.amount;
    }
    final list = totals.entries
        .map((e) => (category: e.key, amount: e.value))
        .toList()
      ..sort((a, b) => b.amount.compareTo(a.amount));
    return list;
  }

  List<({String month, double entradas, double saidas})> get _monthlyData {
    final totals = <String, ({double entradas, double saidas})>{};
    for (final item in _filtered) {
      final date = item.dueDateTime;
      if (date == null) continue;
      final key = '${date.year}-${date.month.toString().padLeft(2, '0')}';
      final current = totals[key] ?? (entradas: 0.0, saidas: 0.0);
      totals[key] = item.type == TransactionType.income
          ? (entradas: current.entradas + item.amount, saidas: current.saidas)
          : (entradas: current.entradas, saidas: current.saidas + item.amount);
    }
    final keys = totals.keys.toList()..sort();
    return keys.map((k) {
      final parts = k.split('-');
      final date = DateTime(int.parse(parts[0]), int.parse(parts[1]));
      return (
        month: DateFormat('MMM/yy', 'pt_BR').format(date),
        entradas: totals[k]!.entradas,
        saidas: totals[k]!.saidas,
      );
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final categoryData = _categoryData;
    final monthlyData = _monthlyData;
    final hasData =
        _chartType == _ChartType.monthlyEvolution ? monthlyData.isNotEmpty : categoryData.isNotEmpty;

    return FinlyCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Análise de gastos',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
          const SizedBox(height: 2),
          Text(
            'Explore seus lançamentos pagos por categoria, período e tipo de lançamento.',
            style: TextStyle(fontSize: 12.5, color: context.mutedForeground),
          ),
          const SizedBox(height: 12),
          AppDropdown<_ChartType>(
            value: _chartType,
            items: _ChartType.values,
            labelBuilder: (v) => switch (v) {
              _ChartType.categoryPie => 'Pizza por categoria',
              _ChartType.monthlyEvolution => 'Evolução mensal',
              _ChartType.categoryRanking => 'Ranking de categorias',
            },
            onChanged: (v) => setState(() => _chartType = v),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: AppDropdown<String>(
                  value: _entryType,
                  items: const ['expense', 'income', 'all'],
                  labelBuilder: (v) => switch (v) {
                    'expense' => 'Só saídas',
                    'income' => 'Só entradas',
                    _ => 'Entradas e saídas',
                  },
                  onChanged: (v) => setState(() => _entryType = v),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: AppDropdown<String>(
                  value: _kind,
                  items: [_allValue, ...ContractKind.values.map((e) => e.name)],
                  labelBuilder: (v) => switch (v) {
                    'single' => 'Só únicos',
                    'installment' => 'Só parcelados',
                    'recurring' => 'Só recorrentes',
                    _ => 'Todos os lançamentos',
                  },
                  onChanged: (v) => setState(() => _kind = v),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: AppDropdown<String>(
                  value: _category,
                  items: [_allValue, ...TransactionCategories.all],
                  labelBuilder: (v) =>
                      v == _allValue ? 'Todas as categorias' : TransactionCategories.label(v),
                  onChanged: (v) => setState(() => _category = v),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: AppDropdown<_Period>(
                  value: _period,
                  items: _Period.values,
                  labelBuilder: (v) => switch (v) {
                    _Period.threeMonths => 'Últimos 3 meses',
                    _Period.sixMonths => 'Últimos 6 meses',
                    _Period.twelveMonths => 'Últimos 12 meses',
                    _Period.all => 'Tudo',
                  },
                  onChanged: (v) => setState(() => _period = v),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (!hasData)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 32),
              child: Center(
                child: Text(
                  'Nenhum lançamento pago encontrado com esses filtros.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 13, color: context.mutedForeground),
                ),
              ),
            )
          else
            switch (_chartType) {
              _ChartType.categoryPie => _CategoryPieChart(data: categoryData),
              _ChartType.monthlyEvolution => _MonthlyEvolutionChart(data: monthlyData),
              _ChartType.categoryRanking => _CategoryRankingChart(data: categoryData),
            },
        ],
      ),
    );
  }
}

class _CategoryPieChart extends StatelessWidget {
  const _CategoryPieChart({required this.data});

  final List<({String category, double amount})> data;

  @override
  Widget build(BuildContext context) {
    final colors = context.chartColors;
    final total = data.fold<double>(0, (s, e) => s + e.amount);

    return Column(
      children: [
        SizedBox(
          height: 220,
          child: PieChart(
            PieChartData(
              sections: [
                for (var i = 0; i < data.length; i++)
                  PieChartSectionData(
                    value: data[i].amount,
                    color: colors[i % colors.length],
                    title: total > 0 ? '${(data[i].amount / total * 100).round()}%' : '',
                    titleStyle: const TextStyle(
                        fontSize: 11, fontWeight: FontWeight.w700, color: Colors.white),
                    radius: 70,
                  ),
              ],
              centerSpaceRadius: 46,
              sectionsSpace: 2,
            ),
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 12,
          runSpacing: 6,
          alignment: WrapAlignment.center,
          children: [
            for (var i = 0; i < data.length; i++)
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 10,
                    height: 10,
                    decoration: BoxDecoration(
                      color: colors[i % colors.length],
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Text(TransactionCategories.label(data[i].category),
                      style: const TextStyle(fontSize: 11.5)),
                ],
              ),
          ],
        ),
      ],
    );
  }
}

class _MonthlyEvolutionChart extends StatelessWidget {
  const _MonthlyEvolutionChart({required this.data});

  final List<({String month, double entradas, double saidas})> data;

  @override
  Widget build(BuildContext context) {
    final scheme = context.scheme;
    final maxY = data
        .map((e) => e.entradas > e.saidas ? e.entradas : e.saidas)
        .fold<double>(0, (a, b) => a > b ? a : b);

    return Column(
      children: [
        SizedBox(
          height: 220,
          child: BarChart(
            BarChartData(
              maxY: maxY <= 0 ? 100 : maxY * 1.15,
              barGroups: [
                for (var i = 0; i < data.length; i++)
                  BarChartGroupData(x: i, barRods: [
                    BarChartRodData(
                        toY: data[i].entradas, color: scheme.primary, width: 8),
                    BarChartRodData(toY: data[i].saidas, color: scheme.error, width: 8),
                  ]),
              ],
              titlesData: FlTitlesData(
                topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                leftTitles: AxisTitles(
                  sideTitles: SideTitles(showTitles: true, reservedSize: 44),
                ),
                bottomTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    getTitlesWidget: (value, meta) {
                      final index = value.toInt();
                      if (index < 0 || index >= data.length) return const SizedBox.shrink();
                      return Padding(
                        padding: const EdgeInsets.only(top: 6),
                        child: Text(data[index].month, style: const TextStyle(fontSize: 10)),
                      );
                    },
                  ),
                ),
              ),
              borderData: FlBorderData(show: false),
              gridData: const FlGridData(show: true, drawVerticalLine: false),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 16,
          alignment: WrapAlignment.center,
          children: [
            _LegendDot(color: scheme.primary, label: 'Entradas'),
            _LegendDot(color: scheme.error, label: 'Saídas'),
          ],
        ),
      ],
    );
  }
}

class _LegendDot extends StatelessWidget {
  const _LegendDot({required this.color, required this.label});
  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 6),
        Text(label, style: const TextStyle(fontSize: 11.5)),
      ],
    );
  }
}

/// fl_chart não tem barra horizontal nativa — uma lista com barras
/// proporcionais é mais legível em telas estreitas do que rotacionar um
/// BarChart vertical.
class _CategoryRankingChart extends StatelessWidget {
  const _CategoryRankingChart({required this.data});

  final List<({String category, double amount})> data;

  @override
  Widget build(BuildContext context) {
    final colors = context.chartColors;
    final maxAmount = data.first.amount;

    return Column(
      children: [
        for (var i = 0; i < data.length; i++)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(TransactionCategories.label(data[i].category),
                        style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600)),
                    Text(Fmt.currency(data[i].amount),
                        style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700)),
                  ],
                ),
                const SizedBox(height: 4),
                ClipRRect(
                  borderRadius: BorderRadius.circular(6),
                  child: LayoutBuilder(
                    builder: (context, constraints) => Stack(
                      children: [
                        Container(height: 10, color: context.scheme.surfaceContainerHighest),
                        Container(
                          height: 10,
                          width: maxAmount > 0
                              ? constraints.maxWidth * (data[i].amount / maxAmount)
                              : 0,
                          color: colors[i % colors.length],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}
