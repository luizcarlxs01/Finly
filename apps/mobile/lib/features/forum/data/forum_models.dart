import '../../../shared/models/enums.dart';

/// Espelha apps/web/src/types/forum.ts.

class TopicReply {
  TopicReply({
    required this.id,
    required this.body,
    required this.isFromAdmin,
    required this.createdAt,
  });

  final String id;
  final String body;
  final bool isFromAdmin;
  final DateTime createdAt;

  factory TopicReply.fromJson(Map<String, dynamic> json) => TopicReply(
        id: json['id'] as String,
        body: json['body'] as String? ?? '',
        isFromAdmin: json['isFromAdmin'] as bool? ?? false,
        createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ??
            DateTime.now(),
      );
}

class TopicSummary {
  TopicSummary({
    required this.id,
    required this.title,
    required this.authorName,
    required this.status,
    required this.moderationReason,
    required this.replyCount,
    required this.createdAt,
  });

  final String id;
  final String title;
  final String authorName;
  final TopicStatus status;
  final String? moderationReason;
  final int replyCount;
  final DateTime createdAt;

  factory TopicSummary.fromJson(Map<String, dynamic> json) => TopicSummary(
        id: json['id'] as String,
        title: json['title'] as String? ?? '',
        authorName: json['authorName'] as String? ?? '',
        status: TopicStatus.fromApi(json['status'] as String? ?? 'Published'),
        moderationReason: json['moderationReason'] as String?,
        replyCount: json['replyCount'] as int? ?? 0,
        createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ??
            DateTime.now(),
      );
}

class TopicDetail {
  TopicDetail({
    required this.id,
    required this.title,
    required this.body,
    required this.authorName,
    required this.status,
    required this.moderationReason,
    required this.createdAt,
    required this.replies,
  });

  final String id;
  final String title;
  final String body;
  final String authorName;
  final TopicStatus status;
  final String? moderationReason;
  final DateTime createdAt;
  final List<TopicReply> replies;

  factory TopicDetail.fromJson(Map<String, dynamic> json) => TopicDetail(
        id: json['id'] as String,
        title: json['title'] as String? ?? '',
        body: json['body'] as String? ?? '',
        authorName: json['authorName'] as String? ?? '',
        status: TopicStatus.fromApi(json['status'] as String? ?? 'Published'),
        moderationReason: json['moderationReason'] as String?,
        createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ??
            DateTime.now(),
        replies: (json['replies'] as List<dynamic>? ?? [])
            .map((e) => TopicReply.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

class CreateTopicRequest {
  CreateTopicRequest({
    required this.title,
    required this.body,
    required this.authorName,
    required this.authorEmail,
  });

  final String title;
  final String body;
  final String authorName;
  final String authorEmail;

  Map<String, dynamic> toJson() => {
        'title': title,
        'body': body,
        'authorName': authorName,
        'authorEmail': authorEmail,
      };
}
