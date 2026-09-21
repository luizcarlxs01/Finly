import { apiFetch } from "@/lib/api/client";
import type {
  CreateReplyRequest,
  CreateTopicRequest,
  TopicDetail,
  TopicReply,
  TopicStatus,
  TopicSummary,
  UpdateTopicStatusRequest,
} from "@/types/forum";

export async function createTopic(payload: CreateTopicRequest): Promise<TopicDetail> {
  return apiFetch<TopicDetail>("/api/forum/topics", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getTopics(): Promise<TopicSummary[]> {
  return apiFetch<TopicSummary[]>("/api/forum/topics");
}

export async function getTopic(id: string): Promise<TopicDetail> {
  return apiFetch<TopicDetail>(`/api/forum/topics/${id}`);
}

export async function getAdminTopics(
  token: string,
  status?: TopicStatus,
): Promise<TopicSummary[]> {
  const query = status ? `?status=${status}` : "";
  return apiFetch<TopicSummary[]>(`/api/forum/admin/topics${query}`, { token });
}

export async function getAdminTopic(id: string, token: string): Promise<TopicDetail> {
  return apiFetch<TopicDetail>(`/api/forum/admin/topics/${id}`, { token });
}

export async function updateTopicStatus(
  id: string,
  payload: UpdateTopicStatusRequest,
  token: string,
): Promise<void> {
  await apiFetch<void>(`/api/forum/admin/topics/${id}/status`, {
    method: "PUT",
    body: JSON.stringify(payload),
    token,
  });
}

export async function replyToTopic(
  id: string,
  payload: CreateReplyRequest,
  token: string,
): Promise<TopicReply> {
  return apiFetch<TopicReply>(`/api/forum/admin/topics/${id}/reply`, {
    method: "POST",
    body: JSON.stringify(payload),
    token,
  });
}
