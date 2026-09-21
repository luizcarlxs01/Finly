import { MessageCircle } from "lucide-react";

import type { TopicSummary } from "@/types/forum";

type TopicListProps = {
  topics: TopicSummary[];
  onOpenTopic: (id: string) => void;
  emptyMessage?: string;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const statusLabels: Record<string, { label: string; className: string }> = {
  Published: { label: "Publicado", className: "bg-emerald-500/10 text-emerald-600" },
  PendingReview: { label: "Em análise", className: "bg-amber-500/10 text-amber-600" },
  Hidden: { label: "Oculto", className: "bg-muted text-muted-foreground" },
};

export function TopicList({
  topics,
  onOpenTopic,
  emptyMessage = "Nenhum tópico por aqui ainda. Seja o primeiro a publicar.",
}: TopicListProps) {
  if (topics.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-border/70 bg-card/60 p-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {topics.map((topic) => {
        const status = statusLabels[topic.status] ?? statusLabels.Published;

        return (
          <button
            key={topic.id}
            type="button"
            onClick={() => onOpenTopic(topic.id)}
            className="flex w-full flex-col gap-2 rounded-[1.25rem] border border-border/60 bg-card/80 p-4 text-left transition hover:border-primary/40 hover:bg-card sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-sm font-semibold text-foreground">
                  {topic.title}
                </h3>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${status.className}`}
                >
                  {status.label}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {topic.authorName} · {formatDate(topic.createdAt)}
              </p>
              {topic.moderationReason ? (
                <p className="text-xs text-amber-600">{topic.moderationReason}</p>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
              <MessageCircle className="size-3.5" />
              {topic.replyCount}
            </div>
          </button>
        );
      })}
    </div>
  );
}
