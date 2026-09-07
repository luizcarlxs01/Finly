import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/finance_source.dart';
import '../../../shared/models/financial_rule.dart';
import '../../transactions/state/finance_controller.dart';
import '../data/rules_repository.dart';

/// Espelha apps/web/src/hooks/use-financial-rules-data.ts. Depois de criar/
/// editar/excluir/processar, recarrega as regras e (no caso de processar) o
/// financeiro — o web dispara `RULE_PROCESSING_COMPLETED_EVENT`, que a
/// dashboard escuta.
class RulesController extends AsyncNotifier<List<FinancialRule>> {
  RulesRepository get _repo => ref.read(rulesRepositoryProvider);

  RuleProcessingResult? lastProcessingResult;

  @override
  Future<List<FinancialRule>> build() async {
    // Regras financeiras só existem no modo API (o web só mostra o
    // FinancialRulesManager quando `isApiMode && selectedProfile`).
    final source = ref.watch(financeSourceProvider);
    if (source != FinanceSource.api) return const [];
    return _load();
  }

  Future<List<FinancialRule>> _load() async {
    final profileId = await _profileId();
    if (profileId == null) return const [];
    return _repo.getRules(profileId);
  }

  Future<String?> _profileId() async {
    final finance = await ref.read(financeControllerProvider.future);
    return finance.profile?.id;
  }

  Future<void> refresh() async {
    state = await AsyncValue.guard(_load);
  }

  Future<void> createRule(RuleInput input) async {
    final profileId = await _profileId();
    if (profileId == null) throw StateError('Perfil da conta indisponível.');
    await _repo.createRule(input, profileId);
    await refresh();
  }

  Future<void> updateRule(String id, RuleInput input) async {
    final profileId = await _profileId();
    if (profileId == null) throw StateError('Perfil da conta indisponível.');
    await _repo.updateRule(id, input, profileId);
    await refresh();
  }

  Future<void> deleteRule(String id) async {
    await _repo.deleteRule(id);
    await refresh();
  }

  Future<RuleProcessingResult> process() async {
    final profileId = await _profileId();
    if (profileId == null) throw StateError('Perfil da conta indisponível.');
    final result = await _repo.process(profileId);
    lastProcessingResult = result;
    await refresh();
    // Processar gera transações reais — recarrega o financeiro também.
    await ref.read(financeControllerProvider.notifier).refresh();
    return result;
  }
}

final rulesControllerProvider =
    AsyncNotifierProvider<RulesController, List<FinancialRule>>(
        RulesController.new);
