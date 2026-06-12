"use client";

import { useState } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthSession } from "@/hooks/use-auth-session";

type AccessIntent = "login" | "register";

function AccountIdentity({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1 rounded-xl border border-border/60 bg-background/70 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="break-all text-sm text-foreground">{value}</p>
    </div>
  );
}

export function AccountAccessCard() {
  const { authenticated, isLoaded, isSubmitting, login, logout, session } =
    useAuthSession();
  const [activeIntent, setActiveIntent] = useState<AccessIntent>("login");
  const [isFormOpen, setIsFormOpen] = useState(false);

  if (!isLoaded) {
    return (
      <Card className="border border-border/70 bg-card/80">
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground">
            Carregando acesso da conta...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (authenticated && session) {
    return (
      <Card className="border border-border/70 bg-card/80">
        <CardHeader>
          <CardTitle>Modo com conta ativo</CardTitle>
          <CardDescription>
            Seus dados estão sincronizados com a sua conta Finly.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-3 md:grid-cols-2">
          <AccountIdentity label="Nome" value={session.name} />
          <AccountIdentity label="E-mail" value={session.email} />
        </CardContent>

        <CardFooter className="border-t border-border/60 pt-4">
          <Button type="button" variant="outline" onClick={logout}>
            Sair
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border border-border/70 bg-card/80">
        <CardHeader>
          <CardTitle>Use o Finly com sua conta</CardTitle>
          <CardDescription>
            Entre ou crie uma conta para sincronizar seus dados e acessá-los em
            outros dispositivos.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            className="sm:min-w-44"
            onClick={() => {
              setActiveIntent("login");
              setIsFormOpen(true);
            }}
          >
            Entrar na conta
          </Button>
          <Button
            type="button"
            variant="outline"
            className="sm:min-w-44"
            onClick={() => {
              setActiveIntent("register");
              setIsFormOpen(true);
            }}
          >
            Criar conta
          </Button>
        </CardContent>

        <CardFooter className="border-t border-border/60 pt-4 text-xs text-muted-foreground">
          Seus dados continuam salvos neste navegador até você entrar em uma
          conta.
        </CardFooter>
      </Card>

      {isFormOpen ? (
        <div className="space-y-3">
          {activeIntent === "register" ? (
            <div className="rounded-2xl border border-border/70 bg-card/70 px-4 py-3 text-sm text-muted-foreground">
              O cadastro visual será conectado em breve. Por enquanto, entre com
              uma conta já criada no backend do Finly.
            </div>
          ) : null}

          <LoginForm
            isSubmitting={isSubmitting}
            onSubmit={login}
            title="Entrar na sua conta"
            description="Acesse sua conta para sincronizar transações, metas e resumo financeiro."
            footerText="Seu acesso fica salvo neste navegador para facilitar os próximos acessos."
          />
        </div>
      ) : null}
    </div>
  );
}
