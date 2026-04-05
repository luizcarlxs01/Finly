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
    <Card className="overflow-hidden rounded-[1.75rem] border-border/60 bg-card/95 text-card-foreground shadow-sm">
      <CardHeader className="space-y-1 pb-0">
        <CardTitle className="text-xl font-semibold tracking-tight">
          Resumo financeiro
        </CardTitle>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Um resumo rápido do momento atual.
        </p>
      </CardHeader>

      <CardContent className="grid gap-3 p-5 pt-4 md:grid-cols-3">
        <div className="rounded-[1.25rem] border border-border/60 bg-background/65 p-4">
          <p className="text-sm text-muted-foreground">Saldo atual</p>
          <p className="mt-2 text-xl font-semibold text-foreground">
            {formatCurrency(currentBalance)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Base inicial: {formatCurrency(initialBalance)}
          </p>
        </div>

        <div className="rounded-[1.25rem] border border-primary/15 bg-primary/8 p-4">
          <p className="text-sm text-muted-foreground">Entradas</p>
          <p className="mt-2 text-xl font-semibold text-primary">
            {formatCurrency(totalIncome)}
          </p>
        </div>

        <div className="rounded-[1.25rem] border border-accent/60 bg-accent/25 p-4">
          <p className="text-sm text-muted-foreground">Saídas</p>
          <p className="mt-2 text-xl font-semibold text-foreground">
            {formatCurrency(totalExpense)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
