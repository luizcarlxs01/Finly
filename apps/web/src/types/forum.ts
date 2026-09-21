export type TopicStatus = "Published" | "PendingReview" | "Hidden";

export type TopicReply = {
  id: string;
  body: string;
  isFromAdmin: boolean;
  createdAt: string;
};

export type TopicSummary = {
  id: string;
  title: string;
  authorName: string;
  status: TopicStatus;
  moderationReason: string | null;
  replyCount: number;
  createdAt: string;
};

export type TopicDetail = {
  id: string;
  title: string;
  body: string;
  authorName: string;
  status: TopicStatus;
  moderationReason: string | null;
  createdAt: string;
  replies: TopicReply[];
};

export type CreateTopicRequest = {
  title: string;
  body: string;
  authorName: string;
  authorEmail: string;
};

export type CreateReplyRequest = {
  body: string;
};

export type UpdateTopicStatusRequest = {
  status: TopicStatus;
};
