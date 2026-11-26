import 'dart:math' as math;

import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/app.dart';
import '../../../app/shell.dart';
import '../../../app/theme.dart';
import '../../../core/format/formatters.dart';
import '../../../core/privacy/value_privacy.dart';
import '../../../core/widgets/widgets.dart';
import '../../../shared/models/categories.dart';
import '../../../shared/models/category_icons.dart';
import '../../../shared/models/enums.dart';
import '../../../shared/models/goal.dart';
import '../../../shared/models/transaction.dart';
import '../../goals/state/goals_controller.dart';
import '../../transactions/state/finance_controller.dart';
import '../data/home_overview.dart';

/// Espelha o painel financeiro de DashboardHomeView da web.
class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  HomePeriod _period = HomePeriod.sixMonths;
  bool _showMonthlyResult = false;

  @override
  Widget build(BuildContext context) {
    final _hidden = ref.watch(valuePrivacyProvider);
    final financeAsync = ref.watch(financeControllerProvider);
    final goalsAsync = ref.watch(goalsControllerProvider);
    final finance = financeAsync.valueOrNull ?? FinanceData.empty;
    final goals = goalsAsync.valueOrNull?.goals ?? <Goal>[];
    final overview = HomeOverview.build(
      items: finance.lineItems,
      currentBalance: finance.currentBalance,
      today: DateTime.now(),
      period: _period,
    );
    final loading = (financeAsync.isLoading && !financeAsync.hasValue) ||
        (goalsAsync.isLoading && !goalsAsync.hasValue);
    final error = financeAsync.hasError && !financeAsync.hasValue
        ? financeAsync.error
        : goalsAsync.hasError && !goalsAsync.hasValue
            ? goalsAsync.error
            : null;

    return Scaffold(
      appBar:
          const FinlyAppBar(title: 'Finly', themeToggle: ThemeToggleButton()),
      body: RefreshIndicator(
        onRefresh: () async {
          await ref.read(financeControllerProvider.notifier).refresh();
          await ref.read(goalsControllerProvider.notifier).refresh();
        },
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 30),
          children: [
            Row(children: [
              const Expanded(
                  child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Visão geral',
                      style:
                          TextStyle(fontSize: 27, fontWeight: FontWeight.w700)),
                  SizedBox(height: 3),
                  Text('Suas finanças em um só lugar',
                      style: TextStyle(fontSize: 14)),
                ],
              )),
              IconButton(
                tooltip: _hidden ? 'Mostrar valores' : 'Ocultar valores',
                onPressed: () =>
                    ref.read(valuePrivacyProvider.notifier).toggle(),
                icon: Icon(_hidden
                    ? Icons.visibility_off_outlined
                    : Icons.visibility_outlined),
              ),
            ]),
            const SizedBox(height: 20),
            if (loading)
              const Padding(
                  padding: EdgeInsets.symmetric(vertical: 80),
                  child: Center(child: CircularProgressIndicator()))
            else if (error != null)
              ErrorBanner(error.toString(), onRetry: () async {
                await ref.read(financeControllerProvider.notifier).refresh();
                await ref.read(goalsControllerProvider.notifier).refresh();
              })
            else ...[
              _BalanceOrb(
                label: _showMonthlyResult ? 'Resultado do mês' : 'Saldo atual',
                value: _hidden
                    ? '••••••'
                    : Fmt.currency(_showMonthlyResult
                        ? overview.monthlyResult
                        : finance.currentBalance),
                onTap: () =>
                    setState(() => _showMonthlyResult = !_showMonthlyResult),
              ),
              const SizedBox(height: 18),
              _DashboardCard(
                  onTap: () => context.go('/goals'),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const _CardTitle('Metas'),
                      const Divider(height: 24),
                      if (goals.isEmpty)
                        const Padding(
                            padding: EdgeInsets.symmetric(vertical: 22),
                            child:
                                Center(child: Text('Nenhuma meta cadastrada.')))
                      else
                        ...goals.take(2).map((goal) =>
                            _GoalPreview(goal: goal, hidden: _hidden)),
                    ],
                  )),
              const SizedBox(height: 14),
              _DashboardCard(
                  onTap: () => context.go('/insights'),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: [
                        Expanded(
                            child: Text(overview.insightTitle,
                                style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700))),
                        PillBadge(
                            label: overview.insightBadge,
                            background:
                                context.scheme.primary.withValues(alpha: 0.14),
                            foreground: context.scheme.primary),
                      ]),
                      const SizedBox(height: 8),
                      Text(overview.insightDescription,
                          style: TextStyle(
                              fontSize: 14, color: context.mutedForeground)),
                    ],
                  )),
              const SizedBox(height: 14),
              _DashboardCard(
                  onTap: () => context.go('/transactions'),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const _CardTitle('Transações Recentes'),
                      const Divider(height: 24),
                      if (overview.recent.isEmpty)
                        const Padding(
                            padding: EdgeInsets.symmetric(vertical: 22),
                            child: Center(
                                child:
                                    Text('Nenhuma transação paga até hoje.')))
                      else
                        ...overview.recent.take(5).map((item) =>
                            _RecentTransaction(item: item, hidden: _hidden)),
                    ],
                  )),
              const SizedBox(height: 14),
              _DashboardCard(
                  child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Fluxo de Caixa',
                      style:
                          TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 12),
                  SegmentedButton<HomePeriod>(
                    segments: const [
                      ButtonSegment(
                          value: HomePeriod.sixMonths, label: Text('6M')),
                      ButtonSegment(value: HomePeriod.ytd, label: Text('YTD')),
                      ButtonSegment(value: HomePeriod.year, label: Text('1A')),
                    ],
                    selected: {_period},
                    showSelectedIcon: false,
                    onSelectionChanged: (values) =>
                        setState(() => _period = values.first),
                  ),
                  const SizedBox(height: 18),
                  if (_hidden)
                    const SizedBox(
                        height: 190,
                        child: Center(child: Text('Valores ocultos')))
                  else if (overview.months
                      .every((m) => m.income == 0 && m.expense == 0))
                    const SizedBox(
                        height: 190,
                        child: Center(
                            child: Text(
                                'Sem movimentações pagas neste período.',
                                textAlign: TextAlign.center)))
                  else
                    _CashFlowChart(months: overview.months),
                  const SizedBox(height: 12),
                  Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    _LegendDot('Receitas', context.chartColors[0]),
                    const SizedBox(width: 18),
                    _LegendDot('Despesas', context.chartColors[1]),
                  ]),
                ],
              )),
            ],
          ],
        ),
      ),
    );
  }
}

