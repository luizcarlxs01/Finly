import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type FinanceSummaryCardProps = {
  initialBalance: number;
  totalIncome: number;
  totalExpense: number;
  currentBalance: number;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function FinanceSummaryCard({
  initialBalance,
  totalIncome,
  totalExpense,
  currentBalance,
}: FinanceSummaryCardProps) {
  return (
    <Card className="overflow-hidden rounded-[2rem] border-border/70 bg-card/95 text-card-foreground shadow-sm">
      <CardHeader className="flex flex-col gap-3 border-b border-border/60 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Panorama
          </p>
          <CardTitle className="text-2xl font-semibold tracking-tight">
            Resumo financeiro
          </CardTitle>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Uma leitura mais sólida do seu cenário atual, com foco no saldo,
            entradas e saídas do período armazenado localmente.
          </p>
        </div>

        <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Saldo atual
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
            {formatCurrency(currentBalance)}
          </p>
        </div>
      </CardHeader>

      <CardContent className="grid gap-4 p-6 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-border/70 bg-background/70 p-5">
          <p className="text-sm text-muted-foreground">Saldo inicial</p>
          <p className="mt-3 text-2xl font-semibold text-foreground">
            {formatCurrency(initialBalance)}
          </p>
        </div>

        <div className="rounded-2xl border border-border/70 bg-background/70 p-5">
          <p className="text-sm text-muted-foreground">Entradas</p>
          <p className="mt-3 text-2xl font-semibold text-green-700">
            {formatCurrency(totalIncome)}
          </p>
        </div>

        <div className="rounded-2xl border border-border/70 bg-background/70 p-5">
          <p className="text-sm text-muted-foreground">Saídas</p>
          <p className="mt-3 text-2xl font-semibold text-red-700">
            {formatCurrency(totalExpense)}
          </p>
        </div>

        <div className="rounded-2xl border border-border/70 bg-muted/50 p-5">
          <p className="text-sm text-muted-foreground">Resultado líquido</p>
          <p className="mt-3 text-2xl font-semibold text-foreground">
            {formatCurrency(totalIncome - totalExpense)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
