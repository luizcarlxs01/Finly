import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { DashboardInsights } from "@/components/dashboard/dashboard-insights";
import type { DashboardInsight } from "@/utils/dashboard-insights";

function createInsight(
  overrides: Partial<DashboardInsight> = {},
): DashboardInsight {
  return {
    id: "insight-1",
    title: "Saldo saudável",
    description: "Seu fluxo segue estável no período.",
    tone: "positive",
    ...overrides,
  };
}

function renderDashboardInsights(
  overrides: Partial<React.ComponentProps<typeof DashboardInsights>> = {},
) {
  const props: React.ComponentProps<typeof DashboardInsights> = {
    insights: [createInsight()],
    ...overrides,
  };

  return {
    ...render(<DashboardInsights {...props} />),
    props,
  };
}

describe("DashboardInsights", () => {
  it("deve renderizar o bloco com dados validos e exibir os insights recebidos", () => {
    renderDashboardInsights({
      insights: [
        createInsight(),
        createInsight({
          id: "insight-2",
          title: "Gastos em atenção",
          description: "As saídas cresceram nesta semana.",
          tone: "warning",
        }),
      ],
    });

    expect(screen.getByText("Leituras rápidas")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Sinais simples para te ajudar a entender o momento atual.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Saldo saudável")).toBeInTheDocument();
    expect(screen.getByText("Seu fluxo segue estável no período.")).toBeInTheDocument();
    expect(screen.getByText("Bom sinal")).toBeInTheDocument();
    expect(screen.getByText("Gastos em atenção")).toBeInTheDocument();
    expect(screen.getByText("As saídas cresceram nesta semana.")).toBeInTheDocument();
    expect(screen.getByText("Vale atenção")).toBeInTheDocument();
  });

  it("deve renderizar de forma estavel com dados minimos validos", () => {
    renderDashboardInsights({
      insights: [
        createInsight({
          id: "insight-minimal",
          title: "Sem alerta",
          description: "Tudo dentro do esperado.",
          tone: "neutral",
        }),
      ],
    });

    expect(screen.getByText("Sem alerta")).toBeInTheDocument();
    expect(screen.getByText("Tudo dentro do esperado.")).toBeInTheDocument();
    expect(screen.getByText("No radar")).toBeInTheDocument();
  });

  it("deve manter consistencia textual com multiplos tons suportados atualmente", () => {
    renderDashboardInsights({
      insights: [
        createInsight({ id: "positive", title: "Positivo", tone: "positive" }),
        createInsight({ id: "neutral", title: "Neutro", tone: "neutral" }),
        createInsight({ id: "warning", title: "Atenção", tone: "warning" }),
      ],
    });

    expect(screen.getByText("Positivo")).toBeInTheDocument();
    expect(screen.getByText("Neutro")).toBeInTheDocument();
    expect(screen.getByText("Atenção")).toBeInTheDocument();
    expect(screen.getByText("Bom sinal")).toBeInTheDocument();
    expect(screen.getByText("No radar")).toBeInTheDocument();
    expect(screen.getByText("Vale atenção")).toBeInTheDocument();
  });
});
