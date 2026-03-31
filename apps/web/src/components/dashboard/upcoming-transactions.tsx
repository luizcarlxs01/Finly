import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UpcomingTransactionsMonthGroup } from "@/components/dashboard/upcoming-transactions-month-group";
import type { UpcomingTransactionsMonthGroup as UpcomingTransactionsMonthGroupType } from "@/utils/upcoming-transactions";

type UpcomingTransactionsProps = {
  monthGroups: UpcomingTransactionsMonthGroupType[];
};

export function UpcomingTransactions({
  monthGroups,
}: UpcomingTransactionsProps) {
  const hasItems = monthGroups.some((group) => group.items.length > 0);

  return (
    <Card className="overflow-hidden rounded-[2rem] border-border/70 bg-card/95 shadow-sm">
      <CardHeader className="space-y-2 border-b border-border/60 pb-6">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Agenda
        </p>
        <CardTitle className="text-2xl font-semibold tracking-tight">
          Próximos lançamentos
        </CardTitle>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Uma visão dos próximos 3 meses para antecipar parcelas e recorrências
          sem misturar previsão com o histórico do extrato.
        </p>
      </CardHeader>

      <CardContent className="space-y-5 p-6">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Leitura
            </p>
            <p className="mt-1 text-sm text-foreground">
              Entradas, saídas e saldo por mês
            </p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Destaque
            </p>
            <p className="mt-1 text-sm text-foreground">
              Saldo previsto com foco visual no impacto do mês
            </p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Atenção
            </p>
            <p className="mt-1 text-sm text-foreground">
              Meses negativos ou apertados ficam sinalizados com leveza
            </p>
          </div>
        </div>

        {hasItems ? (
          monthGroups.map((group) => (
            <UpcomingTransactionsMonthGroup key={group.id} group={group} />
          ))
        ) : (
          <div className="rounded-[1.75rem] border border-dashed border-border/70 bg-background/60 p-8 text-center">
            <p className="text-base font-medium text-foreground">
              Nenhum lançamento futuro previsto
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Assim que houver parcelas ou recorrências futuras, elas aparecerão
              agrupadas aqui por mês.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
