import { ArrowRight, CircleDollarSign, Target, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-gradient-to-br from-background via-background to-muted/40 px-5 py-8 shadow-sm sm:px-6 sm:py-10 lg:px-8 lg:py-12 2xl:px-10 2xl:py-14">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06),transparent_28%)]" />

      <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(260px,340px)] xl:items-end 2xl:gap-10">
        <div className="min-w-0 max-w-4xl space-y-6">
          <Badge
            variant="outline"
            className="w-fit border-border/80 bg-background/70 text-foreground"
          >
            Finly • Área de início
          </Badge>

          <div className="space-y-4">
            <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl 2xl:text-6xl">
              Organize seu financeiro com uma visão mais clara desde o primeiro acesso.
            </h1>

            <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base lg:text-lg">
              Use esta área para entender rapidamente como o Finly funciona,
              revisar seus primeiros passos e depois seguir para o painel
              operacional da dashboard.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              nativeButton={false}
              render={<a href="#resumo-financeiro" aria-label="Ir para o resumo financeiro" />}
              className="min-w-52 rounded-2xl"
            >
              Ver panorama financeiro
              <ArrowRight />
            </Button>

            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<a href="#nova-transacao" aria-label="Ir para nova transação" />}
              className="min-w-52 rounded-2xl"
            >
              Registrar transação
            </Button>
          </div>

          <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
              <p className="font-medium text-foreground">Entrada clara</p>
              <p className="mt-1 leading-6">
                Hero e onboarding agora ficam juntos na área inicial da experiência.
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
              <p className="font-medium text-foreground">Leitura guiada</p>
              <p className="mt-1 leading-6">
                Você entende o produto primeiro e só depois mergulha no painel operacional.
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
              <p className="font-medium text-foreground">Dashboard separada</p>
              <p className="mt-1 leading-6">
                Histórico, agenda e metas continuam no fluxo principal de uso.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
          <div className="rounded-2xl border border-border/70 bg-background/80 p-5 backdrop-blur">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Wallet className="size-5" />
              </span>
              <div>
                <p className="text-sm text-muted-foreground">Panorama</p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  Saldo e leitura geral logo após a área de início
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/80 p-5 backdrop-blur">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <CircleDollarSign className="size-5" />
              </span>
              <div>
                <p className="text-sm text-muted-foreground">Movimentações</p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  Registre entradas e saídas sem perder clareza visual
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/80 p-5 backdrop-blur">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Target className="size-5" />
              </span>
              <div>
                <p className="text-sm text-muted-foreground">Planejamento</p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  Metas e progresso continuam integrados ao mesmo painel
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
