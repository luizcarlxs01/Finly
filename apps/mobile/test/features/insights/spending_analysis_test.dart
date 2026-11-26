import 'package:finly_mobile/features/insights/data/spending_analysis.dart';
import 'package:finly_mobile/features/insights/ui/spending_analysis_panel.dart';
import 'package:finly_mobile/shared/models/enums.dart';
import 'package:finly_mobile/shared/models/transaction.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

LineItem item(
  String title,
  String date,
  double amount,
  TransactionType type, {
  String category = 'geral',
  ContractKind kind = ContractKind.single,
}) {
  final contract = TransactionContract(
    id: title,
    financialProfileId: 'profile',
    title: title,
    amount: amount,
    type: type,
    category: category,
    kind: kind,
    transactionDate: date,
    sourceId: null,
    installmentCount: null,
    isRecurring: kind == ContractKind.recurring,
    recurrenceStartDate: null,
    recurrenceEndDate: null,
    recurrenceDay: null,
    recurrenceMonths: null,
    createdAt: DateTime(2026, 1),
    occurrences: [],
  );
  return LineItem(
    occurrenceId: title,
    contractId: title,
    title: title,
    amount: amount,
    type: type,
    category: category,
    displayKind: DisplayKind.single,
    dueDate: date,
    installmentIndex: null,
    installmentCount: null,
    status: OccurrenceStatus.paid,
    isCustomized: false,
    contract: contract,
  );
}

void main() {
  final now = DateTime(2026, 11, 25);
  final items = [
    item('Mercado', '2026-11-10', 200, TransactionType.expense,
        category: 'alimentacao'),
    item('Restaurante', '2026-10-05', 100, TransactionType.expense,
        category: 'alimentacao'),
    item('Uber', '2026-10-07', 50, TransactionType.expense,
        category: 'transporte'),
    item('Curso', '2026-02-01', 400, TransactionType.expense,
        category: 'educacao', kind: ContractKind.installment),
    item('Salário', '2026-11-05', 5000, TransactionType.income,
        category: 'salario', kind: ContractKind.recurring),
  ];

  test('padrão: só saídas dos últimos 6 meses', () {
    final result =
        filterAnalysisItems(items, const AnalysisFilters(), now: now);
    expect(result.map((e) => e.title), ['Mercado', 'Restaurante', 'Uber']);
  });

  test('filtros de entrada, tipo, categoria e período', () {
    expect(
        filterAnalysisItems(
                items,
                const AnalysisFilters(
                    entryType: AnalysisEntryType.income,
                    period: AnalysisPeriod.all),
                now: now)
            .map((e) => e.title),
        ['Salário']);
    expect(
        filterAnalysisItems(
                items,
                const AnalysisFilters(
                    kind: AnalysisKind.installment, period: AnalysisPeriod.all),
                now: now)
            .map((e) => e.title),
        ['Curso']);
    expect(
        filterAnalysisItems(
                items, const AnalysisFilters(category: 'transporte'),
                now: now)
            .map((e) => e.title),
        ['Uber']);
    expect(
        filterAnalysisItems(items,
                const AnalysisFilters(period: AnalysisPeriod.threeMonths),
                now: now)
            .length,
        3);
  });

  test('totais por categoria ordenados do maior para o menor', () {
    final filtered =
        filterAnalysisItems(items, const AnalysisFilters(), now: now);
    final totals = categoryTotals(filtered);
    expect(totals.map((e) => e.category), ['alimentacao', 'transporte']);
    expect(totals.first.amount, 300);
  });

  test('evolução mensal separa entradas e saídas e ordena os meses', () {
    final filtered = filterAnalysisItems(
        items,
        const AnalysisFilters(
            entryType: AnalysisEntryType.all, period: AnalysisPeriod.sixMonths),
        now: now);
    final months = monthlyTotals(filtered);
    expect(months.map((e) => e.key), ['2026-10', '2026-11']);
    expect(months.first.saidas, 150);
    expect(months.last.entradas, 5000);
    expect(months.last.saidas, 200);
    expect(analysisMonthLabel('2026-10'), 'out. 26');
    expect(analysisAxisAmount(5000), '5 mil');
  });

  testWidgets('painel mostra filtros e legenda da pizza com dados',
      (tester) async {
    await tester.pumpWidget(MaterialApp(
      home: Scaffold(
        body: SingleChildScrollView(
          child: SpendingAnalysisPanel(lineItems: [
            item('Mercado', DateTime.now().toIso8601String().substring(0, 10),
                200, TransactionType.expense,
                category: 'alimentacao'),
          ]),
        ),
      ),
    ));
    await tester.pump();
    expect(find.text('Análise de gastos'), findsOneWidget);
    expect(find.text('Pizza por categoria'), findsOneWidget);
    expect(find.text('Só saídas'), findsOneWidget);
    expect(find.text('Últimos 6 meses'), findsOneWidget);
    expect(find.text('Alimentação'), findsWidgets);
    expect(find.text('Nenhum lançamento pago encontrado com esses filtros.'),
        findsNothing);
  });

  testWidgets('painel vazio mostra mensagem da web', (tester) async {
    await tester.pumpWidget(const MaterialApp(
      home: Scaffold(
        body:
            SingleChildScrollView(child: SpendingAnalysisPanel(lineItems: [])),
      ),
    ));
    await tester.pump();
    expect(find.text('Nenhum lançamento pago encontrado com esses filtros.'),
        findsOneWidget);
  });
}
