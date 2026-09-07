import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/app.dart';
import '../../../app/shell.dart';
import '../../../app/theme.dart';
import '../../../core/finance_source.dart';
import '../../../core/widgets/widgets.dart';
import '../../../shared/models/categories.dart';
import '../../../shared/models/enums.dart';
import '../../../shared/models/transaction.dart';
import '../../goals/ui/goal_form_sheet.dart';
import '../state/finance_controller.dart';
import 'finance_summary_card.dart';
import 'transaction_edit_sheet.dart';
import 'transaction_form_sheet.dart';
import 'transaction_tile.dart';

enum _TypeFilter { all, income, expense }

enum _SortOption { newest, oldest, highest, lowest, titleAsc, titleDesc }

/// Espelha apps/web/src/components/dashboard/views/dashboard-transactions-view.tsx.
class TransactionsScreen extends ConsumerStatefulWidget {
  const TransactionsScreen({super.key});

  @override
  ConsumerState<TransactionsScreen> createState() => _TransactionsScreenState();
}

class _TransactionsScreenState extends ConsumerState<TransactionsScreen> {
  bool _listOpen = false;
  bool _fabOpen = false;
  _TypeFilter _typeFilter = _TypeFilter.all;
  String _categoryFilter = 'all';
  _SortOption _sort = _SortOption.newest;
  final _search = TextEditingController();

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  List<LineItem> _apply(List<LineItem> items) {
    final term = _search.text.trim().toLowerCase();
    final filtered = items.where((t) {
      final matchesType = _typeFilter == _TypeFilter.all ||
          (_typeFilter == _TypeFilter.income &&
              t.type == TransactionType.income) ||
          (_typeFilter == _TypeFilter.expense &&
              t.type == TransactionType.expense);
      final matchesCategory =
          _categoryFilter == 'all' || t.category == _categoryFilter;
      if (!matchesType || !matchesCategory) return false;
      if (term.isEmpty) return true;
      final haystack = [
        t.title,
        TransactionCategories.label(t.category),
        t.amount.toString(),
      ].join(' ').toLowerCase();
      return haystack.contains(term);
    }).toList();

    int byCreated(LineItem a, LineItem b, {required bool asc}) => asc
        ? a.contract.createdAt.compareTo(b.contract.createdAt)
        : b.contract.createdAt.compareTo(a.contract.createdAt);

    filtered.sort((a, b) => switch (_sort) {
          _SortOption.newest => byCreated(a, b, asc: false),
          _SortOption.oldest => byCreated(a, b, asc: true),
          _SortOption.highest => b.amount.compareTo(a.amount),
          _SortOption.lowest => a.amount.compareTo(b.amount),
          _SortOption.titleAsc =>
            a.title.toLowerCase().compareTo(b.title.toLowerCase()),
          _SortOption.titleDesc =>
            b.title.toLowerCase().compareTo(a.title.toLowerCase()),
        });
    return filtered;
  }

