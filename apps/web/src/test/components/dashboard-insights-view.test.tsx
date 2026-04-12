import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/dashboard/dashboard-insights", () => ({
  DashboardInsights: ({
    insights,
  }: {
    insights: Array<{
      id: string;
      title: string;
      description: string;
      tone: "neutral" | "positive" | "warning";
    }>;
  }) => (
    <div>
      <p>DashboardInsights</p>
      <p>Quantidade insights: {insights.length}</p>
      {insights.length === 0 ? <p>Nenhum insight disponível</p> : null}
      {insights.map((insight) => (
        <div key={insight.id}>
          <p>{insight.title}</p>
          <p>{insight.description}</p>
          <p>{insight.tone}</p>
        </div>
      ))}
    </div>
  ),
}));

vi.mock("@/components/dashboard/financial-forecast-card", () => ({
  FinancialForecastCard: ({
    totalIncome,
    totalExpense,
    projectedBalance,
  }: {
    totalIncome: number;
    totalExpense: number;
    projectedBalance: number;
  }) => (
    <div>
      <p>FinancialForecastCard</p>
      <p>Entradas previsão: {totalIncome}</p>
      <p>Saídas previsão: {totalExpense}</p>
      <p>Saldo previsto: {projectedBalance}</p>
    </div>
  ),
}));

import { DashboardInsightsView } from "@/components/dashboard/views/dashboard-insights-view";
import type { DashboardInsight } from "@/utils/dashboard-insights";

function createInsight(
  overrides: Partial<DashboardInsight> = {},
): DashboardInsight {
  return {
    id: "insight-1",
    title: "Saldo saudável",
    description: "Seu saldo segue confortável.",
    tone: "positive",
    ...overrides,
  };
}

function renderDashboardInsightsView(
  overrides: Partial<React.ComponentProps<typeof DashboardInsightsView>> = {},
) {
  const props: React.ComponentProps<typeof DashboardInsightsView> = {
    insights: [createInsight()],
    forecastTotalIncome: 3000,
    forecastTotalExpense: 1200,
    forecastProjectedBalance: 1800,
    ...overrides,
  };

  return {
    ...render(<DashboardInsightsView {...props} />),
    props,
  };
}

describe("DashboardInsightsView", () => {
  it("deve renderizar os blocos principais da view", () => {
    renderDashboardInsightsView();

    expect(screen.getByText("Insights")).toBeInTheDocument();
    expect(
      screen.getByText("Veja leituras rápidas sobre sua vida financeira."),
    ).toBeInTheDocument();
    expect(screen.getByText("DashboardInsights")).toBeInTheDocument();
    expect(screen.getByText("FinancialForecastCard")).toBeInTheDocument();
    expect(screen.getByText("Mais contexto, no seu tempo")).toBeInTheDocument();
    expect(
      screen.getByText(
        "O Finly ainda pode ampliar essa leitura com o tempo, sem perder a clareza da tela.",
      ),
    ).toBeInTheDocument();
  });

  it("deve exibir corretamente os insights recebidos por props com dados completos", () => {
    renderDashboardInsightsView({
      insights: [
        createInsight(),
        createInsight({
          id: "insight-2",
          title: "2 metas ativas",
          description: "Você está avançando nas metas do mês.",
          tone: "neutral",
        }),
      ],
      forecastTotalIncome: 4500,
      forecastTotalExpense: 1700,
      forecastProjectedBalance: 2800,
    });

    expect(screen.getByText("Quantidade insights: 2")).toBeInTheDocument();
    expect(screen.getByText("Saldo saudável")).toBeInTheDocument();
    expect(screen.getByText("Seu saldo segue confortável.")).toBeInTheDocument();
    expect(screen.getByText("positive")).toBeInTheDocument();
    expect(screen.getByText("2 metas ativas")).toBeInTheDocument();
    expect(
      screen.getByText("Você está avançando nas metas do mês."),
    ).toBeInTheDocument();
    expect(screen.getByText("neutral")).toBeInTheDocument();
    expect(screen.getByText("Entradas previsão: 4500")).toBeInTheDocument();
    expect(screen.getByText("Saídas previsão: 1700")).toBeInTheDocument();
    expect(screen.getByText("Saldo previsto: 2800")).toBeInTheDocument();
  });

  it("deve renderizar de forma estavel com dados minimos validos", () => {
    renderDashboardInsightsView({
      insights: [
        createInsight({
          id: "insight-minimal",
          title: "Fallback neutro",
          description: "Sem dados suficientes.",
          tone: "neutral",
        }),
      ],
      forecastTotalIncome: 0,
      forecastTotalExpense: 0,
      forecastProjectedBalance: 0,
    });

    expect(screen.getByText("Quantidade insights: 1")).toBeInTheDocument();
    expect(screen.getByText("Fallback neutro")).toBeInTheDocument();
    expect(screen.getByText("Sem dados suficientes.")).toBeInTheDocument();
    expect(screen.getByText("neutral")).toBeInTheDocument();
    expect(screen.getByText("Entradas previsão: 0")).toBeInTheDocument();
    expect(screen.getByText("Saídas previsão: 0")).toBeInTheDocument();
    expect(screen.getByText("Saldo previsto: 0")).toBeInTheDocument();
  });

  it("deve refletir o comportamento condicional quando nao houver insights", () => {
    renderDashboardInsightsView({
      insights: [],
      forecastTotalIncome: 0,
      forecastTotalExpense: 0,
      forecastProjectedBalance: 0,
    });

    expect(screen.getByText("Quantidade insights: 0")).toBeInTheDocument();
    expect(screen.getByText("Nenhum insight disponível")).toBeInTheDocument();
    expect(screen.getByText("FinancialForecastCard")).toBeInTheDocument();
    expect(screen.getByText("Saldo previsto: 0")).toBeInTheDocument();
  });
});
