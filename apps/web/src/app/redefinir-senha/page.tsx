"use client";

import Link from "next/link";
import { Suspense, type FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { PasswordStrengthBar } from "@/components/auth/password-strength-bar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageContainer } from "@/components/layout/page-container";
import { resetPassword } from "@/lib/api/auth";

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Não foi possível redefinir sua senha agora. Tente novamente.";
}

function ResetPasswordCard({ token }: { token: string | null }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [wasReset, setWasReset] = useState(false);

  if (!token) {
    return (
      <Card className="border border-border/70 bg-card/80">
        <CardHeader>
          <CardTitle>Link inválido</CardTitle>
          <CardDescription>
            Esse link de redefinição de senha está incompleto ou não veio de
            um e-mail do Finly. Volte para a tela de login e peça um novo
            link em &quot;Esqueci minha senha&quot;.
          </CardDescription>
        </CardHeader>
        <CardFooter className="border-t border-border/60 pt-4">
          <Link
            href="/"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            Voltar para o Finly
          </Link>
        </CardFooter>
      </Card>
    );
  }

  if (wasReset) {
    return (
      <Card className="border border-border/70 bg-card/80">
        <CardHeader>
          <CardTitle>Senha redefinida!</CardTitle>
          <CardDescription>
            Sua senha foi alterada com sucesso. Faça login normalmente com a
            nova senha.
          </CardDescription>
        </CardHeader>
        <CardFooter className="border-t border-border/60 pt-4">
          <Link href="/">
            <Button type="button">Ir para o login</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (newPassword.length < 8) {
      setErrorMessage("A senha deve ter no mínimo 8 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("As senhas não coincidem.");
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword({ token: token as string, newPassword });
      setWasReset(true);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="border border-border/70 bg-card/80">
      <CardHeader>
        <CardTitle>Redefinir senha</CardTitle>
        <CardDescription>Escolha uma nova senha para sua conta Finly.</CardDescription>
      </CardHeader>

      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="reset-new-password"
            >
              Nova senha
            </label>
            <div className="relative">
              <input
                id="reset-new-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Crie uma senha"
                minLength={8}
                className="flex h-11 w-full rounded-md border border-border bg-background px-3 pr-10 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            <PasswordStrengthBar password={newPassword} />
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="reset-confirm-password"
            >
              Confirmar nova senha
            </label>
            <input
              id="reset-confirm-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Digite a senha de novo"
              minLength={8}
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
            {isSubmitting ? "Redefinindo..." : "Redefinir senha"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ResetPasswordPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  return (
    <PageContainer>
      <div className="mx-auto w-full max-w-md">
        <ResetPasswordCard token={token} />
      </div>
    </PageContainer>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}
