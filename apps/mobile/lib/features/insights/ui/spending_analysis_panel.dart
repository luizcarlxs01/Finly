import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../../../app/theme.dart';
import '../../../core/format/formatters.dart';
import '../../../core/widgets/form_fields.dart';
import '../../../core/widgets/widgets.dart';
import '../../../shared/models/categories.dart';
import '../../../shared/models/transaction.dart';
import '../data/spending_analysis.dart';

enum _ChartType { categoryPie, monthlyEvolution, categoryRanking }

/// Painel de análise de gastos — espelha
/// apps/web/src/components/dashboard/insights/spending-analysis-panel.tsx.
/// Só lê `lineItems` já pagos, não grava nada. A lógica de filtro/agregação
/// fica em `data/spending_analysis.dart`.
class SpendingAnalysisPanel extends StatefulWidget {
  const SpendingAnalysisPanel({super.key, required this.lineItems});

  final List<LineItem> lineItems;

  @override
  State<SpendingAnalysisPanel> createState() => _SpendingAnalysisPanelState();
}

class _SpendingAnalysisPanelState extends State<SpendingAnalysisPanel> {
  _ChartType _chartType = _ChartType.categoryPie;
  AnalysisFilters _filters = const AnalysisFilters();

  void _update(AnalysisFilters Function(AnalysisFilters f) change) =>
      setState(() => _filters = change(_filters));

  @override
  Widget build(BuildContext context) {
    final filtered = filterAnalysisItems(widget.lineItems, _filters);
    final categoryData = categoryTotals(filtered);
    final monthlyData = monthlyTotals(filtered);
    final hasData = _chartType == _ChartType.monthlyEvolution
        ? monthlyData.isNotEmpty
        : categoryData.isNotEmpty;

    return FinlyCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Análise de gastos',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
          const SizedBox(height: 14),
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
          const SizedBox(height: 10),
          AppDropdown<AnalysisEntryType>(
            value: _filters.entryType,
            items: AnalysisEntryType.values,
            labelBuilder: (v) => switch (v) {
              AnalysisEntryType.expense => 'Só saídas',
              AnalysisEntryType.income => 'Só entradas',
              AnalysisEntryType.all => 'Entradas e saídas',
            },
            onChanged: (v) => _update((f) => AnalysisFilters(
                entryType: v,
                kind: f.kind,
                category: f.category,
                period: f.period)),
          ),
          const SizedBox(height: 10),
          AppDropdown<AnalysisKind>(
            value: _filters.kind,
            items: AnalysisKind.values,
            labelBuilder: (v) => switch (v) {
              AnalysisKind.single => 'Só únicos',
              AnalysisKind.installment => 'Só parcelados',
              AnalysisKind.recurring => 'Só recorrentes',
              AnalysisKind.all => 'Todos os lançamentos',
            },
            onChanged: (v) => _update((f) => AnalysisFilters(
                entryType: f.entryType,
                kind: v,
                category: f.category,
                period: f.period)),
          ),
          const SizedBox(height: 10),
          AppDropdown<String>(
            value: _filters.category,
            items: ['all', ...TransactionCategories.all],
            labelBuilder: (v) => v == 'all'
                ? 'Todas as categorias'
                : TransactionCategories.label(v),
            onChanged: (v) => _update((f) => AnalysisFilters(
                entryType: f.entryType,
                kind: f.kind,
                category: v,
                period: f.period)),
          ),
          const SizedBox(height: 10),
          AppDropdown<AnalysisPeriod>(
            value: _filters.period,
            items: AnalysisPeriod.values,
            labelBuilder: (v) => switch (v) {
              AnalysisPeriod.threeMonths => 'Últimos 3 meses',
              AnalysisPeriod.sixMonths => 'Últimos 6 meses',
              AnalysisPeriod.twelveMonths => 'Últimos 12 meses',
              AnalysisPeriod.all => 'Tudo',
            },
            onChanged: (v) => _update((f) => AnalysisFilters(
                entryType: f.entryType,
                kind: f.kind,
                category: f.category,
                period: v)),
          ),
          const SizedBox(height: 16),
          if (!hasData)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 40),
              child: Center(
                child: Text(
                  'Nenhum lançamento pago encontrado com esses filtros.',
                  textAlign: TextAlign.center,
                  style:
                      TextStyle(fontSize: 14, color: context.mutedForeground),
                ),
              ),
            )
          else
            switch (_chartType) {
              _ChartType.categoryPie => _CategoryPieChart(data: categoryData),
              _ChartType.monthlyEvolution =>
                _MonthlyEvolutionChart(data: monthlyData),
              _ChartType.categoryRanking =>
                _CategoryRankingChart(data: categoryData),
            },
        ],
      ),
    );
  }
}

class _CategoryPieChart extends StatefulWidget {
  const _CategoryPieChart({required this.data});

  final List<CategoryTotal> data;

  @override
  State<_CategoryPieChart> createState() => _CategoryPieChartState();
}

class _CategoryPieChartState extends State<_CategoryPieChart> {
  int? _touched;

