import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../app/app.dart';
import '../../../app/shell.dart';
import '../../../app/theme.dart';
import '../../../core/format/formatters.dart';
import '../../../core/finance_source.dart';
import '../../../core/privacy/value_privacy.dart';
import '../../../core/widgets/widgets.dart';
import '../../../shared/models/categories.dart';
import '../../../shared/models/enums.dart';
import '../../../shared/models/transaction.dart';
import '../../calendar/ui/compact_calendar.dart';
import '../state/finance_controller.dart';
import 'finance_summary_card.dart';
import 'transaction_edit_sheet.dart';
import 'transaction_form_sheet.dart';
import 'transaction_tile.dart';

enum _TypeFilter { all, income, expense }

enum _SortOption { newest, oldest, highest, lowest, titleAsc, titleDesc }

/// Espelha apps/web/src/components/dashboard/views/dashboard-transactions-view.tsx.
/// Na web (< 1024px) o FAB não aparece nesta aba: o botão "Novo lançamento"
/// fica dentro do Extrato.
class TransactionsScreen extends ConsumerStatefulWidget {
  const TransactionsScreen({super.key});

  @override
  ConsumerState<TransactionsScreen> createState() => _TransactionsScreenState();
}

class _TransactionsScreenState extends ConsumerState<TransactionsScreen> {
  String? _statementMonth =
      '${DateTime.now().year}-${DateTime.now().month.toString().padLeft(2, '0')}';
  _TypeFilter _typeFilter = _TypeFilter.all;
  String _categoryFilter = 'all';
  _SortOption _sort = _SortOption.newest;
  final _search = TextEditingController();

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  bool get _hasAdvancedFilters =>
      _categoryFilter != 'all' || _sort != _SortOption.newest;

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
      if (_statementMonth != null && !t.dueDate.startsWith(_statementMonth!)) {
        return false;
      }
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

  Future<void> _selectMonth() async {
    final selected = await showDatePicker(
      context: context,
      initialDate: _statementMonth == null
          ? DateTime.now()
          : DateTime.tryParse('$_statementMonth-01') ?? DateTime.now(),
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
      helpText: 'Selecione o mês de referência',
    );
    if (selected == null) return;
    setState(() => _statementMonth =
        '${selected.year}-${selected.month.toString().padLeft(2, '0')}');
  }

