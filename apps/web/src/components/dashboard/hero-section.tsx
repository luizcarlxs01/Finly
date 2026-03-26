import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-gradient-to-br from-background via-background to-muted/40 px-6 py-10 shadow-sm sm:px-8 sm:py-12 lg:px-12 lg:py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06),transparent_28%)]" />

      <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_320px] lg:items-end">
        <div className="max-w-3xl space-y-6">
          <Badge className="w-fit bg-accent text-accent-foreground hover:bg-accent/90">
            Finly • Controle Financeiro
          </Badge>

          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Organize seu dinheiro com mais clareza, ritmo e controle.
            </h1>

            <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Acompanhe saldo, entradas e saídas em uma dashboard mais direta,
              com leitura rápida e estrutura pensada para o uso recorrente no
              dia a dia.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="min-w-48">
              Começar sem conta
            </Button>

            <Button size="lg" variant="outline" className="min-w-48">
              Conhecer versão completa
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <div className="rounded-2xl border border-border/70 bg-background/80 p-5 backdrop-blur">
            <p className="text-sm text-muted-foreground">Visão geral</p>
            <p className="mt-2 text-lg font-semibold text-foreground">
              Resumo financeiro mais claro
            </p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/80 p-5 backdrop-blur">
            <p className="text-sm text-muted-foreground">Fluxo diário</p>
            <p className="mt-2 text-lg font-semibold text-foreground">
              Registro rápido de movimentações
            </p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/80 p-5 backdrop-blur">
            <p className="text-sm text-muted-foreground">Leitura imediata</p>
            <p className="mt-2 text-lg font-semibold text-foreground">
              Extrato com melhor hierarquia visual
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