  @override
  Widget build(BuildContext context) {
    final data = widget.data;
    final colors = context.chartColors;
    final touched =
        _touched != null && _touched! < data.length ? _touched : null;

    return Column(
      children: [
        SizedBox(
          height: 240,
          child: PieChart(
            PieChartData(
              sections: [
                for (var i = 0; i < data.length; i++)
                  PieChartSectionData(
                    value: data[i].amount,
                    color: colors[i % colors.length],
                    showTitle: false,
                    radius: touched == i ? 58 : 52,
                  ),
              ],
              centerSpaceRadius: 54,
              sectionsSpace: 2,
              pieTouchData: PieTouchData(
                touchCallback: (event, response) => setState(() {
                  _touched = event.isInterestedForInteractions
                      ? response?.touchedSection?.touchedSectionIndex
                      : null;
                }),
              ),
            ),
          ),
        ),
        SizedBox(
          height: 24,
          child: Center(
            child: Text(
              touched == null
                  ? ''
                  : '${TransactionCategories.label(data[touched].category)}: ${Fmt.currency(data[touched].amount)}',
              style:
                  const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600),
            ),
          ),
        ),
        const SizedBox(height: 4),
        Wrap(
          spacing: 14,
          runSpacing: 6,
          alignment: WrapAlignment.center,
          children: [
            for (var i = 0; i < data.length; i++)
              _LegendDot(
                  color: colors[i % colors.length],
                  label: TransactionCategories.label(data[i].category)),
          ],
        ),
      ],
    );
  }
}

class _MonthlyEvolutionChart extends StatelessWidget {
  const _MonthlyEvolutionChart({required this.data});

  final List<MonthlyTotal> data;

  @override
  Widget build(BuildContext context) {
    final scheme = context.scheme;
    final outColor = context.chartColors[1];
    final maxY = data
        .map((e) => e.entradas > e.saidas ? e.entradas : e.saidas)
        .fold<double>(0, (a, b) => a > b ? a : b);
    const radius = BorderRadius.vertical(top: Radius.circular(4));

    return Column(
      children: [
        SizedBox(
          height: 260,
          child: BarChart(
            BarChartData(
              maxY: maxY <= 0 ? 100 : maxY * 1.15,
              barGroups: [
                for (var i = 0; i < data.length; i++)
                  BarChartGroupData(x: i, barsSpace: 3, barRods: [
                    BarChartRodData(
                        toY: data[i].entradas,
                        color: scheme.primary,
                        width: 9,
                        borderRadius: radius),
                    BarChartRodData(
                        toY: data[i].saidas,
                        color: outColor,
                        width: 9,
                        borderRadius: radius),
                  ]),
              ],
              barTouchData: BarTouchData(
                touchTooltipData: BarTouchTooltipData(
                  getTooltipItem: (group, _, rod, rodIndex) => BarTooltipItem(
                    '${rodIndex == 0 ? 'Entradas' : 'Saídas'}: ${Fmt.currency(rod.toY)}',
                    TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: scheme.onInverseSurface),
                  ),
                ),
              ),
              titlesData: FlTitlesData(
                topTitles:
                    const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                rightTitles:
                    const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                leftTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    reservedSize: 52,
                    getTitlesWidget: (value, meta) {
                      if (value == meta.max) return const SizedBox.shrink();
                      return Text(analysisAxisAmount(value),
                          style: TextStyle(
                              fontSize: 10, color: context.mutedForeground));
                    },
                  ),
                ),
                bottomTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    getTitlesWidget: (value, meta) {
                      final index = value.toInt();
                      if (index < 0 || index >= data.length) {
                        return const SizedBox.shrink();
                      }
                      return Padding(
                        padding: const EdgeInsets.only(top: 6),
                        child: Text(analysisMonthLabel(data[index].key),
                            style: TextStyle(
                                fontSize: 10, color: context.mutedForeground)),
                      );
                    },
                  ),
                ),
              ),
              borderData: FlBorderData(show: false),
              gridData: FlGridData(
                show: true,
                drawVerticalLine: false,
                getDrawingHorizontalLine: (_) => FlLine(
                    color: scheme.outline.withValues(alpha: 0.6),
                    strokeWidth: 1,
                    dashArray: [3, 3]),
              ),
            ),
          ),
        ),
        const SizedBox(height: 10),
        Wrap(
          spacing: 16,
          alignment: WrapAlignment.center,
          children: [
            _LegendDot(color: scheme.primary, label: 'Entradas'),
            _LegendDot(color: outColor, label: 'Saídas'),
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
        Text(label, style: const TextStyle(fontSize: 12)),
      ],
    );
  }
}

/// fl_chart não tem barra horizontal nativa — uma lista com barras
/// proporcionais é mais legível em telas estreitas do que rotacionar um
/// BarChart vertical (o web usa BarChart vertical com layout horizontal).
class _CategoryRankingChart extends StatelessWidget {
  const _CategoryRankingChart({required this.data});

  final List<CategoryTotal> data;

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
                        style: const TextStyle(
                            fontSize: 12.5, fontWeight: FontWeight.w600)),
                    Text(Fmt.currency(data[i].amount),
                        style: const TextStyle(
                            fontSize: 12.5, fontWeight: FontWeight.w700)),
                  ],
                ),
                const SizedBox(height: 4),
                ClipRRect(
                  borderRadius: const BorderRadius.horizontal(
                      right: Radius.circular(4), left: Radius.circular(4)),
                  child: LayoutBuilder(
                    builder: (context, constraints) => Stack(
                      children: [
                        Container(
                            height: 12,
                            color: context.scheme.surfaceContainerHighest),
                        Container(
                          height: 12,
                          width: maxAmount > 0
                              ? constraints.maxWidth *
                                  (data[i].amount / maxAmount)
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
