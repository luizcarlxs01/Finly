"use client";

import { type FormEvent, useState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
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
  compact?: boolean;
  isSubmitting?: boolean;
  onSubmit: (payload: LoginRequest) => Promise<void>;
  onForgotPassword?: () => void;
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
  compact = false,
  isSubmitting = false,
  onSubmit,
  onForgotPassword,
  title = "Login com a API do Finly",
  description = "Use sua conta real para validar a integração com o backend.",
  submitLabel = "Entrar",
  submittingLabel = "Entrando...",
  footerText = "A sessão autenticada será salva neste navegador.",
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      {!compact ? (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      ) : null}

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
              className="flex h-10 w-full rounded-xl border border-border/60 bg-muted/20 px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="auth-password"
              >
                Senha
              </label>
            </div>
            <div className="relative">
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Digite sua senha"
                className="flex h-10 w-full rounded-xl border border-border/60 bg-muted/20 px-3 pr-10 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground outline-none transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {onForgotPassword ? (
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="rounded-sm text-xs font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Esqueceu a senha ?
                </button>
              ) : null}
          </div>

          {errorMessage ? (
            <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}

          <Button className="h-10 w-full rounded-xl" type="submit" disabled={isSubmitting}>
            {isSubmitting ? submittingLabel : submitLabel}
            <LogIn className="size-4" />
          </Button>
        </form>
      </CardContent>

      {!compact ? (
        <CardFooter className="border-t border-border/60 pt-4 text-xs text-muted-foreground">
          {footerText}
        </CardFooter>
      ) : null}
    </Card>
  );
}