class _DashboardCard extends StatelessWidget {
  const _DashboardCard({required this.child, this.onTap});
  final Widget child;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final card = Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        gradient: LinearGradient(colors: [
          context.scheme.surface.withValues(alpha: 0.96),
          context.scheme.surface.withValues(alpha: 0.82),
        ]),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF031533).withValues(alpha: 0.08),
            blurRadius: 24,
            offset: const Offset(0, 8),
          )
        ],
      ),
      child: child,
    );
    return onTap == null
        ? card
        : InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(14),
            child: card,
          );
  }
}

class _CardTitle extends StatelessWidget {
  const _CardTitle(this.text);
  final String text;

  @override
  Widget build(BuildContext context) => Row(children: [
        Expanded(
            child: Text(text,
                style: const TextStyle(
                    fontSize: 20, fontWeight: FontWeight.w700))),
        Icon(Icons.arrow_forward, size: 18, color: context.scheme.primary),
      ]);
}

class _BalanceOrb extends StatefulWidget {
  const _BalanceOrb(
      {required this.label, required this.value, required this.onTap});
  final String label;
  final String value;
  final VoidCallback onTap;

  @override
  State<_BalanceOrb> createState() => _BalanceOrbState();
}

class _BalanceOrbState extends State<_BalanceOrb>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl =
      AnimationController(vsync: this, duration: const Duration(seconds: 14))
        ..repeat();

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final reduce = MediaQuery.of(context).disableAnimations;
    if (reduce && _ctrl.isAnimating) _ctrl.stop();
    final scheme = context.scheme;
    return Center(
        child: Semantics(
      button: true,
      label: '${widget.label}. Toque para alternar o indicador',
      child: GestureDetector(
        onTap: widget.onTap,
        child: SizedBox(
          width: 300,
          height: 300,
          child: Stack(alignment: Alignment.center, children: [
            Positioned.fill(
              child: AnimatedBuilder(
                animation: _ctrl,
                builder: (_, __) => CustomPaint(
                    painter: _OrbPainter(
                        t: _ctrl.value,
                        primary: scheme.primary,
                        card: scheme.surface)),
              ),
            ),
            SizedBox(
              width: 216,
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 260),
                transitionBuilder: (child, anim) => FadeTransition(
                  opacity: anim,
                  child: SlideTransition(
                    position: Tween<Offset>(
                            begin: const Offset(0, -0.25), end: Offset.zero)
                        .animate(anim),
                    child: child,
                  ),
                ),
                child: Column(
                  key: ValueKey(widget.label),
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(widget.label,
                        style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w500,
                            color: scheme.onSurface)),
                    const SizedBox(height: 6),
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Text(widget.value,
                          style: TextStyle(
                              fontSize: 30,
                              fontWeight: FontWeight.w700,
                              color: scheme.primary)),
                    ),
                  ],
                ),
              ),
            ),
            Positioned(
              bottom: 44,
              child: Icon(Icons.keyboard_arrow_down,
                  size: 20, color: scheme.primary),
            ),
          ]),
        ),
      ),
    ));
  }
}

