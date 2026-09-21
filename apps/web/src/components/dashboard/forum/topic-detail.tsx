import { ArrowLeft, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { TopicDetail as TopicDetailType } from "@/types/forum";

type TopicDetailProps = {
  topic: TopicDetailType;
  onBack: () => void;
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TopicDetail({ topic, onBack }: TopicDetailProps) {
  return (
    <div className="space-y-5">
      <Button type="button" variant="ghost" className="gap-2 px-2" onClick={onBack}>
        <ArrowLeft className="size-4" />
        Voltar para o fórum
      </Button>

      <div className="rounded-[1.5rem] border border-border/60 bg-card/95 p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">{topic.title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {topic.authorName} · {formatDateTime(topic.createdAt)}
        </p>
        <p className="mt-4 whitespace-pre-wrap text-sm text-foreground">{topic.body}</p>
      </div>

      {topic.replies.length > 0 ? (
        <div className="space-y-3">
          {topic.replies.map((reply) => (
            <div
              key={reply.id}
              className={`rounded-[1.25rem] border p-4 ${
                reply.isFromAdmin
                  ? "border-primary/30 bg-primary/5"
                  : "border-border/60 bg-card/70"
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-medium">
                {reply.isFromAdmin ? (
                  <span className="flex items-center gap-1 text-primary">
                    <ShieldCheck className="size-3.5" />
                    Resposta do Finly
                  </span>
                ) : (
                  <span className="text-muted-foreground">{topic.authorName}</span>
                )}
                <span className="text-muted-foreground">
                  · {formatDateTime(reply.createdAt)}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{reply.body}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Ainda sem respostas.</p>
      )}
    </div>
  );
}
