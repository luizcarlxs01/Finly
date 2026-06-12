import type { ReactNode } from "react";
import { DashboardInsights } from "@/components/dashboard/dashboard-insights";
import { FinancialForecastCard } from "@/components/dashboard/financial-forecast-card";
import type { DashboardInsight } from "@/utils/dashboard-insights";

export type DashboardInsightsViewProps = {
  accountAutomationView?: ReactNode;
  isApiMode?: boolean;
  pendingFeatureMessage?: string;
  insights: DashboardInsight[];
  forecastTotalIncome: number;
  forecastTotalExpense: number;
  forecastProjectedBalance: number;
};

export function DashboardInsightsView({
  accountAutomationView = null,
  isApiMode = false,
  pendingFeatureMessage,
  insights,
  forecastTotalIncome,
  forecastTotalExpense,
  forecastProjectedBalance,
}: DashboardInsightsViewProps) {
  return (
    <div className="space-y-6 2xl:space-y-8">
      <section className="space-y-2">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Insights
        </h2>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
          Veja leituras rápidas sobre sua vida financeira.
        </p>
      </section>

      {isApiMode && pendingFeatureMessage ? (
        <section className="rounded-[1.5rem] border border-border/60 bg-background/55 px-4 py-3 text-sm text-muted-foreground">
          {pendingFeatureMessage}
        </section>
      ) : null}

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

      <section className="rounded-[1.75rem] border border-border/60 bg-card/70 p-5 shadow-sm sm:p-6">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold tracking-tight text-foreground">
            Mais contexto, no seu tempo
          </h3>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            O Finly ainda pode ampliar essa leitura com o tempo, sem perder a
            clareza da tela.
          </p>
        </div>
      </section>

      {accountAutomationView}
    </div>
  );
}
