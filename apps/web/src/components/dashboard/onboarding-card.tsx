import { Database, GlobeLock, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function OnboardingCard() {
  return (
    <Card className="rounded-[1.75rem] border-border/60 bg-card/95 shadow-sm">
      <CardHeader className="space-y-3 border-b border-border/60 pb-5">
        <Badge
          variant="outline"
          className="w-fit border-border/80 bg-background/70 text-foreground"
        >
          Modo atual
        </Badge>

        <div className="space-y-1">
          <CardTitle className="text-xl font-semibold tracking-tight text-foreground">
            Comece a usar o Finly agora
          </CardTitle>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Tudo funciona direto no navegador.
          </p>
        </div>
      </CardHeader>

      <CardContent className="grid gap-3 p-5 md:grid-cols-3">
        <div className="rounded-[1.25rem] border border-border/60 bg-background/60 p-4">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Database className="size-5" />
          </span>
          <p className="mt-4 text-sm font-medium text-foreground">
            Seus dados ficam aqui
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Saldo, lançamentos e metas ficam salvos neste navegador.
          </p>
        </div>

        <div className="rounded-[1.25rem] border border-border/60 bg-background/60 p-4">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <TriangleAlert className="size-5" />
          </span>
          <p className="mt-4 text-sm font-medium text-foreground">
            Vale lembrar
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Trocar de navegador ou limpar os dados apaga as informações.
          </p>
        </div>

        <div className="rounded-[1.25rem] border border-border/60 bg-background/60 p-4">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <GlobeLock className="size-5" />
          </span>
          <p className="mt-4 text-sm font-medium text-foreground">
            Começo sem fricção
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Ganhe clareza antes de qualquer cadastro.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
