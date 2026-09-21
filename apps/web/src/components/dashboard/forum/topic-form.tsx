"use client";

import { type FormEvent, useState } from "react";
import { Mail, MessageSquareText, User as UserIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CreateTopicRequest, TopicDetail } from "@/types/forum";

type TopicFormProps = {
  isSubmitting?: boolean;
  defaultName?: string;
  defaultEmail?: string;
  onSubmit: (input: CreateTopicRequest) => Promise<TopicDetail>;
};

const fieldClassName =
  "w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/80 focus:border-primary focus:ring-2 focus:ring-primary/15";

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Não foi possível publicar seu tópico agora. Tente novamente.";
}

export function TopicForm({
  isSubmitting = false,
  defaultName = "",
  defaultEmail = "",
  onSubmit,
}: TopicFormProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [authorName, setAuthorName] = useState(defaultName);
  const [authorEmail, setAuthorEmail] = useState(defaultEmail);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const normalizedTitle = title.trim();
    const normalizedBody = body.trim();
    const normalizedName = authorName.trim();
    const normalizedEmail = authorEmail.trim();

    if (!normalizedTitle || !normalizedBody || !normalizedName || !normalizedEmail) {
      setErrorMessage("Preencha todos os campos antes de publicar.");
      return;
    }

    try {
      const created = await onSubmit({
        title: normalizedTitle,
        body: normalizedBody,
        authorName: normalizedName,
        authorEmail: normalizedEmail,
      });

      setTitle("");
      setBody("");
      setSuccessMessage(
        created.status === "Published"
          ? "Tópico publicado! Já aparece na lista abaixo."
          : "Recebemos seu tópico. Ele passou por uma checagem automática e vai aparecer assim que for aprovado.",
      );
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  }

  return (
    <Card className="rounded-[1.5rem] border-border/60 bg-card/95 shadow-sm">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-xl font-semibold tracking-tight">
          Novo tópico
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Deixe sua dúvida, reclamação ou sugestão. Respondemos por aqui e por e-mail.
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-1.5">
            <label htmlFor="topic-title" className="text-sm font-medium text-foreground">
              Título
            </label>
            <input
              id="topic-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={fieldClassName}
              placeholder="Ex.: Não consigo editar uma parcela"
              maxLength={150}
              required
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="topic-body" className="text-sm font-medium text-foreground">
              Descrição
            </label>
            <div className="relative">
              <MessageSquareText className="pointer-events-none absolute left-4 top-4 size-4 text-muted-foreground" />
              <textarea
                id="topic-body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                className={`${fieldClassName} min-h-32 pl-11`}
                placeholder="Descreva com detalhes..."
                maxLength={2000}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <label htmlFor="topic-author-name" className="text-sm font-medium text-foreground">
                Seu nome
              </label>
              <div className="relative">
                <UserIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="topic-author-name"
                  type="text"
                  value={authorName}
                  onChange={(event) => setAuthorName(event.target.value)}
                  className={`${fieldClassName} pl-11`}
                  placeholder="Seu nome"
                  maxLength={150}
                  required
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="topic-author-email" className="text-sm font-medium text-foreground">
                Seu e-mail
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="topic-author-email"
                  type="email"
                  value={authorEmail}
                  onChange={(event) => setAuthorEmail(event.target.value)}
                  className={`${fieldClassName} pl-11`}
                  placeholder="voce@exemplo.com"
                  required
                />
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Usamos seu e-mail só para avisar quando alguém responder seu tópico.
          </p>

          {errorMessage ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
              {successMessage}
            </div>
          ) : null}

          <Button type="submit" className="h-11 w-full rounded-2xl" disabled={isSubmitting}>
            {isSubmitting ? "Publicando..." : "Publicar tópico"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
