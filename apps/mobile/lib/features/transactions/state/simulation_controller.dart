import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../shared/models/enums.dart';
import '../data/occurrence_generation.dart';
import '../data/transaction_form_input.dart';

/// Estado da "Simulação de impacto" — espelha
/// apps/web/src/hooks/use-impact-simulation.ts. Guarda a entrada simulada (ou
/// null); o card de resumo recalcula o saldo projetado somando as ocorrências
/// que nasceriam pagas, sem persistir nada.
class SimulationController extends Notifier<TransactionFormInput?> {
  @override
  TransactionFormInput? build() => null;

  void simulate(TransactionFormInput input) {
    state = input.isValid ? input : null;
  }

  void clear() => state = null;
}

final simulationControllerProvider =
    NotifierProvider<SimulationController, TransactionFormInput?>(
        SimulationController.new);

class ForecastSnapshot {
  ForecastSnapshot({
    required this.totalIncome,
    required this.totalExpense,
    required this.projectedBalance,
    required this.isPreview,
  });

  final double totalIncome;
  final double totalExpense;
  final double projectedBalance;
  final bool isPreview;
}

/// Combina o financeiro real com a simulação ativa (se houver) — equivalente ao
/// `projectionSnapshot` de apps/web/src/app/page.tsx.
ForecastSnapshot buildForecast({
  required double currentBalance,
  required double totalIncome,
  required double totalExpense,
  TransactionFormInput? simulation,
}) {
  if (simulation == null) {
    return ForecastSnapshot(
      totalIncome: totalIncome,
      totalExpense: totalExpense,
      projectedBalance: currentBalance,
      isPreview: false,
    );
  }

  var addedIncome = 0.0;
  var addedExpense = 0.0;
  for (final o in generateOccurrences(simulation).where((o) => o.paid)) {
    if (simulation.type == TransactionType.income) {
      addedIncome += o.amount;
    } else {
      addedExpense += o.amount;
    }
  }

  return ForecastSnapshot(
    totalIncome: totalIncome + addedIncome,
    totalExpense: totalExpense + addedExpense,
    projectedBalance: currentBalance + addedIncome - addedExpense,
    isPreview: true,
  );
}
