"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createTopic as createTopicWithApi,
  getAdminTopics,
  getTopic,
  getTopics,
  replyToTopic as replyToTopicWithApi,
  updateTopicStatus,
} from "@/lib/api/forum";
import { useAuthSession } from "@/hooks/use-auth-session";
import type {
  CreateTopicRequest,
  TopicDetail,
  TopicStatus,
  TopicSummary,
} from "@/types/forum";

export function useForum() {
  const { session } = useAuthSession();

  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<TopicDetail | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminTopics, setAdminTopics] = useState<TopicSummary[] | null>(null);
  const [adminStatusFilter, setAdminStatusFilter] = useState<TopicStatus | undefined>(
    undefined,
  );

  const refreshTopics = useCallback(async () => {
    const list = await getTopics();
    setTopics(list);
  }, []);

  useEffect(() => {
    refreshTopics().finally(() => setIsLoaded(true));
  }, [refreshTopics]);

  const loadAdminTopics = useCallback(
    async (status?: TopicStatus) => {
      if (!session) {
        setIsAdmin(false);
        setAdminTopics(null);
        return;
      }

      try {
        const list = await getAdminTopics(session.token, status);
        setAdminTopics(list);
        setIsAdmin(true);
      } catch {
        setIsAdmin(false);
        setAdminTopics(null);
      }
    },
    [session],
  );

  useEffect(() => {
    loadAdminTopics(adminStatusFilter);
  }, [loadAdminTopics, adminStatusFilter]);

  async function openTopic(id: string) {
    setErrorMessage(null);
    try {
      const topic = await getTopic(id);
      setSelectedTopic(topic);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível abrir o tópico.");
    }
  }

  function closeTopic() {
    setSelectedTopic(null);
  }

  async function submitTopic(input: CreateTopicRequest) {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const created = await createTopicWithApi(input);
      await refreshTopics();
      return created;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function setTopicStatus(id: string, status: TopicStatus) {
    if (!session) return;

    await updateTopicStatus(id, { status }, session.token);
    await Promise.all([refreshTopics(), loadAdminTopics(adminStatusFilter)]);

    if (selectedTopic?.id === id) {
      await openTopic(id);
    }
  }

  async function replyAsAdmin(id: string, body: string) {
    if (!session) return;

    await replyToTopicWithApi(id, { body }, session.token);
    await loadAdminTopics(adminStatusFilter);

    if (selectedTopic?.id === id) {
      await openTopic(id);
    }
  }

  return {
    topics,
    isLoaded,
    selectedTopic,
    isSubmitting,
    errorMessage,
    openTopic,
    closeTopic,
    submitTopic,
    isAdmin,
    adminTopics,
    adminStatusFilter,
    setAdminStatusFilter,
    setTopicStatus,
    replyAsAdmin,
    sessionName: session?.name ?? "",
    sessionEmail: session?.email ?? "",
  };
}