/// Aproxima o `Orb` (WebGL) da web: esfera azul com ondas de cor girando
/// suavemente e halo interno na cor do cartão.
class _OrbPainter extends CustomPainter {
  _OrbPainter({required this.t, required this.primary, required this.card});
  final double t;
  final Color primary;
  final Color card;

  @override
  void paint(Canvas canvas, Size size) {
    final c = size.center(Offset.zero);
    final r = size.width / 2;
    final rect = Rect.fromCircle(center: c, radius: r);
    final angle = t * 6.2831853;

    canvas.save();
    canvas.clipPath(Path()..addOval(rect));
    canvas.drawRect(
        rect,
        Paint()
          ..shader = RadialGradient(colors: [
            primary.withValues(alpha: 0.10),
            primary.withValues(alpha: 0.45),
            primary.withValues(alpha: 0.85),
          ], stops: const [
            0.0,
            0.62,
            1.0
          ]).createShader(rect));
    final lights = [
      (const Color(0xFF7FB2FF), 0.0, 0.55),
      (const Color(0xFF3B7BFF), 2.1, 0.45),
      (const Color(0xFFB8D4FF), 4.2, 0.4),
    ];
    for (final (color, phase, dist) in lights) {
      final a = angle + phase;
      final p = c + Offset(math.cos(a), math.sin(a)) * (r * dist);
      canvas.drawCircle(
          p,
          r * 0.42,
          Paint()
            ..shader = RadialGradient(colors: [
              color.withValues(alpha: 0.55),
              color.withValues(alpha: 0),
            ]).createShader(Rect.fromCircle(center: p, radius: r * 0.42)));
    }
    canvas.restore();

    canvas.drawCircle(
        c,
        r * 0.62,
        Paint()
          ..shader = RadialGradient(colors: [
            card,
            card.withValues(alpha: 0.85),
            card.withValues(alpha: 0),
          ], stops: const [
            0.0,
            0.5,
            1.0
          ]).createShader(Rect.fromCircle(center: c, radius: r * 0.62)));
    canvas.drawCircle(
        c,
        r,
        Paint()
          ..maskFilter = const MaskFilter.blur(BlurStyle.outer, 18)
          ..color = primary.withValues(alpha: 0.18));
  }

  @override
  bool shouldRepaint(_OrbPainter old) =>
      old.t != t || old.primary != primary || old.card != card;
}

class _GoalPreview extends StatelessWidget {
  const _GoalPreview({required this.goal, required this.hidden});
  final Goal goal;
  final bool hidden;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Expanded(
                child: Text(goal.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.w600))),
            Text(hidden ? '••••' : '${goal.progressPercent.round()}%',
                style: TextStyle(
                    color: context.scheme.primary,
                    fontWeight: FontWeight.w700)),
          ]),
          const SizedBox(height: 8),
          LinearProgressIndicator(
              value: hidden ? 0 : goal.progressPercent / 100,
              minHeight: 7,
              borderRadius: BorderRadius.circular(12),
              backgroundColor: context.scheme.primary.withValues(alpha: 0.12)),
          const SizedBox(height: 7),
          Row(children: [
            Expanded(
                child: Text(
                    hidden ? '••••••' : Fmt.currency(goal.currentAmount),
                    style: TextStyle(
                        fontSize: 11, color: context.mutedForeground))),
            Text(hidden ? '••••••' : 'Meta: ${Fmt.currency(goal.targetAmount)}',
                style: TextStyle(fontSize: 11, color: context.mutedForeground)),
          ]),
        ]),
      );
}

