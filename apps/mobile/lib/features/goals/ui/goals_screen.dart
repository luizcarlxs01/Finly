import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/app.dart';
import '../../../app/shell.dart';
import '../../../app/theme.dart';
import '../../../core/format/formatters.dart';
import '../../../core/widgets/form_fields.dart';
import '../../../core/widgets/widgets.dart';
import '../../../shared/models/categories.dart';
import '../../../shared/models/category_icons.dart';
import '../../../shared/models/goal.dart';
import '../state/goals_controller.dart';
import '../data/goal_list_query.dart';
import 'goal_form_sheet.dart';
import 'goal_progress_sheet.dart';

/// Espelha apps/web/src/components/dashboard/views/dashboard-goals-view.tsx
/// + goal-list.tsx.
class GoalsScreen extends ConsumerStatefulWidget {
  const GoalsScreen({super.key});

  @override
  ConsumerState<GoalsScreen> createState() => _GoalsScreenState();
}

class _GoalsScreenState extends ConsumerState<GoalsScreen> {
  static String _dateKey(DateTime date) =>
      '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';

  GoalTab _tab = GoalTab.active;
  GoalSort _sort = GoalSort.newest;
  String? _category;
  String? _from;
  String? _to;
  String _search = '';
  int _page = 1;
  int? _pageSize = 5;
  final _lastContributions = <String, double>{};

