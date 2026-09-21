"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TopicStatus, TopicSummary } from "@/types/forum";

type ForumAdminPanelProps = {
  topics: TopicSummary[];
  statusFilter: TopicStatus | undefined;
  onChangeFilter: (status: TopicStatus | undefined) => void;
  onApprove: (id: string) => Promise<void>;
  onHide: (id: string) => Promise<void>;
  onReply: (id: string, body: string) => Promise<void>;
  onOpenTopic: (id: string) => void;
};

const filters: Array<{ label: string; value: TopicStatus | undefined }> = [
  { label: "Todos", value: undefined },
  { label: "Em análise", value: "PendingReview" },
  { label: "Publicados", value: "Published" },
  { label: "Ocultos", value: "Hidden" },
];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function AdminTopicRow({
  topic,
  onApprove,
  onHide,
  onReply,
  onOpenTopic,
}: {
  topic: TopicSummary;
  onApprove: (id: string) => Promise<void>;
  onHide: (id: string) => Promise<void>;
  onReply: (id: string, body: string) => Promise<void>;
  onOpenTopic: (id: string) => void;
}) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  async function handleReplySubmit() {
    const body = replyBody.trim();
    if (!body) return;

    setIsBusy(true);
    try {
      await onReply(topic.id, body);
      setReplyBody("");
      setIsReplying(false);
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="rounded-[1.25rem] border border-border/60 bg-card/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onOpenTopic(topic.id)}
          className="text-left text-sm font-semibold text-foreground hover:underline"
        >
          {topic.title}
        </button>
        <span className="text-xs text-muted-foreground">
          {topic.authorName} · {formatDate(topic.createdAt)} · {topic.status}
        </span>
      </div>

      {topic.moderationReason ? (
        <p className="mt-1 text-xs text-amber-600">{topic.moderationReason}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {topic.status !== "Published" ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isBusy}
            onClick={async () => {
              setIsBusy(true);
              try {
                await onApprove(topic.id);
              } finally {
                setIsBusy(false);
              }
            }}
          >
            Aprovar
          </Button>
        ) : null}

        {topic.status !== "Hidden" ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isBusy}
            onClick={async () => {
              setIsBusy(true);
              try {
                await onHide(topic.id);
              } finally {
                setIsBusy(false);
              }
            }}
          >
            Ocultar
          </Button>
        ) : null}

        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setIsReplying((prev) => !prev)}
        >
          {isReplying ? "Cancelar" : "Responder"}
        </Button>
      </div>

      {isReplying ? (
        <div className="mt-3 space-y-2">
          <textarea
            value={replyBody}
            onChange={(event) => setReplyBody(event.target.value)}
            className="w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            placeholder="Escreva a resposta que vai aparecer no tópico e por e-mail..."
            rows={3}
          />
          <Button type="button" size="sm" disabled={isBusy} onClick={handleReplySubmit}>
            Enviar resposta
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function ForumAdminPanel({
  topics,
  statusFilter,
  onChangeFilter,
  onApprove,
  onHide,
  onReply,
  onOpenTopic,
}: ForumAdminPanelProps) {
  return (
    <Card className="rounded-[1.5rem] border-primary/30 bg-primary/[0.03] shadow-sm">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-lg font-semibold tracking-tight">
          Moderação do fórum
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Só você vê esta seção. Aprove tópicos sinalizados, oculte o que for
          necessário e responda diretamente por aqui.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <Button
              key={filter.label}
              type="button"
              size="sm"
              variant={statusFilter === filter.value ? "default" : "outline"}
              onClick={() => onChangeFilter(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {topics.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum tópico nesse filtro.</p>
        ) : (
          <div className="space-y-3">
            {topics.map((topic) => (
              <AdminTopicRow
                key={topic.id}
                topic={topic}
                onApprove={onApprove}
                onHide={onHide}
                onReply={onReply}
                onOpenTopic={onOpenTopic}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
