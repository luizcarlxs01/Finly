import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../shared/models/dashboard_summary.dart';
import '../../../shared/models/enums.dart';
import '../../../shared/models/profile.dart';
import '../../../shared/models/transaction.dart';
import 'transaction_form_input.dart';

/// Concentra o HTTP de perfis / dashboard / transações / ocorrências —
/// equivalente a apps/web/src/lib/api/{profiles,dashboard,transactions,occurrences}.ts.
class FinanceRepository {
  FinanceRepository(this._client);

  final ApiClient _client;

  Future<List<Profile>> getProfiles() async {
    final list = await _client.get<List<dynamic>>('/api/Profiles');
    return list
        .map((e) => Profile.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<DashboardSummary> getDashboard(String profileId) async {
    final json = await _client
        .get<Map<String, dynamic>>('/api/Dashboard/$profileId');
    return DashboardSummary.fromJson(json);
  }

  Future<List<TransactionContract>> getTransactions(String profileId) async {
    final list = await _client.get<List<dynamic>>(
      '/api/Transactions',
      query: {'financialProfileId': profileId},
    );
    return list
        .map((e) => TransactionContract.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> createTransaction(
    TransactionFormInput input,
    String profileId,
  ) {
    return _client.post<Map<String, dynamic>>(
      '/api/Transactions',
      body: _writeBody(input, profileId, kind: input.kind),
    );
  }

  /// Atualiza o **contrato** inteiro. `contract` é o registro cru — daí saem
  /// SourceId e os campos não tocados pelo formulário (mesma lógica de
  /// buildApiContractUpdateRequest no web).
  Future<void> updateTransaction(
    TransactionContract contract,
    TransactionFormInput input,
    String profileId,
  ) {
    final body = _writeBody(input, profileId, kind: input.kind);
    body['sourceId'] = contract.sourceId;
    return _client.put<Map<String, dynamic>>(
      '/api/Transactions/${contract.id}',
      body: body,
    );
  }

  Future<void> deleteContract(String contractId) =>
      _client.delete('/api/Transactions/$contractId');

  // ---- Ocorrências ----------------------------------------------------
  Future<void> updateOccurrence(
    String occurrenceId, {
    required String dueDate,
    required double amount,
  }) {
    return _client.put<Map<String, dynamic>>(
      '/api/Occurrences/$occurrenceId',
      body: {'dueDate': dueDate, 'amount': amount},
    );
  }

  Future<void> markOccurrencePaid(String occurrenceId) =>
      _client.patch<Map<String, dynamic>>(
          '/api/Occurrences/$occurrenceId/mark-paid');

  Future<void> markOccurrencePending(String occurrenceId) =>
      _client.patch<Map<String, dynamic>>(
          '/api/Occurrences/$occurrenceId/mark-pending');

  /// Soft-delete (status Cancelled) — DELETE /api/Occurrences/{id}. É o que a
  /// lixeira de uma linha faz no web (use-cancel-occurrence.ts), **não** apaga
  /// o contrato.
  Future<void> cancelOccurrence(String occurrenceId) =>
      _client.delete('/api/Occurrences/$occurrenceId');

  Future<void> updateInitialBalance(Profile profile, double value) {
    return _client.put<Map<String, dynamic>>(
      '/api/Profiles/${profile.id}',
      body: {
        'name': profile.name,
        'description': profile.description,
        'initialBalance': value,
      },
    );
  }

  Map<String, dynamic> _writeBody(
    TransactionFormInput input,
    String profileId, {
    required ContractKind kind,
  }) {
    final isRecurring = kind == ContractKind.recurring;
    return {
      'financialProfileId': profileId,
      'title': input.title.trim(),
      'amount': input.amount,
      'type': input.type.apiValue,
      'category': input.category.trim().toLowerCase(),
      'transactionKind': kind.apiValue,
      'transactionDate': input.anchorDate,
      'sourceId': null,
      'installmentCount':
          kind == ContractKind.installment ? input.installmentCount : null,
      'isRecurring': isRecurring,
      'recurrenceStartDate': isRecurring ? input.recurrenceStartDate : null,
      'recurrenceEndDate': isRecurring &&
              input.recurrenceMode == RecurrenceMode.untilDate
          ? input.recurrenceEndDate
          : null,
      'recurrenceDay': isRecurring ? input.recurrenceDay : null,
      'recurrenceMonths': isRecurring &&
              input.recurrenceMode == RecurrenceMode.forMonths
          ? input.recurrenceMonths
          : null,
    };
  }
}

final financeRepositoryProvider = Provider<FinanceRepository>(
  (ref) => FinanceRepository(ref.read(apiClientProvider)),
);
