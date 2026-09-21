import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../shared/models/enums.dart';
import '../../auth/state/auth_controller.dart';
import '../data/forum_models.dart';
import '../data/forum_repository.dart';

/// Espelha apps/web/src/hooks/use-forum.ts. Sem modo local — o fórum é sempre
/// API, com ou sem sessão (mesma regra descrita na seção 27 do CLAUDE.md: não
/// participa do FinanceSource local/API).
class ForumState {
  const ForumState({
    this.topics = const [],
    this.selectedTopic,
    this.isSubmitting = false,
    this.isAdmin = false,
    this.adminTopics,
    this.adminStatusFilter,
  });

  final List<TopicSummary> topics;
  final TopicDetail? selectedTopic;
  final bool isSubmitting;
  final bool isAdmin;
  final List<TopicSummary>? adminTopics;
  final TopicStatus? adminStatusFilter;

  ForumState copyWith({
    List<TopicSummary>? topics,
    TopicDetail? selectedTopic,
    bool clearSelectedTopic = false,
    bool? isSubmitting,
    bool? isAdmin,
    List<TopicSummary>? adminTopics,
    bool clearAdminTopics = false,
    TopicStatus? adminStatusFilter,
    bool clearAdminStatusFilter = false,
  }) {
    return ForumState(
      topics: topics ?? this.topics,
      selectedTopic:
          clearSelectedTopic ? null : (selectedTopic ?? this.selectedTopic),
      isSubmitting: isSubmitting ?? this.isSubmitting,
      isAdmin: isAdmin ?? this.isAdmin,
      adminTopics: clearAdminTopics ? null : (adminTopics ?? this.adminTopics),
      adminStatusFilter: clearAdminStatusFilter
          ? null
          : (adminStatusFilter ?? this.adminStatusFilter),
    );
  }
}

class ForumController extends AsyncNotifier<ForumState> {
  ForumRepository get _repo => ref.read(forumRepositoryProvider);

  @override
  Future<ForumState> build() async {
    // Reavalia sempre que a sessão mudar (login/logout) — sem isso, entrar
    // como admin depois de já ter aberto a aba Fórum não revelava o painel
    // de moderação até o app reiniciar.
    ref.watch(authControllerProvider.select((s) => s.session?.token));
    final topics = await _repo.getTopics();
    final adminTopics = await _tryLoadAdmin(null);
    return ForumState(
      topics: topics,
      isAdmin: adminTopics != null,
      adminTopics: adminTopics,
    );
  }

  Future<List<TopicSummary>?> _tryLoadAdmin(TopicStatus? status) async {
    if (!ref.read(authControllerProvider).authenticated) return null;
    try {
      return await _repo.getAdminTopics(status: status);
    } catch (_) {
      return null;
    }
  }

  Future<void> refreshTopics() async {
    final topics = await _repo.getTopics();
    final current = state.valueOrNull ?? const ForumState();
    state = AsyncData(current.copyWith(topics: topics));
  }

  Future<TopicDetail> openTopic(String id) async {
    final topic = await _repo.getTopic(id);
    final current = state.valueOrNull ?? const ForumState();
    state = AsyncData(current.copyWith(selectedTopic: topic));
    return topic;
  }

  void closeTopic() {
    final current = state.valueOrNull;
    if (current == null) return;
    state = AsyncData(current.copyWith(clearSelectedTopic: true));
  }

  Future<TopicDetail> submitTopic(CreateTopicRequest input) async {
    final current = state.valueOrNull ?? const ForumState();
    state = AsyncData(current.copyWith(isSubmitting: true));
    try {
      final created = await _repo.createTopic(input);
      await refreshTopics();
      return created;
    } finally {
      final latest = state.valueOrNull ?? current;
      state = AsyncData(latest.copyWith(isSubmitting: false));
    }
  }

  Future<void> loadAdminTopics(TopicStatus? status) async {
    final adminTopics = await _tryLoadAdmin(status);
    final current = state.valueOrNull ?? const ForumState();
    state = AsyncData(current.copyWith(
      isAdmin: adminTopics != null,
      adminTopics: adminTopics,
      clearAdminTopics: adminTopics == null,
      adminStatusFilter: status,
      clearAdminStatusFilter: status == null,
    ));
  }

  Future<void> setTopicStatus(String id, TopicStatus status) async {
    await _repo.updateStatus(id, status);
    await refreshTopics();
    await loadAdminTopics(state.valueOrNull?.adminStatusFilter);
    if (state.valueOrNull?.selectedTopic?.id == id) {
      await openTopic(id);
    }
  }

  Future<void> replyAsAdmin(String id, String body) async {
    await _repo.reply(id, body);
    await loadAdminTopics(state.valueOrNull?.adminStatusFilter);
    if (state.valueOrNull?.selectedTopic?.id == id) {
      await openTopic(id);
    }
  }
}

final forumControllerProvider =
    AsyncNotifierProvider<ForumController, ForumState>(ForumController.new);