  Future<void> _confirmRemove(LineItem item) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancelar ocorrência'),
        content: const Text(
            'Tem certeza que deseja cancelar esta ocorrência? Essa ação não pode ser desfeita.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Voltar')),
          FilledButton(
            style: FilledButton.styleFrom(
                backgroundColor: Theme.of(ctx).colorScheme.error),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Cancelar ocorrência'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      try {
        await ref
            .read(financeControllerProvider.notifier)
            .cancelOccurrence(item.occurrenceId);
      } catch (e) {
        if (mounted) showErrorSnack(context, e);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final financeAsync = ref.watch(financeControllerProvider);

    return Scaffold(
      appBar: const FinlyAppBar(
          title: 'Lançamentos', themeToggle: ThemeToggleButton()),
      floatingActionButton: _SpeedDial(
        open: _fabOpen,
        onToggle: () => setState(() => _fabOpen = !_fabOpen),
        onNewTransaction: () {
          setState(() => _fabOpen = false);
          showTransactionFormSheet(context);
        },
        onNewGoal: () {
          setState(() => _fabOpen = false);
          showGoalFormSheet(context);
        },
      ),
      body: RefreshIndicator(
        onRefresh: () =>
            ref.read(financeControllerProvider.notifier).refresh(),
        child: financeAsync.when(
          loading: () => const _CenteredLoader(),
          error: (e, _) => ListView(
            padding: const EdgeInsets.all(16),
            children: [
              ErrorBanner(e.toString(),
                  onRetry: () =>
                      ref.read(financeControllerProvider.notifier).refresh()),
            ],
          ),
          data: (data) {
            final all = data.lineItems;
            final visible = _apply(all);
            return ListView(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 96),
              children: [
                const SectionHeader(
                  subtitle: 'Cadastre e acompanhe suas movimentações.',
                ),
                const SizedBox(height: 12),
                const FinanceSummaryCard(),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () => context.push('/calendar'),
                        icon: const Icon(Icons.calendar_month_outlined, size: 18),
                        label: const Text('Calendário'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => context.push('/statement'),
                        icon: const Icon(Icons.receipt_long_outlined, size: 18),
                        label: const Text('Extrato'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                FinlyCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      InkWell(
                        onTap: () => setState(() => _listOpen = !_listOpen),
                        child: Row(
                          children: [
                            Expanded(
                              child: Text(
                                _listOpen
                                    ? 'Ocultar lançamentos'
                                    : 'Visualizar lançamentos',
                                style: const TextStyle(
                                    fontSize: 16, fontWeight: FontWeight.w700),
                              ),
                            ),
                            AnimatedRotation(
                              turns: _listOpen ? 0.5 : 0,
                              duration: const Duration(milliseconds: 180),
                              child: Icon(Icons.expand_more,
                                  color: context.mutedForeground),
                            ),
                          ],
                        ),
                      ),
                      if (_listOpen) ...[
                        const SizedBox(height: 12),
                        _FilterTabs(
                          value: _typeFilter,
                          onChanged: (v) => setState(() => _typeFilter = v),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _search,
                          onChanged: (_) => setState(() {}),
                          decoration: const InputDecoration(
                            hintText: 'Buscar por título, categoria ou valor',
                            prefixIcon: Icon(Icons.search, size: 18),
                          ),
                        ),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            Expanded(
                              child: DropdownButtonFormField<String>(
                                initialValue: _categoryFilter,
                                isExpanded: true,
                                items: [
                                  const DropdownMenuItem(
                                      value: 'all',
                                      child: Text('Todas as categorias')),
                                  ...TransactionCategories.all.map(
                                    (c) => DropdownMenuItem(
                                        value: c,
                                        child: Text(
                                            TransactionCategories.label(c))),
                                  ),
                                ],
                                onChanged: (v) => setState(
                                    () => _categoryFilter = v ?? 'all'),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: DropdownButtonFormField<_SortOption>(
                                initialValue: _sort,
                                isExpanded: true,
                                items: const [
                                  DropdownMenuItem(
                                      value: _SortOption.newest,
                                      child: Text('Mais recentes')),
                                  DropdownMenuItem(
                                      value: _SortOption.oldest,
                                      child: Text('Mais antigas')),
                                  DropdownMenuItem(
                                      value: _SortOption.highest,
                                      child: Text('Maior valor')),
                                  DropdownMenuItem(
                                      value: _SortOption.lowest,
                                      child: Text('Menor valor')),
                                  DropdownMenuItem(
                                      value: _SortOption.titleAsc,
                                      child: Text('Título A-Z')),
                                  DropdownMenuItem(
                                      value: _SortOption.titleDesc,
                                      child: Text('Título Z-A')),
                                ],
                                onChanged: (v) => setState(
                                    () => _sort = v ?? _SortOption.newest),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text('${visible.length} de ${all.length}',
                            style: TextStyle(
                                fontSize: 12, color: context.mutedForeground)),
                      ],
                    ],
                  ),
                ),
                if (_listOpen) ...[
                  const SizedBox(height: 12),
                  if (visible.isEmpty)
                    EmptyState(
                      title: all.isEmpty
                          ? 'Nenhuma transação cadastrada'
                          : 'Nenhum resultado para os filtros aplicados',
                      description: all.isEmpty
                          ? 'Assim que você registrar movimentações, elas aparecerão organizadas aqui.'
                          : 'Ajuste a busca, categoria, tipo ou ordenação para encontrar outras movimentações.',
                    )
                  else
                    ...visible.map(
                      (item) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: TransactionTile(
                          item: item,
                          onEdit: () => showTransactionEditSheet(context, item),
                          onRemove: () => _confirmRemove(item),
                        ),
                      ),
                    ),
                ],
                if (ref.watch(financeSourceProvider) == FinanceSource.api &&
                    data.profile == null)
                  Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: Text(
                      'Nenhum perfil financeiro encontrado nesta conta.',
                      style: TextStyle(
                          fontSize: 12.5, color: context.mutedForeground),
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

class _CenteredLoader extends StatelessWidget {
  const _CenteredLoader();
  @override
  Widget build(BuildContext context) => ListView(
        children: const [
          SizedBox(height: 160),
          Center(child: CircularProgressIndicator()),
        ],
      );
}

class _FilterTabs extends StatelessWidget {
  const _FilterTabs({required this.value, required this.onChanged});
  final _TypeFilter value;
  final ValueChanged<_TypeFilter> onChanged;

  @override
  Widget build(BuildContext context) {
    final scheme = context.scheme;
    Widget tab(_TypeFilter v, String label, IconData icon) {
      final selected = v == value;
      return Expanded(
        child: GestureDetector(
          onTap: () => onChanged(v),
          child: Container(
            margin: const EdgeInsets.all(2),
            padding: const EdgeInsets.symmetric(vertical: 9),
            decoration: BoxDecoration(
              color: selected ? scheme.primary : Colors.transparent,
              borderRadius: BorderRadius.circular(AppColors.fieldRadius),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon,
                    size: 15,
                    color: selected ? scheme.onPrimary : scheme.onSurface),
                const SizedBox(width: 6),
                Text(label,
                    style: TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w600,
                        color:
                            selected ? scheme.onPrimary : scheme.onSurface)),
              ],
            ),
          ),
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(AppColors.fieldRadius),
        border: Border.all(color: scheme.outline),
      ),
      child: Row(
        children: [
          tab(_TypeFilter.all, 'Todas', Icons.list),
          tab(_TypeFilter.income, 'Entradas', Icons.arrow_circle_up_outlined),
          tab(_TypeFilter.expense, 'Saídas', Icons.arrow_circle_down_outlined),
        ],
      ),
    );
  }
}

/// FAB speed dial — "[+]" gira 45° e revela "Nova transação" / "Nova meta"
/// (page.tsx do web).
class _SpeedDial extends StatelessWidget {
  const _SpeedDial({
    required this.open,
    required this.onToggle,
    required this.onNewTransaction,
    required this.onNewGoal,
  });

  final bool open;
  final VoidCallback onToggle;
  final VoidCallback onNewTransaction;
  final VoidCallback onNewGoal;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        AnimatedSize(
          duration: const Duration(milliseconds: 180),
          child: open
              ? Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    _MiniAction(
                      label: 'Nova transação',
                      icon: Icons.swap_vert,
                      onTap: onNewTransaction,
                    ),
                    const SizedBox(height: 10),
                    _MiniAction(
                      label: 'Nova meta',
                      icon: Icons.flag_outlined,
                      onTap: onNewGoal,
                    ),
                    const SizedBox(height: 10),
                  ],
                )
              : const SizedBox.shrink(),
        ),
        FloatingActionButton(
          onPressed: onToggle,
          child: AnimatedRotation(
            turns: open ? 0.125 : 0,
            duration: const Duration(milliseconds: 180),
            child: const Icon(Icons.add),
          ),
        ),
      ],
    );
  }
}

class _MiniAction extends StatelessWidget {
  const _MiniAction(
      {required this.label, required this.icon, required this.onTap});
  final String label;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = context.scheme;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: scheme.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: scheme.outline),
          ),
          child: Text(label,
              style: const TextStyle(
                  fontSize: 13, fontWeight: FontWeight.w600)),
        ),
        const SizedBox(width: 10),
        FloatingActionButton.small(
          heroTag: label,
          onPressed: onTap,
          backgroundColor: scheme.surface,
          foregroundColor: scheme.onSurface,
          child: Icon(icon),
        ),
      ],
    );
  }
}
