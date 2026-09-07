import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/finance_source.dart';
import '../../../shared/models/dashboard_summary.dart';
import '../../../shared/models/enums.dart';
import '../../../shared/models/profile.dart';
import '../../../shared/models/transaction.dart';
import '../data/finance_repository.dart';
import '../data/local_finance_store.dart';
import '../data/transaction_form_input.dart';

/// Estado financeiro consolidado — equivalente a
/// apps/web/src/hooks/use-finance-data.ts. Decide `local` vs `api` pela sessão
/// (financeSourceProvider); a UI nunca sabe de onde o dado veio. Modo API:
/// perfil primário + dashboard + contratos da API. Modo sem conta: contratos +
/// occurrences do `shared_preferences`, com o mesmo achatamento e as mesmas
/// regras de saldo (soma das Occurrences pagas).
class FinanceData {
  FinanceData({
    required this.profile,
    required this.dashboard,
    required this.contracts,
    required this.lineItems,
  });

  final Profile? profile;
  final DashboardSummary dashboard;
  final List<TransactionContract> contracts;
  final List<LineItem> lineItems;

  double get currentBalance => dashboard.currentBalance;
  double get initialBalance => dashboard.initialBalance;
  double get totalIncome => dashboard.totalIncome;
  double get totalExpense => dashboard.totalExpense;

  static final empty = FinanceData(
    profile: null,
    dashboard: DashboardSummary.empty,
    contracts: const [],
    lineItems: const [],
  );
}

class FinanceController extends AsyncNotifier<FinanceData> {
  FinanceRepository get _repo => ref.read(financeRepositoryProvider);

  bool get _isLocal =>
      ref.read(financeSourceProvider) == FinanceSource.local;

  @override
  Future<FinanceData> build() async {
    final source = ref.watch(financeSourceProvider);

    if (source == FinanceSource.local) {
      final local = ref.watch(localFinanceStoreProvider);
      return _buildLocal(local.valueOrNull ?? LocalFinanceProfile.empty);
    }
    return _load();
  }

  // ---- Modo sem conta ----------------------------------------------------
  FinanceData _buildLocal(LocalFinanceProfile p) {
    final contracts = p.toContracts();
    final lineItems = <LineItem>[
      for (final c in contracts) ...LineItem.flatten(c),
    ]..sort((a, b) => b.contract.createdAt.compareTo(a.contract.createdAt));

    final paid = lineItems.where((i) => i.isPaid);
    final income = paid
        .where((i) => i.type == TransactionType.income)
        .fold<double>(0, (s, i) => s + i.amount);
    final expense = paid
        .where((i) => i.type == TransactionType.expense)
        .fold<double>(0, (s, i) => s + i.amount);

    return FinanceData(
      profile: null,
      dashboard: DashboardSummary(
        initialBalance: p.initialBalance,
        totalIncome: income,
        totalExpense: expense,
        currentBalance: p.initialBalance + income - expense,
        transactionCount: paid.length,
        goalCount: 0,
        completedGoalCount: 0,
      ),
      contracts: contracts,
      lineItems: lineItems,
    );
  }

  // ---- Modo API --------------------------------------------------------
  Future<FinanceData> _load() async {
    final profiles = await _repo.getProfiles();
    final profile = Profile.select(profiles);
    if (profile == null) {
      return FinanceData(
        profile: null,
        dashboard: DashboardSummary.empty,
        contracts: const [],
        lineItems: const [],
      );
    }

    final results = await Future.wait([
      _repo.getDashboard(profile.id),
      _repo.getTransactions(profile.id),
    ]);
    final dashboard = results[0] as DashboardSummary;
    final contracts = results[1] as List<TransactionContract>;

    final lineItems = <LineItem>[
      for (final c in contracts) ...LineItem.flatten(c),
    ]..sort((a, b) =>
        b.contract.createdAt.compareTo(a.contract.createdAt));

    return FinanceData(
      profile: profile,
      dashboard: dashboard,
      contracts: contracts,
      lineItems: lineItems,
    );
  }

  Future<void> refresh() async {
    if (_isLocal) {
      ref.invalidate(localFinanceStoreProvider);
      return;
    }
    state = await AsyncValue.guard(_load);
  }

  String get _profileId {
    final profile = state.valueOrNull?.profile;
    if (profile == null) {
      throw StateError('Perfil da conta indisponível.');
    }
    return profile.id;
  }

  LocalFinanceStore get _local =>
      ref.read(localFinanceStoreProvider.notifier);

  // ---- Escritas (modo local persiste no aparelho e o build re-roda
  //      automaticamente; modo API chama o backend e recarrega) ---------
  Future<void> createTransaction(TransactionFormInput input) async {
    if (_isLocal) return _local.addTransaction(input);
    await _repo.createTransaction(input, _profileId);
    await refresh();
  }

  Future<void> updateContract(
    TransactionContract contract,
    TransactionFormInput input,
  ) async {
    if (_isLocal) return _local.updateContract(contract, input);
    await _repo.updateTransaction(contract, input, _profileId);
    await refresh();
  }

  Future<void> deleteContract(String contractId) async {
    if (_isLocal) return _local.deleteContract(contractId);
    await _repo.deleteContract(contractId);
    await refresh();
  }

  Future<void> saveOccurrence(
    String occurrenceId, {
    required String dueDate,
    required double amount,
  }) async {
    if (_isLocal) {
      return _local.updateOccurrence(occurrenceId,
          dueDate: dueDate, amount: amount);
    }
    await _repo.updateOccurrence(occurrenceId, dueDate: dueDate, amount: amount);
    await refresh();
  }

  Future<void> toggleOccurrenceStatus(LineItem item) async {
    final markPaid = item.status != OccurrenceStatus.paid;
    if (_isLocal) {
      return markPaid
          ? _local.markPaid(item.occurrenceId)
          : _local.markPending(item.occurrenceId);
    }
    if (markPaid) {
      await _repo.markOccurrencePaid(item.occurrenceId);
    } else {
      await _repo.markOccurrencePending(item.occurrenceId);
    }
    await refresh();
  }

  Future<void> cancelOccurrence(String occurrenceId) async {
    if (_isLocal) return _local.cancelOccurrence(occurrenceId);
    await _repo.cancelOccurrence(occurrenceId);
    await refresh();
  }

  Future<void> updateInitialBalance(double value) async {
    if (_isLocal) return _local.updateInitialBalance(value);
    final profile = state.valueOrNull?.profile;
    if (profile == null) throw StateError('Perfil da conta indisponível.');
    await _repo.updateInitialBalance(profile, value);
    await refresh();
  }
}

final financeControllerProvider =
    AsyncNotifierProvider<FinanceController, FinanceData>(FinanceController.new);