  void _openFilters() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheet) {
          void update(VoidCallback fn) {
            setState(fn);
            setSheet(() {});
          }

          return SafeArea(
            child: SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(
                  16, 0, 16, 16 + MediaQuery.of(ctx).viewInsets.bottom),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Filtros do extrato',
                      style:
                          TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 14),
                  const Text('Categoria',
                      style: TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 6),
                  DropdownButtonFormField<String>(
                    initialValue: _categoryFilter,
                    isExpanded: true,
                    items: [
                      const DropdownMenuItem(
                          value: 'all', child: Text('Todas as categorias')),
                      ...TransactionCategories.all.map((c) => DropdownMenuItem(
                          value: c,
                          child: Text(TransactionCategories.label(c)))),
                    ],
                    onChanged: (v) =>
                        update(() => _categoryFilter = v ?? 'all'),
                  ),
                  const SizedBox(height: 14),
                  const Text('Ordenação',
                      style: TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 6),
                  DropdownButtonFormField<_SortOption>(
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
                          child: Text('Título A–Z')),
                      DropdownMenuItem(
                          value: _SortOption.titleDesc,
                          child: Text('Título Z–A')),
                    ],
                    onChanged: (v) =>
                        update(() => _sort = v ?? _SortOption.newest),
                  ),
                  const Divider(height: 28),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      TextButton(
                        onPressed: () {
                          Navigator.pop(ctx);
                          _openSummary();
                        },
                        child: const Text('Resumo financeiro'),
                      ),
                      TextButton(
                        onPressed: () => update(() {
                          _categoryFilter = 'all';
                          _sort = _SortOption.newest;
                          _statementMonth = null;
                        }),
                        child: const Text('Limpar filtros'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  void _openSummary() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => const SafeArea(
          child: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: FinanceSummaryCard(),
      )),
    );
  }

  String _monthLabel() {
    if (_statementMonth == null) return 'Todos os meses';
    final date = DateTime.tryParse('$_statementMonth-01');
    if (date == null) return _statementMonth!;
    return DateFormat('MMMM yyyy', 'pt_BR').format(date);
  }

  @override
  Widget build(BuildContext context) {
    final financeAsync = ref.watch(financeControllerProvider);
    final hidden = ref.watch(valuePrivacyProvider);

    return Scaffold(
      appBar: const FinlyAppBar(
          title: 'Lançamentos', themeToggle: ThemeToggleButton()),
      body: RefreshIndicator(
        onRefresh: () => ref.read(financeControllerProvider.notifier).refresh(),
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
            final now = DateTime.now();
            final currentMonth =
                '${now.year}-${now.month.toString().padLeft(2, '0')}';
            final monthPaid = all.where(
                (item) => item.isPaid && item.dueDate.startsWith(currentMonth));
            final monthIncome = monthPaid
                .where((item) => item.type == TransactionType.income)
                .fold<double>(0, (sum, item) => sum + item.amount);
            final monthExpense = monthPaid
                .where((item) => item.type == TransactionType.expense)
                .fold<double>(0, (sum, item) => sum + item.amount);
            String mask(double v) => Fmt.maskedCurrency(v, hidden: hidden);
            final footerMonth = _statementMonth == null
                ? ''
                : ' · ${_statementMonth!.split('-').reversed.join('/')}';

            return ListView(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 28),
              children: [
                const SizedBox(height: 8),
                GridView.count(
                  crossAxisCount: 2,
                  childAspectRatio: 1.75,
                  mainAxisSpacing: 10,
                  crossAxisSpacing: 10,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  children: [
                    _Indicator(
                      label: 'Saldo atual',
                      value: mask(data.currentBalance),
                      trailing: InkResponse(
                        onTap: () =>
                            ref.read(valuePrivacyProvider.notifier).toggle(),
                        radius: 16,
                        child: Icon(
                            hidden
                                ? Icons.visibility_off_outlined
                                : Icons.visibility_outlined,
                            size: 16,
                            semanticLabel:
                                hidden ? 'Mostrar valores' : 'Ocultar valores'),
                      ),
                    ),
                    _Indicator(label: 'Entradas', value: mask(monthIncome)),
                    _Indicator(label: 'Saídas', value: mask(monthExpense)),
                    _Indicator(
                        label: 'Resultado do mês',
                        value: mask(monthIncome - monthExpense)),
                  ],
                ),
                const SizedBox(height: 16),
                CompactCalendar(
                  items: all,
                  onOpenFull: () => context.push('/calendar'),
                ),
                const SizedBox(height: 16),
                FinlyCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: [
                        const Expanded(
                          child: Text('Extrato',
                              style: TextStyle(
                                  fontSize: 20, fontWeight: FontWeight.w700)),
                        ),
                        FilledButton.icon(
                          onPressed: () => showTransactionFormSheet(context),
                          icon: const Icon(Icons.add, size: 18),
                          label: const Text('Novo lançamento'),
                        ),
                      ]),
                      const SizedBox(height: 14),
                      _FilterTabs(
                        value: _typeFilter,
                        onChanged: (v) => setState(() => _typeFilter = v),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _search,
                        onChanged: (_) => setState(() {}),
                        decoration: const InputDecoration(
                          hintText: 'Buscar lançamento',
                          prefixIcon: Icon(Icons.search, size: 18),
                        ),
                      ),
                      const SizedBox(height: 10),
                      Row(children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: _selectMonth,
                            icon: const Icon(Icons.calendar_month_outlined,
                                size: 18),
                            label: Text(_monthLabel(),
                                overflow: TextOverflow.ellipsis),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Stack(clipBehavior: Clip.none, children: [
                          OutlinedButton(
                            style: OutlinedButton.styleFrom(
                                minimumSize: const Size(48, 48),
                                padding: EdgeInsets.zero),
                            onPressed: _openFilters,
                            child: const Icon(Icons.tune, size: 18),
                          ),
                          if (_hasAdvancedFilters || _statementMonth != null)
                            Positioned(
                              right: -2,
                              top: -2,
                              child: Container(
                                width: 9,
                                height: 9,
                                decoration: BoxDecoration(
                                    color: context.scheme.primary,
                                    shape: BoxShape.circle),
                              ),
                            ),
                        ]),
                      ]),
                      const SizedBox(height: 8),
                      if (visible.isEmpty)
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          child: EmptyState(
                            title: all.isEmpty
                                ? 'Nenhuma transação cadastrada'
                                : 'Nenhum resultado para os filtros aplicados',
                            description: all.isEmpty
                                ? 'Assim que você registrar movimentações, elas aparecerão organizadas aqui.'
                                : 'Ajuste a busca, categoria, tipo ou ordenação para encontrar outras movimentações.',
                          ),
                        )
                      else
                        ...visible.map(
                          (item) => TransactionTile(
                            item: item,
                            hidden: hidden,
                            onEdit: () =>
                                showTransactionEditSheet(context, item),
                            onRemove: () => _confirmRemove(item),
                          ),
                        ),
                      const SizedBox(height: 10),
                      Row(children: [
                        Expanded(
                          child: Text(
                              '${visible.length} de ${all.length} lançamentos$footerMonth',
                              style: TextStyle(
                                  fontSize: 12,
                                  color: context.mutedForeground)),
                        ),
                        TextButton(
                          onPressed: () => context.push('/statement'),
                          child: const Text('Ver projeção'),
                        ),
                      ]),
                    ],
                  ),
                ),
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

class _Indicator extends StatelessWidget {
  const _Indicator({required this.label, required this.value, this.trailing});
  final String label;
  final String value;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: context.scheme.surface.withValues(alpha: 0.9),
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF031533).withValues(alpha: 0.07),
              blurRadius: 20,
              offset: const Offset(0, 6),
            )
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(value,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                  )),
            ),
            const SizedBox(height: 5),
            Row(children: [
              Flexible(
                child: Text(label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                        fontSize: 12, color: context.mutedForeground)),
              ),
              if (trailing != null) ...[const SizedBox(width: 6), trailing!],
            ]),
          ],
        ),
      );
}

class _FilterTabs extends StatelessWidget {
  const _FilterTabs({required this.value, required this.onChanged});
  final _TypeFilter value;
  final ValueChanged<_TypeFilter> onChanged;

  @override
  Widget build(BuildContext context) {
    final scheme = context.scheme;
    Widget tab(_TypeFilter v, String label) {
      final selected = v == value;
      return Expanded(
        child: GestureDetector(
          onTap: () => onChanged(v),
          child: Container(
            margin: const EdgeInsets.all(3),
            padding: const EdgeInsets.symmetric(vertical: 9),
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: selected ? scheme.primary : Colors.transparent,
              borderRadius: BorderRadius.circular(AppColors.fieldRadius),
            ),
            child: Text(label,
                style: TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w600,
                    color: selected ? scheme.onPrimary : scheme.onSurface)),
          ),
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: scheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(AppColors.fieldRadius),
      ),
      child: Row(
        children: [
          tab(_TypeFilter.all, 'Todos'),
          tab(_TypeFilter.income, 'Entradas'),
          tab(_TypeFilter.expense, 'Saídas'),
        ],
      ),
    );
  }
}
