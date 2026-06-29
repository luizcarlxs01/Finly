import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type HeroSectionProps = {
  onStartTransactions: () => void;
};

export function HeroSection({ onStartTransactions }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-linear-to-br from-background via-background to-muted/35 px-5 py-8 shadow-sm sm:px-6 sm:py-10 lg:px-8 lg:py-12 2xl:px-10 2xl:py-14">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06),transparent_28%)]" />

      <div className="relative">
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
              Comece pelo essencial e ganhe clareza sobre seu dinheiro.
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
                Saldo, entradas e saídas num relance.
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
                Metas e insights no seu caminho.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
