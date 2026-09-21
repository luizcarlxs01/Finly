import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../app/app.dart';
import '../../../app/shell.dart';
import '../../../app/theme.dart';
import '../../../core/widgets/widgets.dart';
import '../../../shared/models/enums.dart';
import '../data/forum_models.dart';
import '../state/forum_controller.dart';
import 'forum_admin_panel.dart';
import 'topic_detail_screen.dart';
import 'topic_form_sheet.dart';

/// Espelha apps/web/src/components/dashboard/views/dashboard-forum-view.tsx.
class ForumScreen extends ConsumerWidget {
  const ForumScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final forumAsync = ref.watch(forumControllerProvider);

    return Scaffold(
      appBar:
          const FinlyAppBar(title: 'Fórum', themeToggle: ThemeToggleButton()),
      floatingActionButton: FloatingActionButton(
        onPressed: () => showTopicFormSheet(context),
        child: const Icon(Icons.add),
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(forumControllerProvider.notifier).refreshTopics(),
        child: forumAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => ListView(
            padding: const EdgeInsets.all(16),
            children: [
              ErrorBanner(
                e.toString(),
                onRetry: () => ref.invalidate(forumControllerProvider),
              ),
            ],
          ),
          data: (state) => ListView(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 96),
            children: [
              const SectionHeader(
                subtitle:
                    'Dúvidas, reclamações e sugestões da comunidade Finly.',
              ),
              const SizedBox(height: 14),
              if (state.isAdmin && state.adminTopics != null) ...[
                ForumAdminPanel(
                  topics: state.adminTopics!,
                  statusFilter: state.adminStatusFilter,
                ),
                const SizedBox(height: 16),
              ],
              if (state.topics.isEmpty)
                const EmptyState(
                  title: 'Nenhum tópico por aqui ainda',
                  description: 'Seja o primeiro a publicar um tópico.',
                )
              else
                ...state.topics.map(
                  (topic) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: _TopicCard(topic: topic),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TopicCard extends StatelessWidget {
  const _TopicCard({required this.topic});

  final TopicSummary topic;

  @override
  Widget build(BuildContext context) {
    return FinlyCard(
      onTap: () => Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => TopicDetailScreen(topicId: topic.id)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        topic.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                            fontSize: 14, fontWeight: FontWeight.w600),
                      ),
                    ),
                    const SizedBox(width: 8),
                    PillBadge(
                      label: topic.status.label,
                      background: topic.status == TopicStatus.published
                          ? context.success.withValues(alpha: 0.12)
                          : Colors.amber.withValues(alpha: 0.12),
                      foreground: topic.status == TopicStatus.published
                          ? context.success
                          : Colors.amber.shade800,
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  '${topic.authorName} · ${DateFormat('dd/MM/yyyy', 'pt_BR').format(topic.createdAt)}',
                  style: TextStyle(fontSize: 11.5, color: context.mutedForeground),
                ),
                if (topic.moderationReason != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    topic.moderationReason!,
                    style: TextStyle(fontSize: 11.5, color: Colors.amber.shade800),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 8),
          Row(
            children: [
              Icon(Icons.mode_comment_outlined,
                  size: 14, color: context.mutedForeground),
              const SizedBox(width: 4),
              Text('${topic.replyCount}',
                  style:
                      TextStyle(fontSize: 12, color: context.mutedForeground)),
            ],
          ),
        ],
      ),
    );
  }
}
