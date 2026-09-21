import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../shared/models/enums.dart';
import 'forum_models.dart';

/// Espelha apps/web/src/lib/api/forum.ts. O `ApiClient` já anexa o JWT
/// automaticamente quando existe sessão (AuthInterceptor), então os endpoints
/// admin não precisam de token explícito aqui — a própria API decide 200/403.
class ForumRepository {
  ForumRepository(this._client);

  final ApiClient _client;

  Future<TopicDetail> createTopic(CreateTopicRequest request) async {
    final json = await _client.post<Map<String, dynamic>>(
      '/api/forum/topics',
      body: request.toJson(),
    );
    return TopicDetail.fromJson(json);
  }

  Future<List<TopicSummary>> getTopics() async {
    final list = await _client.get<List<dynamic>>('/api/forum/topics');
    return list
        .map((e) => TopicSummary.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<TopicDetail> getTopic(String id) async {
    final json = await _client.get<Map<String, dynamic>>('/api/forum/topics/$id');
    return TopicDetail.fromJson(json);
  }

  Future<List<TopicSummary>> getAdminTopics({TopicStatus? status}) async {
    final list = await _client.get<List<dynamic>>(
      '/api/forum/admin/topics',
      query: status != null ? {'status': status.apiValue} : null,
    );
    return list
        .map((e) => TopicSummary.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<TopicDetail> getAdminTopic(String id) async {
    final json =
        await _client.get<Map<String, dynamic>>('/api/forum/admin/topics/$id');
    return TopicDetail.fromJson(json);
  }

  Future<void> updateStatus(String id, TopicStatus status) {
    // O endpoint devolve 204 sem corpo — <Map<String, dynamic>> aqui quebrava
    // com "String is not a subtype of Map" ao tentar castear o body vazio.
    return _client.put<void>(
      '/api/forum/admin/topics/$id/status',
      body: {'status': status.apiValue},
    );
  }

  Future<TopicReply> reply(String id, String body) async {
    final json = await _client.post<Map<String, dynamic>>(
      '/api/forum/admin/topics/$id/reply',
      body: {'body': body},
    );
    return TopicReply.fromJson(json);
  }
}

final forumRepositoryProvider = Provider<ForumRepository>(
  (ref) => ForumRepository(ref.read(apiClientProvider)),
);