  Future<void> _confirmRemove(Goal goal) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Remover meta'),
        content:
            Text('Remover "${goal.title}"? Essa ação não pode ser desfeita.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancelar')),
          FilledButton(
            style: FilledButton.styleFrom(
                backgroundColor: Theme.of(ctx).colorScheme.error),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Remover'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      try {
        await ref.read(goalsControllerProvider.notifier).deleteGoal(goal.id);
      } catch (e) {
        if (context.mounted) showErrorSnack(context, e);
      }
    }
  }

  Future<void> _addContribution(Goal goal, {double? quickAmount}) async {
    var amount = quickAmount;
    if (amount == null) {
      final input = TextEditingController();
      final text = await showDialog<String>(
        context: context,
        builder: (dialogContext) => AlertDialog(
          title: Text('Adicionar a ${goal.title}'),
          content: AppTextField(
              controller: input,
              hint: 'Valor do aporte',
              keyboardType:
                  const TextInputType.numberWithOptions(decimal: true)),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(dialogContext),
                child: const Text('Cancelar')),
            FilledButton(
                onPressed: () => Navigator.pop(dialogContext, input.text),
                child: const Text('Adicionar')),
          ],
        ),
      );
      input.dispose();
      if (text == null) return;
      amount = parseAmount(text);
    }
    if (amount == null || amount <= 0) {
      if (mounted) showInfoSnack(context, 'Informe um valor maior que zero.');
      return;
    }
    try {
      await ref
          .read(goalsControllerProvider.notifier)
          .updateProgress(goal.id, goal.currentAmount + amount);
      if (mounted) setState(() => _lastContributions[goal.id] = amount!);
    } catch (error) {
      if (mounted) showErrorSnack(context, error);
    }
  }

  Future<void> _showFilters() async {
    var draftCategory = _category;
    var draftSort = _sort;
    var draftFrom = _from;
    var draftTo = _to;
    var rangeMode = _from != null && _to != null;
    String? error;
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (sheetContext) =>
          StatefulBuilder(builder: (sheetContext, update) {
        Widget option(String label, bool selected, VoidCallback onTap) {
          final scheme = sheetContext.scheme;
          return Expanded(
            child: GestureDetector(
              onTap: onTap,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color:
                      selected ? scheme.primary.withValues(alpha: 0.1) : null,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                      color: selected ? scheme.primary : scheme.outline),
                ),
                child: Text(label,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        fontSize: 13,
                        color: selected ? scheme.primary : scheme.onSurface)),
              ),
            ),
          );
        }

        void pickSort(GoalSort sort) => update(() {
              draftSort = draftSort == sort ? GoalSort.newest : sort;
              rangeMode = false;
              draftFrom = null;
              draftTo = null;
              error = null;
            });

        Widget group(String title, List<Widget> children) => Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Divider(height: 28),
                Text(title,
                    style: const TextStyle(fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                Row(children: [
                  for (var i = 0; i < children.length; i++) ...[
                    if (i > 0) const SizedBox(width: 8),
                    children[i],
                  ]
                ]),
              ],
            );

        return SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Center(
                  child: Text('Filtros',
                      style:
                          TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                ),
                const SizedBox(height: 16),
                const Text('Categoria',
                    style: TextStyle(fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  initialValue: draftCategory ?? '',
                  isExpanded: true,
                  items: [
                    const DropdownMenuItem(
                        value: '', child: Text('Todas as categorias')),
                    const DropdownMenuItem(
                        value: 'general', child: Text('Geral')),
                    ...TransactionCategories.all.where((c) => c != 'geral').map(
                        (c) => DropdownMenuItem(
                            value: c,
                            child: Text(TransactionCategories.goalLabel(c)))),
                  ],
                  onChanged: (value) => update(() => draftCategory = value),
                ),
                group('Prazo', [
                  option('Mais próximo', draftSort == GoalSort.nearestDeadline,
                      () => pickSort(GoalSort.nearestDeadline)),
                  option('Período específico', rangeMode, () {
                    update(() {
                      rangeMode = !rangeMode;
                      draftSort = GoalSort.newest;
                      if (!rangeMode) {
                        draftFrom = null;
                        draftTo = null;
                      }
                      error = null;
                    });
                  }),
                ]),
                if (rangeMode) ...[
                  const SizedBox(height: 10),
                  OutlinedButton.icon(
                    icon: const Icon(Icons.date_range_outlined),
                    label: Text(draftFrom == null || draftTo == null
                        ? 'Selecionar período (De / Até)'
                        : '${Fmt.businessDate(draftFrom)} a ${Fmt.businessDate(draftTo)}'),
                    onPressed: () async {
                      final selected = await showDateRangePicker(
                        context: sheetContext,
                        firstDate: DateTime(2000),
                        lastDate: DateTime(2100),
                        initialDateRange: draftFrom != null && draftTo != null
                            ? DateTimeRange(
                                start: DateTime.parse(draftFrom!),
                                end: DateTime.parse(draftTo!))
                            : null,
                      );
                      if (selected != null && sheetContext.mounted) {
                        update(() {
                          draftFrom = _dateKey(selected.start);
                          draftTo = _dateKey(selected.end);
                          error = null;
                        });
                      }
                    },
                  ),
                ],
                group('Progresso', [
                  option(
                      'Mais próxima de atingir',
                      draftSort == GoalSort.closestProgress,
                      () => pickSort(GoalSort.closestProgress)),
                  option(
                      'Mais distante de atingir',
                      draftSort == GoalSort.furthestProgress,
                      () => pickSort(GoalSort.furthestProgress)),
                ]),
                group('Valor', [
                  option(
                      'Maior valor adicionado',
                      draftSort == GoalSort.highestCurrent,
                      () => pickSort(GoalSort.highestCurrent)),
                  option(
                      'Maior valor alvo',
                      draftSort == GoalSort.highestTarget,
                      () => pickSort(GoalSort.highestTarget)),
                ]),
                if (error != null) ...[
                  const SizedBox(height: 12),
                  Text(error!,
                      style: TextStyle(color: sheetContext.scheme.error)),
                ],
                const SizedBox(height: 16),
                Row(children: [
                  TextButton(
                      onPressed: () => update(() {
                            draftCategory = null;
                            draftSort = GoalSort.newest;
                            draftFrom = null;
                            draftTo = null;
                            rangeMode = false;
                            error = null;
                          }),
                      child: const Text('Limpar')),
                  const Spacer(),
                  FilledButton(
                      onPressed: () {
                        if (rangeMode &&
                            (draftFrom == null || draftTo == null)) {
                          update(() => error =
                              'Informe um período válido: De deve ser anterior ou igual a Até.');
                          return;
                        }
                        setState(() {
                          _category = draftCategory?.isEmpty == true
                              ? null
                              : draftCategory;
                          _sort = draftSort;
                          _from = rangeMode ? draftFrom : null;
                          _to = rangeMode ? draftTo : null;
                          _page = 1;
                        });
                        Navigator.pop(sheetContext);
                      },
                      child: const Text('Aplicar filtros')),
                ]),
              ],
            ),
          ),
        );
      }),
    );
  }

  bool get _hasFilters =>
      _category != null || _sort != GoalSort.newest || _from != null;

  @override
  Widget build(BuildContext context) {
    final goalsAsync = ref.watch(goalsControllerProvider);
    final scheme = context.scheme;

    return Scaffold(
      appBar:
          const FinlyAppBar(title: 'Metas', themeToggle: ThemeToggleButton()),
      body: RefreshIndicator(
        onRefresh: () => ref.read(goalsControllerProvider.notifier).refresh(),
        child: goalsAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => ListView(
            padding: const EdgeInsets.all(16),
            children: [
              ErrorBanner(e.toString(),
                  onRetry: () =>
                      ref.read(goalsControllerProvider.notifier).refresh()),
            ],
          ),
          data: (state) {
            final result = GoalListQuery(
              goals: state.goals,
              today: DateTime.now(),
              tab: _tab,
              search: _search,
              category: _category,
              from: _from,
              to: _to,
              sort: _sort,
              page: _page,
              pageSize: _pageSize,
            ).resolve();
            final currentPage = _page.clamp(1, result.pageCount);
            final first = result.filteredCount == 0
                ? 0
                : _pageSize == null
                    ? 1
                    : (currentPage - 1) * _pageSize! + 1;
            final last = _pageSize == null
                ? result.filteredCount
                : (currentPage * _pageSize!).clamp(0, result.filteredCount);
            final noResults = state.goals.isNotEmpty &&
                (_search.trim().isNotEmpty || _hasFilters);
            return ListView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
              children: [
                _SummaryRow(items: [
                  ('${result.activeCount}', 'Em andamento'),
                  ('${result.completedCount}', 'Metas batidas'),
                  ('${result.approachingCount}', 'Próximas do prazo'),
                ]),
                const SizedBox(height: 18),
                FinlyCard(
                  padding: EdgeInsets.zero,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(14),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            _GoalTabs(
                              value: _tab,
                              onChanged: (tab) => setState(() {
                                _tab = tab;
                                _page = 1;
                              }),
                            ),
                            const SizedBox(height: 12),
                            Row(children: [
                              Expanded(
                                child: Container(
                                  height: 44,
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 12),
                                  decoration: BoxDecoration(
                                    color: scheme.surfaceContainerHighest,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Row(children: [
                                    Icon(Icons.search,
                                        size: 18,
                                        color: context.mutedForeground),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: TextField(
                                        onChanged: (value) => setState(() {
                                          _search = value;
                                          _page = 1;
                                        }),
                                        style: const TextStyle(fontSize: 14),
                                        decoration: const InputDecoration(
                                          hintText: 'Buscar em todas as metas',
                                          border: InputBorder.none,
                                          enabledBorder: InputBorder.none,
                                          focusedBorder: InputBorder.none,
                                          filled: false,
                                          isDense: true,
                                          contentPadding: EdgeInsets.zero,
                                        ),
                                      ),
                                    ),
                                  ]),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Stack(clipBehavior: Clip.none, children: [
                                InkWell(
                                  onTap: _showFilters,
                                  borderRadius: BorderRadius.circular(12),
                                  child: Container(
                                    width: 44,
                                    height: 44,
                                    decoration: BoxDecoration(
                                      color: scheme.surfaceContainerHighest,
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: const Icon(Icons.tune, size: 18),
                                  ),
                                ),
                                if (_hasFilters)
                                  Positioned(
                                    right: 0,
                                    top: 0,
                                    child: Container(
                                      width: 10,
                                      height: 10,
                                      decoration: BoxDecoration(
                                          color: scheme.primary,
                                          shape: BoxShape.circle),
                                    ),
                                  ),
                              ]),
                            ]),
                            const SizedBox(height: 12),
                            SizedBox(
                              height: 44,
                              child: FilledButton.icon(
                                onPressed: () => showGoalFormSheet(context),
                                icon: const Icon(Icons.add, size: 18),
                                label: const Text('Nova meta'),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Divider(height: 1),
                      if (result.visible.isEmpty)
                        Padding(
                          padding: const EdgeInsets.symmetric(
                              vertical: 44, horizontal: 16),
                          child: Column(children: [
                            Icon(Icons.sentiment_dissatisfied_outlined,
                                size: 72,
                                color: context.mutedForeground
                                    .withValues(alpha: 0.5)),
                            if (noResults) ...[
                              const SizedBox(height: 14),
                              Text(
                                  'Nenhuma meta corresponde à busca ou aos filtros.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                      fontSize: 13.5,
                                      color: context.mutedForeground)),
                            ],
                          ]),
                        )
                      else
                        ...result.visible.indexed.map((entry) {
                          final goal = entry.$2;
                          final quick = _lastContributions[goal.id] ??
                              (goal.currentAmount > 0 ? goal.currentAmount : 1);
                          return Column(children: [
                            if (entry.$1 > 0) const Divider(height: 1),
                            _GoalRow(
                              goal: goal,
                              quickAmount: quick,
                              onQuickAdd: () =>
                                  _addContribution(goal, quickAmount: quick),
                              onAdd: () => _addContribution(goal),
                              onEdit: () =>
                                  showGoalProgressSheet(context, goal),
                              onRemove: () => _confirmRemove(goal),
                            ),
                          ]);
                        }),
                      if (result.filteredCount > 0) ...[
                        const Divider(height: 1),
                        Padding(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 6),
                          child: Row(children: [
                            Text('$first–$last',
                                style: TextStyle(
                                    fontSize: 13,
                                    color: context.mutedForeground)),
                            const SizedBox(width: 10),
                            DropdownButtonHideUnderline(
                              child: DropdownButton<int?>(
                                value: _pageSize,
                                isDense: true,
                                style: TextStyle(
                                    fontSize: 13,
                                    color: context.mutedForeground),
                                items: const [
                                  DropdownMenuItem(
                                      value: 5, child: Text('5 por página')),
                                  DropdownMenuItem(
                                      value: 10, child: Text('10 por página')),
                                  DropdownMenuItem(
                                      value: 15, child: Text('15 por página')),
                                  DropdownMenuItem(
                                      value: null, child: Text('Todas')),
                                ],
                                onChanged: (value) => setState(() {
                                  _pageSize = value;
                                  _page = 1;
                                }),
                              ),
                            ),
                            const Spacer(),
                            if (_pageSize != null) ...[
                              IconButton(
                                  tooltip: 'Página anterior',
                                  visualDensity: VisualDensity.compact,
                                  onPressed: currentPage > 1
                                      ? () => setState(() => _page--)
                                      : null,
                                  icon: const Icon(Icons.chevron_left)),
                              Text('$currentPage',
                                  style: TextStyle(
                                      fontSize: 13,
                                      color: context.mutedForeground)),
                              IconButton(
                                  tooltip: 'Próxima página',
                                  visualDensity: VisualDensity.compact,
                                  onPressed: currentPage < result.pageCount
                                      ? () => setState(() => _page++)
                                      : null,
                                  icon: const Icon(Icons.chevron_right)),
                            ],
                          ]),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

/// Indicadores centralizados com divisórias (resumo das metas da web).
class _SummaryRow extends StatelessWidget {
  const _SummaryRow({required this.items});
  final List<(String, String)> items;

  @override
  Widget build(BuildContext context) {
    return IntrinsicHeight(
      child: Row(children: [
        for (var i = 0; i < items.length; i++) ...[
          Expanded(
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              Text(items[i].$1,
                  style: const TextStyle(
                      fontSize: 32, fontWeight: FontWeight.w600)),
              const SizedBox(height: 2),
              Text(items[i].$2,
                  textAlign: TextAlign.center,
                  style:
                      TextStyle(fontSize: 12, color: context.mutedForeground)),
            ]),
          ),
          if (i < items.length - 1)
            VerticalDivider(
                width: 1, color: context.scheme.outline.withValues(alpha: 0.7)),
        ]
      ]),
    );
  }
}

class _GoalTabs extends StatelessWidget {
  const _GoalTabs({required this.value, required this.onChanged});
  final GoalTab value;
  final ValueChanged<GoalTab> onChanged;

  @override
  Widget build(BuildContext context) {
    final scheme = context.scheme;
    Widget tab(GoalTab v, String label) {
      final selected = v == value;
      return Expanded(
        child: GestureDetector(
          onTap: () => onChanged(v),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 10),
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: selected ? scheme.surface : Colors.transparent,
              borderRadius: BorderRadius.circular(8),
              boxShadow: selected
                  ? [
                      BoxShadow(
                          color: Colors.black.withValues(alpha: 0.12),
                          blurRadius: 4,
                          offset: const Offset(0, 1))
                    ]
                  : null,
            ),
            child: Text(label,
                maxLines: 1,
                style: TextStyle(
                    fontSize: 13,
                    fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
                    color:
                        selected ? scheme.onSurface : context.mutedForeground)),
          ),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: scheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(children: [
        tab(GoalTab.active, 'Em andamento'),
        tab(GoalTab.completed, 'Concluídas'),
        tab(GoalTab.all, 'Todas'),
      ]),
    );
  }
}

/// Linha de meta — espelha goal-list.tsx (ícone, título, barra com valores,
/// aporte rápido, "+ Adicionar" e menu Editar/Deletar).
class _GoalRow extends StatelessWidget {
  const _GoalRow({
    required this.goal,
    required this.quickAmount,
    required this.onQuickAdd,
    required this.onAdd,
    required this.onEdit,
    required this.onRemove,
  });

  final Goal goal;
  final double quickAmount;
  final VoidCallback onQuickAdd;
  final VoidCallback onAdd;
  final VoidCallback onEdit;
  final VoidCallback onRemove;

  static const _months = [
    'jan.',
    'fev.',
    'mar.',
    'abr.',
    'mai.',
    'jun.',
    'jul.',
    'ago.',
    'set.',
    'out.',
    'nov.',
    'dez.'
  ];

  String _subtitle() {
    final category = goal.category == 'general'
        ? 'Geral'
        : TransactionCategories.label(goal.category);
    final deadline = goal.deadline;
    if (deadline == null || deadline.length < 7) return category;
    final month = int.tryParse(deadline.substring(5, 7));
    if (month == null || month < 1 || month > 12) return category;
    return '$category · Até ${_months[month - 1]} de ${deadline.substring(0, 4)}';
  }

  @override
  Widget build(BuildContext context) {
    final scheme = context.scheme;
    final progress = goal.targetAmount > 0
        ? (goal.currentAmount / goal.targetAmount * 100)
            .clamp(0.0, 100.0)
            .toDouble()
        : 0.0;
    final done = progress >= 100;

    Widget values(Color color) => Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14),
          child: Row(children: [
            Expanded(
                child: Text(Fmt.currency(goal.currentAmount),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: color))),
            Text('${progress.toStringAsFixed(0)}%',
                style: TextStyle(
                    fontSize: 12, fontWeight: FontWeight.w700, color: color)),
            Expanded(
                child: Text(Fmt.currency(goal.targetAmount),
                    maxLines: 1,
                    textAlign: TextAlign.right,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: color))),
          ]),
        );

    return Padding(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: scheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(categoryIcon(goal.category),
                  size: 24, color: context.mutedForeground),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(goal.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          fontSize: 15, fontWeight: FontWeight.w500)),
                  Text(_subtitle(),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                          fontSize: 12.5, color: context.mutedForeground)),
                ],
              ),
            ),
          ]),
          const SizedBox(height: 12),
          LayoutBuilder(builder: (context, box) {
            return ClipRRect(
              borderRadius: BorderRadius.circular(999),
              child: SizedBox(
                height: 44,
                width: box.maxWidth,
                child: Stack(alignment: Alignment.centerLeft, children: [
                  Positioned.fill(
                      child: ColoredBox(color: scheme.surfaceContainerHighest)),
                  Positioned(
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: box.maxWidth * progress / 100,
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                          color: scheme.primary,
                          borderRadius: BorderRadius.circular(999)),
                    ),
                  ),
                  SizedBox(
                      width: box.maxWidth, child: values(scheme.onSurface)),
                  ClipRect(
                    clipper: _FractionClipper(progress / 100),
                    child: SizedBox(
                        width: box.maxWidth, child: values(Colors.white)),
                  ),
                ]),
              ),
            );
          }),
          const SizedBox(height: 8),
          Row(children: [
            if (!done) ...[
              Flexible(
                child: SizedBox(
                  height: 44,
                  child: FilledButton.tonal(
                    onPressed: onQuickAdd,
                    style: FilledButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12))),
                    child: Text('+ ${Fmt.currency(quickAmount)}',
                        maxLines: 1, overflow: TextOverflow.ellipsis),
                  ),
                ),
              ),
              const SizedBox(width: 6),
              TextButton(onPressed: onAdd, child: const Text('+ Adicionar')),
            ],
            const Spacer(),
            PopupMenuButton<String>(
              tooltip: 'Opções de ${goal.title}',
              icon: const Icon(Icons.more_horiz),
              onSelected: (value) => value == 'edit' ? onEdit() : onRemove(),
              itemBuilder: (_) => [
                const PopupMenuItem(
                    value: 'edit',
                    child: Row(children: [
                      Icon(Icons.edit_outlined, size: 18),
                      SizedBox(width: 10),
                      Text('Editar')
                    ])),
                PopupMenuItem(
                    value: 'remove',
                    child: Row(children: [
                      Icon(Icons.delete_outline, size: 18, color: scheme.error),
                      const SizedBox(width: 10),
                      Text('Deletar', style: TextStyle(color: scheme.error))
                    ])),
              ],
            ),
          ]),
        ],
      ),
    );
  }
}

class _FractionClipper extends CustomClipper<Rect> {
  _FractionClipper(this.fraction);
  final double fraction;

  @override
  Rect getClip(Size size) =>
      Rect.fromLTWH(0, 0, size.width * fraction, size.height);

  @override
  bool shouldReclip(_FractionClipper oldClipper) =>
      oldClipper.fraction != fraction;
}
