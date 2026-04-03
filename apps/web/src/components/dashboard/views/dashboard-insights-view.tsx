import { DashboardInsights } from "@/components/dashboard/dashboard-insights";
import { FinancialForecastCard } from "@/components/dashboard/financial-forecast-card";
import type { DashboardInsight } from "@/utils/dashboard-insights";

export type DashboardInsightsViewProps = {
  insights: DashboardInsight[];
  forecastTotalIncome: number;
  forecastTotalExpense: number;
  forecastProjectedBalance: number;
};

export function DashboardInsightsView({
  insights,
  forecastTotalIncome,
  forecastTotalExpense,
  forecastProjectedBalance,
}: DashboardInsightsViewProps) {
  return (
    <div className="space-y-6 2xl:space-y-8">
      <section className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Insights
        </p>
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Leitura automática e visão complementar da dashboard
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
            Esta área concentra os insights e a previsão financeira, deixando
            espaço para evoluir a análise do produto no futuro.
          </p>
        </div>
      </section>

      <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="min-w-0">
          <DashboardInsights insights={insights} />
        </div>

        <div className="min-w-0">
          <FinancialForecastCard
            totalIncome={forecastTotalIncome}
            totalExpense={forecastTotalExpense}
            projectedBalance={forecastProjectedBalance}
          />
        </div>
      </section>

      <section className="rounded-[2rem] border border-border/70 bg-card/70 p-5 shadow-sm sm:p-6 lg:p-7">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Próximas evoluções
          </p>
          <h3 className="text-2xl font-semibold tracking-tight text-foreground">
            Espaço preparado para ampliar os insights do Finly
          </h3>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Depois podemos expandir esta tela com tendências, alertas,
            comparativos, recomendações e indicadores mais avançados sem poluir a
            área principal de lançamentos.
          </p>
        </div>
      </section>
    </div>
  );
}
