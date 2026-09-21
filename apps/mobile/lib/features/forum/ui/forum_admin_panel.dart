import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../app/theme.dart';
import '../../../core/widgets/widgets.dart';
import '../../../shared/models/enums.dart';
import '../data/forum_models.dart';
import '../state/forum_controller.dart';
import 'topic_detail_screen.dart';

/// Espelha apps/web/src/components/dashboard/forum/forum-admin-panel.tsx —
/// só aparece quando `ForumState.isAdmin` é true (a própria chamada
/// admin/topics decide isso, sem flag separada).
class ForumAdminPanel extends ConsumerWidget {
  const ForumAdminPanel({
    super.key,
    required this.topics,
    required this.statusFilter,
  });

  final List<TopicSummary> topics;
  final TopicStatus? statusFilter;

  static const _filters = <({String label, TopicStatus? value})>[
    (label: 'Todos', value: null),
    (label: 'Em análise', value: TopicStatus.pendingReview),
    (label: 'Publicados', value: TopicStatus.published),
    (label: 'Ocultos', value: TopicStatus.hidden),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scheme = context.scheme;

    return FinlyCard(
      borderColor: scheme.primary.withValues(alpha: 0.3),
      background: scheme.primary.withValues(alpha: 0.03),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Moderação do fórum',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Text(
            'Só você vê esta seção. Aprove tópicos sinalizados, oculte o que '
            'for necessário e responda diretamente por aqui.',
            style: TextStyle(fontSize: 12.5, color: context.mutedForeground),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _filters.map((filter) {
              final selected = filter.value == statusFilter;
              return ChoiceChip(
                label: Text(filter.label),
                selected: selected,
                onSelected: (_) => ref
                    .read(forumControllerProvider.notifier)
                    .loadAdminTopics(filter.value),
              );
            }).toList(),
          ),
          const SizedBox(height: 12),
          if (topics.isEmpty)
            Text('Nenhum tópico nesse filtro.',
                style: TextStyle(fontSize: 13, color: context.mutedForeground))
          else
            ...topics.map(
              (topic) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _AdminTopicRow(topic: topic),
              ),
            ),
        ],
      ),
    );
  }
}

class _AdminTopicRow extends ConsumerStatefulWidget {
  const _AdminTopicRow({required this.topic});

  final TopicSummary topic;

  @override
  ConsumerState<_AdminTopicRow> createState() => _AdminTopicRowState();
}

class _AdminTopicRowState extends ConsumerState<_AdminTopicRow> {
  bool _isReplying = false;
  bool _isBusy = false;
  final _replyController = TextEditingController();

  @override
  void dispose() {
    _replyController.dispose();
    super.dispose();
  }

  Future<void> _run(Future<void> Function() action) async {
    setState(() => _isBusy = true);
    try {
      await action();
    } catch (e) {
      if (mounted) showErrorSnack(context, e);
    } finally {
      if (mounted) setState(() => _isBusy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final topic = widget.topic;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: context.scheme.surface,
        borderRadius: BorderRadius.circular(AppColors.fieldRadius),
        border: Border.all(color: context.scheme.outline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          InkWell(
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => TopicDetailScreen(topicId: topic.id),
              ),
            ),
            child: Text(
              topic.title,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                decoration: TextDecoration.underline,
              ),
            ),
          ),
          const SizedBox(height: 2),
          Text(
            '${topic.authorName} · ${DateFormat('dd/MM/yyyy', 'pt_BR').format(topic.createdAt)} · ${topic.status.label}',
            style: TextStyle(fontSize: 11.5, color: context.mutedForeground),
          ),
          if (topic.moderationReason != null) ...[
            const SizedBox(height: 4),
            Text(topic.moderationReason!,
                style: TextStyle(fontSize: 11.5, color: Colors.amber.shade800)),
          ],
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              if (topic.status != TopicStatus.published)
                OutlinedButton(
                  onPressed: _isBusy
                      ? null
                      : () => _run(() => ref
                          .read(forumControllerProvider.notifier)
                          .setTopicStatus(topic.id, TopicStatus.published)),
                  child: const Text('Aprovar'),
                ),
              if (topic.status != TopicStatus.hidden)
                OutlinedButton(
                  onPressed: _isBusy
                      ? null
                      : () => _run(() => ref
                          .read(forumControllerProvider.notifier)
                          .setTopicStatus(topic.id, TopicStatus.hidden)),
                  child: const Text('Ocultar'),
                ),
              TextButton(
                onPressed: () => setState(() => _isReplying = !_isReplying),
                child: Text(_isReplying ? 'Cancelar' : 'Responder'),
              ),
            ],
          ),
          if (_isReplying) ...[
            const SizedBox(height: 8),
            TextField(
              controller: _replyController,
              maxLines: 3,
              decoration: const InputDecoration(
                hintText: 'Escreva a resposta que vai aparecer no tópico e por e-mail...',
              ),
            ),
            const SizedBox(height: 8),
            ElevatedButton(
              onPressed: _isBusy
                  ? null
                  : () async {
                      final body = _replyController.text.trim();
                      if (body.isEmpty) return;
                      await _run(() => ref
                          .read(forumControllerProvider.notifier)
                          .replyAsAdmin(topic.id, body));
                      if (mounted) {
                        _replyController.clear();
                        setState(() => _isReplying = false);
                      }
                    },
              child: const Text('Enviar resposta'),
            ),
          ],
        ],
      ),
    );
  }
}
