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

type ForgotPasswordFormProps = {
  isSubmitting?: boolean;
  onSubmit: (email: string) => Promise<void>;
  onCancel: () => void;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Não foi possível enviar o link agora. Tente novamente.";
}

export function ForgotPasswordForm({
  isSubmitting = false,
  onSubmit,
  onCancel,
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [wasSent, setWasSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    try {
      await onSubmit(email.trim());
      setWasSent(true);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  }

  if (wasSent) {
    return (
      <Card className="border border-border/70 bg-card/80">
        <CardHeader>
          <CardTitle>Verifique seu e-mail</CardTitle>
          <CardDescription>
            Se <strong>{email}</strong> tiver uma conta no Finly, enviamos um
            link para redefinir a senha. Ele expira em 1 hora.
          </CardDescription>
        </CardHeader>
        <CardFooter className="border-t border-border/60 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Voltar para o login
          </button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="border border-border/70 bg-card/80">
      <CardHeader>
        <CardTitle>Esqueci minha senha</CardTitle>
        <CardDescription>
          Informe o e-mail da sua conta. Se ela existir, mandamos um link para
          redefinir a senha.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="forgot-password-email"
            >
              E-mail
            </label>
            <input
              id="forgot-password-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@finly.app"
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
            {isSubmitting ? "Enviando..." : "Enviar link de redefinição"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="border-t border-border/60 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Voltar para o login
        </button>
      </CardFooter>
    </Card>
  );
}
