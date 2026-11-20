import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TruncatedValue } from "@/components/ui/truncated-value";

type FinancialForecastCardProps = {
  totalIncome: number;
  totalExpense: number;
  projectedBalance: number;
  minimal?: boolean;
  compact?: boolean;
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
      container: "border-accent/60 bg-accent/25",
      value: "text-foreground",
      badge: "bg-accent/55 text-foreground",
      label: "Atenção",
    };
  }

  if (projectedBalance > 0) {
    return {
      container: "border-primary/20 bg-primary/10",
      value: "text-primary",
      badge: "bg-primary/15 text-primary",
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
  minimal = false,
  compact = false,
}: FinancialForecastCardProps) {
  const tone = getProjectedBalanceTone(projectedBalance);

  if (minimal) {
    return (
      <section className={compact ? "flex flex-col gap-2 px-1 py-0" : "space-y-6 px-1 py-2"} aria-label={"Previs\u00e3o financeira"}>
        <div className={`flex flex-col items-center gap-2 border-b border-border/60 text-center ${compact ? "pb-2" : "pb-6"}`}>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-muted-foreground">
              Saldo previsto
            </p>
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${tone.badge}`}
            >
              {tone.label}
            </span>
          </div>
          <TruncatedValue className={`text-3xl font-semibold tracking-tight ${tone.value}`} value={formatCurrency(projectedBalance)} />
          <p className="text-sm text-muted-foreground">{"Pr\u00f3ximo per\u00edodo"}</p>
        </div>

        <div className="grid grid-cols-2 divide-x divide-border/60">
          <div className="min-w-0 space-y-1 px-4 text-center sm:px-6">
            <p className="text-sm text-muted-foreground">Entradas previstas</p>
            <TruncatedValue className="text-xl font-semibold text-primary" value={formatCurrency(totalIncome)} />
          </div>
          <div className="min-w-0 space-y-1 px-4 text-center sm:px-6">
            <p className="text-sm text-muted-foreground">{"Sa\u00eddas previstas"}</p>
            <TruncatedValue className="text-xl font-semibold text-foreground" value={formatCurrency(totalExpense)} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <Card className="overflow-hidden rounded-[1.75rem] border-border/60 bg-card/95 text-card-foreground shadow-sm">
      <CardHeader className="space-y-1 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-xl font-semibold tracking-tight">
            Próximo período
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Um olhar rápido para o que pode vir pela frente.
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 p-5 pt-0">
        <div className={`rounded-[1.25rem] border p-4 ${tone.container}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-foreground">
                  Saldo previsto
                </p>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${tone.badge}`}
                >
                  {tone.label}
                </span>
              </div>

              <TruncatedValue className={`text-2xl font-semibold ${tone.value}`} value={formatCurrency(projectedBalance)} />
            </div>

            <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-background/70 text-foreground">
              <Wallet className="size-4.5" />
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[1.25rem] border border-primary/15 bg-primary/8 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Entradas</p>
                <TruncatedValue className="mt-1 text-lg font-semibold text-primary" value={formatCurrency(totalIncome)} />
              </div>

              <span className="flex size-8 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                <ArrowUpRight className="size-4" />
              </span>
            </div>
          </div>

          <div className="rounded-[1.25rem] border border-accent/60 bg-accent/25 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Saídas</p>
                <TruncatedValue className="mt-1 text-lg font-semibold text-foreground" value={formatCurrency(totalExpense)} />
              </div>

              <span className="flex size-8 items-center justify-center rounded-2xl bg-accent/55 text-foreground">
                <ArrowDownRight className="size-4" />
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

