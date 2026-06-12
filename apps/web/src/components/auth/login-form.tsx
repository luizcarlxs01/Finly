"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { LoginRequest } from "@/types/auth";

type LoginFormProps = {
  isSubmitting?: boolean;
  onSubmit: (payload: LoginRequest) => Promise<void>;
  title?: string;
  description?: string;
  submitLabel?: string;
  submittingLabel?: string;
  footerText?: string;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Não foi possível fazer login agora. Confira seus dados e tente novamente.";
}

export function LoginForm({
  isSubmitting = false,
  onSubmit,
  title = "Login com a API do Finly",
  description = "Use sua conta real para validar a integração com o backend.",
  submitLabel = "Entrar",
  submittingLabel = "Entrando...",
  footerText = "A sessão autenticada será salva neste navegador.",
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    try {
      await onSubmit({
        email: email.trim(),
        password,
      });
      setPassword("");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  }

  return (
    <Card className="border border-border/70 bg-card/80">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="auth-email"
            >
              E-mail
            </label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@finly.app"
              className="flex h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
              required
            />
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="auth-password"
            >
              Senha
            </label>
            <input
              id="auth-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Digite sua senha"
              className="flex h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
              required
            />
          </div>

          {errorMessage ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}

          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? submittingLabel : submitLabel}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="border-t border-border/60 pt-4 text-xs text-muted-foreground">
        {footerText}
      </CardFooter>
    </Card>
  );
}
