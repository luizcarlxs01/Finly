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

export function FinancialForecastCard({
  totalIncome,
  totalExpense,
  projectedBalance,
}: FinancialForecastCardProps) {
  return (
    <Card className="overflow-hidden rounded-[2rem] border-border/70 bg-card/95 text-card-foreground shadow-sm">
      <CardHeader className="flex flex-col gap-3 border-b border-border/60 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Projeção
          </p>
          <CardTitle className="text-2xl font-semibold tracking-tight">
            Previsão do próximo mês
          </CardTitle>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Uma visão antecipada das entradas, saídas e do saldo estimado para
            o próximo período.
          </p>
        </div>

        <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Saldo projetado
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
            {formatCurrency(projectedBalance)}
          </p>
        </div>
      </CardHeader>

      <CardContent className="grid gap-4 p-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/70 bg-background/70 p-5">
          <p className="text-sm text-muted-foreground">Total de entradas</p>
          <p className="mt-3 text-2xl font-semibold text-green-700">
            {formatCurrency(totalIncome)}
          </p>
        </div>

        <div className="rounded-2xl border border-border/70 bg-background/70 p-5">
          <p className="text-sm text-muted-foreground">Total de saídas</p>
          <p className="mt-3 text-2xl font-semibold text-red-700">
            {formatCurrency(totalExpense)}
          </p>
        </div>

        <div className="rounded-2xl border border-border/70 bg-muted/50 p-5">
          <p className="text-sm text-muted-foreground">Saldo projetado</p>
          <p className="mt-3 text-2xl font-semibold text-foreground">
            {formatCurrency(projectedBalance)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
