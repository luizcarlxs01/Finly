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
      label: "Folga",
    };
  }

  return {
    container: "border-border/60 bg-background/70",
    value: "text-foreground",
    badge: "bg-muted text-muted-foreground",
    label: "Em dia",
  };
}

export function FinancialForecastCard({
  totalIncome,
  totalExpense,
  projectedBalance,
}: FinancialForecastCardProps) {
  const tone = getProjectedBalanceTone(projectedBalance);

  return (
    <Card className="overflow-hidden rounded-[1.75rem] border-border/60 bg-card/95 text-card-foreground shadow-sm">
      <CardHeader className="space-y-2 pb-4">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground">
          <CalendarClock className="size-3.5" />
          Previsão
        </div>

        <div className="space-y-1">
          <CardTitle className="text-xl font-semibold tracking-tight">
            Próximo período
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Uma visão rápida do que vem pela frente.
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-5 pt-0">
        <div className={`rounded-[1.25rem] border p-4 ${tone.container}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-foreground">
                  Saldo previsto
                </p>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone.badge}`}
                >
                  {tone.label}
                </span>
              </div>

              <p className={`text-2xl font-semibold ${tone.value}`}>
                {formatCurrency(projectedBalance)}
              </p>
            </div>

            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-background/70 text-foreground">
              <Wallet className="size-5" />
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[1.25rem] border border-border/60 bg-background/65 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Entradas</p>
                <p className="mt-1 text-lg font-semibold text-green-700">
                  {formatCurrency(totalIncome)}
                </p>
              </div>

              <span className="flex size-8 items-center justify-center rounded-2xl bg-green-100 text-green-800">
                <ArrowUpRight className="size-4" />
              </span>
            </div>
          </div>

          <div className="rounded-[1.25rem] border border-border/60 bg-background/65 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Saídas</p>
                <p className="mt-1 text-lg font-semibold text-red-700">
                  {formatCurrency(totalExpense)}
                </p>
              </div>

              <span className="flex size-8 items-center justify-center rounded-2xl bg-red-100 text-red-800">
                <ArrowDownRight className="size-4" />
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
