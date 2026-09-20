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

type EmailVerificationFormProps = {
  email: string;
  isSubmitting?: boolean;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  onCancel: () => void;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Não foi possível confirmar o código agora. Tente novamente.";
}

export function EmailVerificationForm({
  email,
  isSubmitting = false,
  onVerify,
  onResend,
  onCancel,
}: EmailVerificationFormProps) {
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setResendMessage(null);

    try {
      await onVerify(code.trim());
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  }

  async function handleResend() {
    setErrorMessage(null);
    setResendMessage(null);

    try {
      await onResend();
      setResendMessage("Enviamos um novo código para o seu e-mail.");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  }

  return (
    <Card className="border border-border/70 bg-card/80">
      <CardHeader>
        <CardTitle>Confirme seu e-mail</CardTitle>
        <CardDescription>
          Enviamos um código de 6 dígitos para <strong>{email}</strong>. Ele
          expira em 10 minutos.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="verification-code"
            >
              Código de verificação
            </label>
            <input
              id="verification-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="flex h-11 w-full rounded-md border border-border bg-background px-3 text-center text-lg tracking-[0.5em] text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
              required
            />
          </div>

          {errorMessage ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}

          {resendMessage ? (
            <div className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
              {resendMessage}
            </div>
          ) : null}

          <Button
            className="w-full"
            type="submit"
            disabled={isSubmitting || code.length !== 6}
          >
            {isSubmitting ? "Confirmando..." : "Confirmar código"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex-col items-start gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={handleResend}
          disabled={isSubmitting}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline disabled:opacity-60"
        >
          Reenviar código
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Cancelar
        </button>
      </CardFooter>
    </Card>
  );
}
