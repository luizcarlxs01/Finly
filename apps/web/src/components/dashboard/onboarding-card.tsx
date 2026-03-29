import { Database, GlobeLock, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function OnboardingCard() {
  return (
    <Card className="rounded-[2rem] border-border/70 bg-card/95 shadow-sm">
      <CardHeader className="space-y-4 border-b border-border/60 pb-6">
        <Badge
          variant="outline"
          className="w-fit border-border/80 bg-background/70 text-foreground"
        >
          Modo atual
        </Badge>

        <div className="space-y-2">
          <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">
            Você já pode usar o Finly sem conta
          </CardTitle>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Este MVP funciona direto no navegador para você começar agora,
            testar a experiência e organizar sua rotina financeira sem etapas
            extras.
          </p>
        </div>
      </CardHeader>

      <CardContent className="grid gap-4 p-6 md:grid-cols-3">
        <div className="rounded-2xl border border-border/70 bg-background/70 p-5">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Database className="size-5" />
          </span>
          <p className="mt-4 text-sm font-medium text-foreground">
            Seus dados ficam neste navegador
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Saldo, transações, categorias e metas são salvos localmente para uso
            imediato.
          </p>
        </div>

        <div className="rounded-2xl border border-border/70 bg-background/70 p-5">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <TriangleAlert className="size-5" />
          </span>
          <p className="mt-4 text-sm font-medium text-foreground">
            Ainda há limitações naturais deste modo
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Se você trocar de navegador, limpar os dados locais ou mudar de
            dispositivo, as informações não acompanham você.
          </p>
        </div>

        <div className="rounded-2xl border border-border/70 bg-background/70 p-5">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <GlobeLock className="size-5" />
          </span>
          <p className="mt-4 text-sm font-medium text-foreground">
            Ideal para começar sem fricção
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            A proposta aqui é simples: dar clareza sobre seu dinheiro antes
            mesmo de existir um fluxo completo com conta.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
