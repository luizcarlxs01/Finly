import type { ReactNode } from "react";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardInsights } from "@/components/dashboard/dashboard-insights";
import { FinancialForecastCard } from "@/components/dashboard/financial-forecast-card";
import { SpendingAnalysisPanel } from "@/components/dashboard/insights/spending-analysis-panel";
import type { Transaction } from "@/types/finance";
import type { DashboardInsight } from "@/utils/dashboard-insights";

export type DashboardInsightsViewProps = {
  accountAutomationView?: ReactNode;
  insights: DashboardInsight[];
  forecastTotalIncome: number;
  forecastTotalExpense: number;
  forecastProjectedBalance: number;
  spendingProfileCard?: ReactNode;
  analysisTransactions?: Transaction[];
};

export function DashboardInsightsView({
  accountAutomationView = null,
  insights,
  forecastTotalIncome,
  forecastTotalExpense,
  forecastProjectedBalance,
  spendingProfileCard = null,
  analysisTransactions = [],
}: DashboardInsightsViewProps) {
  return (
    <div className="space-y-6 2xl:space-y-8">
      <DashboardPageHeader
        title="Insights"
        description="Veja leituras rápidas sobre sua vida financeira."
      />

      {spendingProfileCard}

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

      <SpendingAnalysisPanel transactions={analysisTransactions} />

      {accountAutomationView}
    </div>
  );
}
