import '../../../shared/models/enums.dart';
import '../../../shared/models/transaction.dart';

/// Lógica pura do painel "Análise de gastos" — espelha os `useMemo` de
/// apps/web/src/components/dashboard/insights/spending-analysis-panel.tsx.

enum AnalysisEntryType { expense, income, all }

enum AnalysisKind { all, single, installment, recurring }

enum AnalysisPeriod { threeMonths, sixMonths, twelveMonths, all }

class AnalysisFilters {
  const AnalysisFilters({
    this.entryType = AnalysisEntryType.expense,
    this.kind = AnalysisKind.all,
    this.category = 'all',
    this.period = AnalysisPeriod.sixMonths,
  });

  final AnalysisEntryType entryType;
  final AnalysisKind kind;
  final String category;
  final AnalysisPeriod period;
}

class CategoryTotal {
  const CategoryTotal(this.category, this.amount);
  final String category;
  final double amount;
}

class MonthlyTotal {
  const MonthlyTotal(this.key, this.entradas, this.saidas);
  final String key; // yyyy-MM
  final double entradas;
  final double saidas;
}

List<LineItem> filterAnalysisItems(
  List<LineItem> items,
  AnalysisFilters filters, {
  DateTime? now,
}) {
  DateTime? cutoff;
  final monthsBack = switch (filters.period) {
    AnalysisPeriod.threeMonths => 3,
    AnalysisPeriod.sixMonths => 6,
    AnalysisPeriod.twelveMonths => 12,
    AnalysisPeriod.all => 0,
  };
  if (monthsBack > 0) {
    final ref = now ?? DateTime.now();
    cutoff = DateTime(ref.year, ref.month - monthsBack, 1);
  }

  return items.where((item) {
    if (filters.entryType == AnalysisEntryType.expense &&
        item.type != TransactionType.expense) {
      return false;
    }
    if (filters.entryType == AnalysisEntryType.income &&
        item.type != TransactionType.income) {
      return false;
    }
    if (filters.kind != AnalysisKind.all &&
        item.contract.kind.name != filters.kind.name) {
      return false;
    }
    if (filters.category != 'all' && item.category != filters.category) {
      return false;
    }
    if (cutoff != null) {
      final date = item.dueDateTime;
      if (date == null || date.isBefore(cutoff)) return false;
    }
    return true;
  }).toList();
}

List<CategoryTotal> categoryTotals(List<LineItem> items) {
  final totals = <String, double>{};
  for (final item in items) {
    totals[item.category] = (totals[item.category] ?? 0) + item.amount;
  }
  return totals.entries.map((e) => CategoryTotal(e.key, e.value)).toList()
    ..sort((a, b) => b.amount.compareTo(a.amount));
}

List<MonthlyTotal> monthlyTotals(List<LineItem> items) {
  final totals = <String, List<double>>{};
  for (final item in items) {
    final date = item.dueDateTime;
    if (date == null) continue;
    final key = '${date.year}-${date.month.toString().padLeft(2, '0')}';
    final current = totals.putIfAbsent(key, () => [0, 0]);
    if (item.type == TransactionType.income) {
      current[0] += item.amount;
    } else {
      current[1] += item.amount;
    }
  }
  final keys = totals.keys.toList()..sort();
  return [for (final k in keys) MonthlyTotal(k, totals[k]![0], totals[k]![1])];
}

/// "jan. 26" — equivalente a toLocaleDateString('pt-BR', {month:'short', year:'2-digit'}).
String analysisMonthLabel(String key) {
  const names = [
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
  final month = int.tryParse(key.substring(5, 7)) ?? 1;
  return '${names[month - 1]} ${key.substring(2, 4)}';
}

/// Eixo compacto (web: Intl compact, máx. 8 caracteres).
String analysisAxisAmount(double value) {
  final abs = value.abs();
  String text;
  if (abs >= 1000000) {
    text = '${(value / 1000000).round()} mi';
  } else if (abs >= 1000) {
    text = '${(value / 1000).round()} mil';
  } else {
    text = value.round().toString();
  }
  return text.length > 8 ? '${text.substring(0, 7)}…' : text;
}
