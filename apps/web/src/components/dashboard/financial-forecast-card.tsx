import { ArrowDownRight, ArrowUpRight, CalendarClock, Wallet } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type FinancialForecastCardProps = {
  totalIncome: number;
  totalExpense: number;
  projectedBalance: number;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getProjectedBalanceTone(projectedBalance: number) {
  if (projectedBalance < 0) {
    return {
      container: "border-amber-200 bg-amber-50/80",
      value: "text-amber-900",
      badge: "bg-amber-100 text-amber-900",
      label: "Atenção",
    };
  }

  if (projectedBalance > 0) {
    return {
      container: "border-green-200 bg-green-50/70",
      value: "text-green-800",
      badge: "bg-green-100 text-green-800",
      label: "Folga prevista",
    };
  }

  return {
    container: "border-border/70 bg-background/70",
    value: "text-foreground",
    badge: "bg-muted text-muted-foreground",
    label: "Equilíbrio",
  };
}

export function FinancialForecastCard({
  totalIncome,
  totalExpense,
  projectedBalance,
}: FinancialForecastCardProps) {
  const tone = getProjectedBalanceTone(projectedBalance);

  return (
    <Card className="overflow-hidden rounded-[2rem] border-border/70 bg-card/95 text-card-foreground shadow-sm">
      <CardHeader className="space-y-3 border-b border-border/60 pb-6">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          <CalendarClock className="size-3.5" />
          Projeção
        </div>

        <div className="space-y-2">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            Previsão do próximo mês
          </CardTitle>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Uma leitura antecipada das entradas, saídas e do saldo estimado para
            o próximo período.
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-6">
        <div className={`rounded-[1.5rem] border p-5 ${tone.container}`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-foreground">
                  Saldo projetado
                </p>

                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${tone.badge}`}
                >
                  {tone.label}
                </span>
              </div>

              <p className={`text-3xl font-semibold ${tone.value}`}>
                {formatCurrency(projectedBalance)}
              </p>
            </div>

            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-background/70 text-foreground">
              <Wallet className="size-5" />
            </span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
          <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Entradas
                </p>
                <p className="mt-3 text-2xl font-semibold text-green-700">
                  {formatCurrency(totalIncome)}
                </p>
              </div>

              <span className="flex size-9 items-center justify-center rounded-2xl bg-green-100 text-green-800">
                <ArrowUpRight className="size-4.5" />
              </span>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Saídas
                </p>
                <p className="mt-3 text-2xl font-semibold text-red-700">
                  {formatCurrency(totalExpense)}
                </p>
              </div>

              <span className="flex size-9 items-center justify-center rounded-2xl bg-red-100 text-red-800">
                <ArrowDownRight className="size-4.5" />
              </span>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-border/70 bg-muted/40 p-5 sm:col-span-2 xl:col-span-2 2xl:col-span-1">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Resumo do período
            </p>
            <p className="mt-3 text-sm leading-6 text-foreground/85">
              Esta projeção considera o próximo mês visível da sua agenda para
              antecipar impacto financeiro antes que ele chegue ao extrato.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
