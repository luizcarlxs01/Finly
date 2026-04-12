import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { UpcomingTransactionsMonthGroup } from "@/components/dashboard/upcoming-transactions-month-group";
import type { UpcomingTransactionsMonthGroup as UpcomingTransactionsMonthGroupType } from "@/utils/upcoming-transactions";

function createMonthGroup(
  overrides: Partial<UpcomingTransactionsMonthGroupType> = {},
): UpcomingTransactionsMonthGroupType {
  return {
    id: "2026-05",
    monthLabel: "maio de 2026",
    monthDate: "2026-05-01",
    items: [
      {
        id: "item-1",
        title: "Academia",
        amount: 90,
        type: "expense",
        occurrenceDate: "2026-05-10",
        marker: "Recorrente indefinido",
        sourceKind: "recurring-instance",
      },
    ],
    totalIncome: 1200,
    totalExpense: 90,
    projectedBalance: 1110,
    balanceTone: "positive",
    balanceSummary: "Mes com folga prevista para absorver os proximos lancamentos.",
    ...overrides,
  };
}

describe("UpcomingTransactionsMonthGroup", () => {
  it("deve renderizar o grupo mensal com saldo, datas e marcadores principais", () => {
    render(<UpcomingTransactionsMonthGroup group={createMonthGroup()} />);

    expect(screen.getByText("maio de 2026")).toBeInTheDocument();
    expect(screen.getByText(/^Folga prevista$/i)).toBeInTheDocument();
    expect(screen.getByText("1 lançamento previsto")).toBeInTheDocument();
    expect(screen.getByText("Academia")).toBeInTheDocument();
    expect(screen.getByText(/Compet/i)).toHaveTextContent("10/05/2026");
    expect(screen.getByText("Saída")).toBeInTheDocument();
    expect(screen.getByText("Recorrente indefinido")).toBeInTheDocument();
    expect(
      screen.getAllByText((_, element) => element?.textContent === "R$ 1.110,00")
        .length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText((_, element) => element?.textContent === "R$ 1.200,00"),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText((_, element) => element?.textContent === "R$ 90,00")
        .length,
    ).toBeGreaterThan(0);
  });

  it("deve refletir o tom observavel de atencao quando o mes estiver negativo", () => {
    render(
      <UpcomingTransactionsMonthGroup
        group={createMonthGroup({
          balanceTone: "warning",
          projectedBalance: -150,
          totalIncome: 0,
          totalExpense: 150,
          balanceSummary:
            "Atencao: as saidas previstas superam as entradas deste mes.",
          items: [
            {
              id: "item-warning",
              title: "Parcela notebook",
              amount: 150,
              type: "expense",
              occurrenceDate: "2026-05-15",
              marker: "Parcela 3/10",
              sourceKind: "installment-instance",
            },
          ],
        })}
      />,
    );

    expect(screen.getByText(/^Atenção$/i)).toBeInTheDocument();
    expect(screen.getByText("Parcela notebook")).toBeInTheDocument();
    expect(screen.getByText("Parcela 3/10")).toBeInTheDocument();
    expect(
      screen.getAllByText((_, element) => element?.textContent === "-R$ 150,00")
        .length,
    ).toBeGreaterThan(0);
  });

  it("deve se manter estavel com dados minimos validos", () => {
    render(
      <UpcomingTransactionsMonthGroup
        group={createMonthGroup({
          items: [
            {
              id: "item-minimal",
              title: "Salario",
              amount: 1,
              type: "income",
              occurrenceDate: "2026-05-01",
              marker: "Recorrente",
              sourceKind: "recurring-instance",
            },
          ],
          totalIncome: 1,
          totalExpense: 0,
          projectedBalance: 1,
          balanceTone: "neutral",
          balanceSummary: "Mes apertado, com pouca margem prevista.",
        })}
      />,
    );

    expect(screen.getByText("Salario")).toBeInTheDocument();
    expect(screen.getByText("Entrada")).toBeInTheDocument();
    expect(screen.getByText("Recorrente")).toBeInTheDocument();
    expect(screen.getByText(/pouca margem prevista/i)).toBeInTheDocument();
  });
});
