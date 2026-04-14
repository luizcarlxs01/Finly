import { ArrowRight, CircleDollarSign, Target, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type HeroSectionProps = {
  onStartTransactions: () => void;
};

export function HeroSection({ onStartTransactions }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-gradient-to-br from-background via-background to-muted/35 px-5 py-8 shadow-sm sm:px-6 sm:py-10 lg:px-8 lg:py-12 2xl:px-10 2xl:py-14">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06),transparent_28%)]" />

      <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(260px,340px)] xl:items-end 2xl:gap-10">
        <div className="min-w-0 max-w-4xl space-y-6">
          <Badge
            variant="outline"
            className="w-fit border-border/80 bg-background/70 text-foreground"
          >
            Finly
          </Badge>

          <div className="space-y-4">
            <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl 2xl:text-6xl">
              Seu financeiro mais claro, simples e organizado.
            </h1>

            <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base lg:text-lg">
              Comece pelo essencial, acompanhe sua rotina e siga com mais
              confiança no dia a dia.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              size="lg"
              onClick={onStartTransactions}
              aria-label="Ir para a aba de lançamentos"
              className="min-w-52 rounded-2xl"
            >
              Começar lançamentos
              <ArrowRight />
            </Button>
          </div>

          <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
            <div className="rounded-[1.25rem] border border-border/60 bg-background/65 px-4 py-3">
              <p className="font-medium text-foreground">Veja seu momento</p>
              <p className="mt-1 leading-6">
                Entenda saldo, entradas e saídas de forma rápida.
              </p>
            </div>

            <div className="rounded-[1.25rem] border border-border/60 bg-background/65 px-4 py-3">
              <p className="font-medium text-foreground">Registre com facilidade</p>
              <p className="mt-1 leading-6">
                Adicione movimentações sem perder clareza.
              </p>
            </div>

            <div className="rounded-[1.25rem] border border-border/60 bg-background/65 px-4 py-3">
              <p className="font-medium text-foreground">Acompanhe objetivos</p>
              <p className="mt-1 leading-6">
                Metas e insights ajudam você a seguir em frente.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
          <div className="rounded-[1.5rem] border border-border/60 bg-background/80 p-5 backdrop-blur">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Wallet className="size-5" />
              </span>
              <div>
                <p className="text-sm text-muted-foreground">Resumo</p>
                <p className="mt-2 text-base font-semibold text-foreground">
                  Veja seu panorama logo no começo.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-border/60 bg-background/80 p-5 backdrop-blur">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <CircleDollarSign className="size-5" />
              </span>
              <div>
                <p className="text-sm text-muted-foreground">Lançamentos</p>
                <p className="mt-2 text-base font-semibold text-foreground">
                  Registre entradas e saídas com clareza.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-border/60 bg-background/80 p-5 backdrop-blur">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Target className="size-5" />
              </span>
              <div>
                <p className="text-sm text-muted-foreground">Evolução</p>
                <p className="mt-2 text-base font-semibold text-foreground">
                  Acompanhe metas e sinais do seu progresso.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
