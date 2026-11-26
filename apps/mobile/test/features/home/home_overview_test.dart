import 'package:flutter_test/flutter_test.dart';
import 'package:finly_mobile/features/home/data/home_overview.dart';
import 'package:finly_mobile/shared/models/enums.dart';
import 'package:finly_mobile/shared/models/transaction.dart';

void main() {
  final today = DateTime(2026, 11, 25);

  test('mostra apenas ocorrências pagas até hoje no resumo da Home', () {
    final result = HomeOverview.build(
      items: [
        item('Receita antiga', '2026-10-10', 100, TransactionType.income),
        item('Despesa recente', '2026-11-20', 30, TransactionType.expense),
        item('Futura paga', '2026-12-01', 200, TransactionType.income),
        item('Pendente', '2026-11-21', 50, TransactionType.expense,
            status: OccurrenceStatus.pending),
      ],
      currentBalance: 70,
      today: today,
      period: HomePeriod.sixMonths,
    );

    expect(result.recent.map((e) => e.title),
        ['Despesa recente', 'Receita antiga']);
    expect(result.months.last.income, 0);
    expect(result.months.last.expense, 30);
    expect(result.monthlyResult, -30);
    expect(result.insightBadge, 'Bom sinal');
  });

  test('YTD começa em janeiro e usa o resultado apenas do mês atual', () {
    final result = HomeOverview.build(
      items: [
        item('Janeiro', '2026-01-03', 60, TransactionType.income),
        item('Novembro', '2026-11-03', 20, TransactionType.expense),
      ],
      currentBalance: 10,
      today: today,
      period: HomePeriod.ytd,
    );

    expect(result.months.length, 11);
    expect(result.months.first.key, '2026-01');
    expect(result.months.last.key, '2026-11');
    expect(result.monthlyResult, -20);
    expect(result.insightBadge, 'Atenção');
  });
}

LineItem item(String title, String date, double amount, TransactionType type,
    {OccurrenceStatus status = OccurrenceStatus.paid}) {
  final contract = TransactionContract(
    id: title,
    financialProfileId: 'profile',
    title: title,
    amount: amount,
    type: type,
    category: 'geral',
    kind: ContractKind.single,
    transactionDate: date,
    sourceId: null,
    installmentCount: null,
    isRecurring: false,
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
    category: 'geral',
    displayKind: DisplayKind.single,
    dueDate: date,
    installmentIndex: null,
    installmentCount: null,
    status: status,
    isCustomized: false,
    contract: contract,
  );
}
