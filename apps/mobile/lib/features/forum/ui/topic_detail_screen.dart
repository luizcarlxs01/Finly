import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../app/theme.dart';
import '../../../core/widgets/widgets.dart';
import '../data/forum_models.dart';
import '../state/forum_controller.dart';

/// Tela de detalhe de um tópico — espelha
/// apps/web/src/components/dashboard/forum/topic-detail.tsx.
class TopicDetailScreen extends ConsumerStatefulWidget {
  const TopicDetailScreen({super.key, required this.topicId});

  final String topicId;

  @override
  ConsumerState<TopicDetailScreen> createState() => _TopicDetailScreenState();
}

class _TopicDetailScreenState extends ConsumerState<TopicDetailScreen> {
  late final Future<TopicDetail> _future;

  @override
  void initState() {
    super.initState();
    _future = ref.read(forumControllerProvider.notifier).openTopic(widget.topicId);
  }

  String _formatDateTime(DateTime value) =>
      DateFormat("dd/MM/yyyy 'às' HH:mm", 'pt_BR').format(value);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Tópico')),
      body: FutureBuilder<TopicDetail>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [ErrorBanner(snapshot.error.toString())],
            );
          }

          final topic = snapshot.data!;

          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
            children: [
              FinlyCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(topic.title,
                        style: const TextStyle(
                            fontSize: 17, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    Text(
                      '${topic.authorName} · ${_formatDateTime(topic.createdAt)}',
                      style: TextStyle(
                          fontSize: 12, color: context.mutedForeground),
                    ),
                    const SizedBox(height: 12),
                    Text(topic.body, style: const TextStyle(fontSize: 14)),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              if (topic.replies.isEmpty)
                Text(
                  'Ainda sem respostas.',
                  style: TextStyle(fontSize: 13, color: context.mutedForeground),
                )
              else
                ...topic.replies.map(
                  (reply) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: FinlyCard(
                      borderColor: reply.isFromAdmin
                          ? context.scheme.primary.withValues(alpha: 0.4)
                          : null,
                      background: reply.isFromAdmin
                          ? context.scheme.primary.withValues(alpha: 0.05)
                          : null,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              if (reply.isFromAdmin) ...[
                                Icon(Icons.verified_user_outlined,
                                    size: 14, color: context.scheme.primary),
                                const SizedBox(width: 4),
                                Text(
                                  'Resposta do Finly',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: context.scheme.primary,
                                  ),
                                ),
                              ] else
                                Text(
                                  topic.authorName,
                                  style: TextStyle(
                                      fontSize: 12,
                                      color: context.mutedForeground),
                                ),
                              const SizedBox(width: 4),
                              Text(
                                '· ${_formatDateTime(reply.createdAt)}',
                                style: TextStyle(
                                    fontSize: 12,
                                    color: context.mutedForeground),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(reply.body, style: const TextStyle(fontSize: 14)),
                        ],
                      ),
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}
