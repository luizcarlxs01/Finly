import { ArrowRight, CircleDollarSign, Target, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-gradient-to-br from-background via-background to-muted/40 px-6 py-10 shadow-sm sm:px-8 sm:py-12 lg:px-12 lg:py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06),transparent_28%)]" />

      <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_320px] lg:items-end">
        <div className="max-w-3xl space-y-6">
          <Badge
            variant="outline"
            className="w-fit border-border/80 bg-background/70 text-foreground"
          >
            Finly • Controle financeiro no navegador
          </Badge>

          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Veja seu saldo, registre transações e acompanhe metas em poucos
              minutos.
            </h1>

            <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              O Finly reúne o essencial para você organizar a vida financeira
              sem cadastro. Comece agora, direto na dashboard, com tudo salvo no
              seu navegador.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              nativeButton={false}
              render={
                <a href="#nova-transacao" aria-label="Ir para nova transação" />
              }
              className="min-w-56"
            >
              Adicionar primeira transação
              <ArrowRight />
            </Button>

            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={
                <a
                  href="#resumo-financeiro"
                  aria-label="Ir para o resumo financeiro"
                />
              }
              className="min-w-56"
            >
              Ver meu resumo agora
            </Button>
          </div>

          <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
              <p className="font-medium text-foreground">Use na hora</p>
              <p className="mt-1 leading-6">
                Sem criar conta para começar a organizar suas finanças.
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
              <p className="font-medium text-foreground">Tudo em um lugar</p>
              <p className="mt-1 leading-6">
                Saldo, transações, categorias, metas e insights na mesma tela.
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
              <p className="font-medium text-foreground">Leitura rápida</p>
              <p className="mt-1 leading-6">
                Visual pensado para entender sua situação financeira com clareza.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <div className="rounded-2xl border border-border/70 bg-background/80 p-5 backdrop-blur">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Wallet className="size-5" />
              </span>
              <div>
                <p className="text-sm text-muted-foreground">Saldo em foco</p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  Entenda sua situação logo de cara
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
                  Registre entradas e saídas sem complicação
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
                <p className="text-sm text-muted-foreground">Metas e direção</p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  Acompanhe objetivos e progresso no mesmo painel
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
