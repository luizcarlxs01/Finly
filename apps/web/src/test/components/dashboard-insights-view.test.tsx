import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";

import { DashboardInsightsView } from "@/components/dashboard/views/dashboard-insights-view";
import type { DashboardInsight } from "@/utils/dashboard-insights";

function createInsight(overrides: Partial<DashboardInsight> = {}): DashboardInsight {
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
  return render(<DashboardInsightsView
    insights={[createInsight()]}
    forecastTotalIncome={3000}
    forecastTotalExpense={1200}
    forecastProjectedBalance={1800}
    {...overrides}
  />);
}

describe("DashboardInsightsView", () => {
  it("exibe perfil, leituras, previsao e analise com componentes reais", () => {
    renderDashboardInsightsView({
      spendingProfileCard: <button>Editar perfil</button>,
      accountAutomationView: <button>Ativar sincronização</button>,
    });

    expect(within(screen.getByRole("region", { name: "Perfil de gastos" })).getByRole("button", { name: "Editar perfil" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Leituras rápidas" })).toHaveTextContent("Saldo saudável");
    expect(screen.getByRole("region", { name: "Previsão financeira" })).toHaveTextContent("Saldo previsto");
    expect(within(screen.getByRole("region", { name: "Regras financeiras da conta" })).getByRole("button", { name: "Ativar sincronização" })).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Análise de gastos" })).getByRole("combobox", { name: "Tipo de gráfico" })).toHaveValue("category-pie");
  });

  it("exibe insights e valores recebidos pela view sem substituir seus componentes", () => {
    renderDashboardInsightsView({
      insights: [createInsight(), createInsight({ id: "insight-2", title: "2 metas ativas", description: "Você está avançando nas metas do mês.", tone: "neutral" })],
      forecastTotalIncome: 4500,
      forecastTotalExpense: 1700,
      forecastProjectedBalance: 2800,
    });
    const readings = within(screen.getByRole("region", { name: "Leituras rápidas" }));
    expect(readings.getAllByRole("article")).toHaveLength(2);
    expect(readings.getByRole("heading", { name: "Saldo saudável" })).toBeInTheDocument();
    expect(readings.getByText("Seu saldo segue confortável.")).toBeInTheDocument();
    expect(readings.getByText("Bom sinal")).toBeInTheDocument();
    expect(readings.getByRole("heading", { name: "2 metas ativas" })).toBeInTheDocument();
    expect(readings.getByText("Você está avançando nas metas do mês.")).toBeInTheDocument();
    expect(readings.getByText("No radar")).toBeInTheDocument();
    const forecast = within(screen.getByRole("region", { name: "Previsão financeira" }));
    expect(forecast.getByLabelText("R$ 4.500,00")).toBeInTheDocument();
    expect(forecast.getByLabelText("R$ 1.700,00")).toBeInTheDocument();
    expect(forecast.getByLabelText("R$ 2.800,00")).toBeInTheDocument();
  });

  it("exibe dados minimos e saldo neutro sem perder as leituras", () => {
    renderDashboardInsightsView({
      insights: [createInsight({ id: "insight-minimal", title: "Fallback neutro", description: "Sem dados suficientes.", tone: "neutral" })],
      forecastTotalIncome: 0,
      forecastTotalExpense: 0,
      forecastProjectedBalance: 0,
    });
    const readings = within(screen.getByRole("region", { name: "Leituras rápidas" }));
    expect(readings.getAllByRole("article")).toHaveLength(1);
    expect(readings.getByText("Fallback neutro")).toBeInTheDocument();
    expect(readings.getByText("Sem dados suficientes.")).toBeInTheDocument();
    expect(readings.getByText("No radar")).toBeInTheDocument();
    const forecast = within(screen.getByRole("region", { name: "Previsão financeira" }));
    expect(forecast.getAllByLabelText("R$ 0,00")).toHaveLength(3);
    expect(forecast.getByText("Em dia")).toBeInTheDocument();
  });

  it("mantem previsao e estado vazio da analise quando nao ha insights", () => {
    renderDashboardInsightsView({ insights: [], forecastTotalIncome: 0, forecastTotalExpense: 0, forecastProjectedBalance: 0 });
    expect(within(screen.getByRole("region", { name: "Leituras rápidas" })).queryAllByRole("article")).toHaveLength(0);
    expect(within(screen.getByRole("region", { name: "Previsão financeira" })).getAllByLabelText("R$ 0,00")).toHaveLength(3);
    expect(screen.getByRole("region", { name: "Análise de gastos" })).toHaveTextContent("Nenhum lançamento pago encontrado com esses filtros.");
  });
});