class _RecentTransaction extends StatelessWidget {
  const _RecentTransaction({required this.item, required this.hidden});
  final LineItem item;
  final bool hidden;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(children: [
          CircleAvatar(
              backgroundColor: context.scheme.primary.withValues(alpha: 0.08),
              child: Icon(categoryIcon(item.category),
                  color: context.scheme.primary, size: 21)),
          const SizedBox(width: 10),
          Expanded(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                Text(item.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.w600)),
                Text(
                    '${TransactionCategories.label(item.category)} · ${Fmt.businessDate(item.dueDate) ?? item.dueDate}',
                    style: TextStyle(
                        fontSize: 11, color: context.mutedForeground)),
              ])),
          const SizedBox(width: 6),
          Text(
              hidden
                  ? '••••••'
                  : '${item.type == TransactionType.income ? '+' : '−'} ${Fmt.currency(item.amount)}',
              style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: item.type == TransactionType.income
                      ? context.success
                      : context.scheme.onSurface)),
        ]),
      );
}

class _CashFlowChart extends StatelessWidget {
  const _CashFlowChart({required this.months});
  final List<MonthlyFlow> months;

  @override
  Widget build(BuildContext context) {
    final max = months.fold<double>(
        0,
        (value, month) => [value, month.income, month.expense]
            .reduce((a, b) => a > b ? a : b));
    return SizedBox(
        height: 190,
        child: LineChart(LineChartData(
          minY: 0,
          maxY: max == 0 ? 1 : max * 1.2,
          gridData: FlGridData(
              show: true,
              drawVerticalLine: false,
              getDrawingHorizontalLine: (_) => FlLine(
                  color: context.scheme.outline.withValues(alpha: 0.5),
                  strokeWidth: 1)),
          borderData: FlBorderData(show: false),
          lineTouchData: LineTouchData(
            touchTooltipData: LineTouchTooltipData(
              getTooltipItems: (spots) => [
                for (final s in spots)
                  LineTooltipItem(
                      '${s.barIndex == 0 ? 'Receitas' : 'Despesas'}: ${Fmt.currency(s.y)}',
                      TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: s.bar.color))
              ],
            ),
          ),
          titlesData: FlTitlesData(
            leftTitles: AxisTitles(
                sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 46,
              getTitlesWidget: (value, meta) {
                if (value == meta.max || value == meta.min && value != 0) {
                  return const SizedBox.shrink();
                }
                return Text(_compactMoney(value),
                    style: TextStyle(
                        fontSize: 10, color: context.mutedForeground));
              },
            )),
            rightTitles:
                const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            topTitles:
                const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            bottomTitles: AxisTitles(
                sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 24,
              interval: months.length > 6 ? 2 : 1,
              getTitlesWidget: (value, _) {
                final index = value.toInt();
                if (index < 0 || index >= months.length || index != value) {
                  return const SizedBox.shrink();
                }
                return Text(_monthLabel(months[index].key),
                    style: TextStyle(
                        fontSize: 10, color: context.mutedForeground));
              },
            )),
          ),
          lineBarsData: [
            _line(months.map((month) => month.income).toList(),
                context.chartColors[0], true),
            _line(months.map((month) => month.expense).toList(),
                context.chartColors[1], false),
          ],
        )));
  }

  LineChartBarData _line(List<double> values, Color color, bool fill) =>
      LineChartBarData(
        spots: [
          for (var i = 0; i < values.length; i++)
            FlSpot(i.toDouble(), values[i])
        ],
        isCurved: true,
        color: color,
        barWidth: 2.5,
        dotData: const FlDotData(show: false),
        belowBarData:
            BarAreaData(show: fill, color: color.withValues(alpha: 0.12)),
      );
}

String _compactMoney(double v) {
  final abs = v.abs();
  if (abs >= 1000000) return 'R\$ ${(v / 1000000).toStringAsFixed(1)} mi';
  if (abs >= 1000) return 'R\$ ${(v / 1000).toStringAsFixed(0)} mil';
  return 'R\$ ${v.toStringAsFixed(0)}';
}

String _monthLabel(String key) {
  const names = [
    'jan',
    'fev',
    'mar',
    'abr',
    'mai',
    'jun',
    'jul',
    'ago',
    'set',
    'out',
    'nov',
    'dez'
  ];
  final month = int.tryParse(key.substring(5)) ?? 1;
  return '${names[month - 1]}. ${key.substring(2, 4)}';
}

class _LegendDot extends StatelessWidget {
  const _LegendDot(this.label, this.color);
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) => Row(children: [
        Container(
            width: 9,
            height: 9,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 6),
        Text(label,
            style: TextStyle(fontSize: 12, color: context.mutedForeground)),
      ]);
}
