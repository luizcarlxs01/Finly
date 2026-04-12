import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { UpcomingTransactions } from "@/components/dashboard/upcoming-transactions";
import type { UpcomingTransactionsMonthGroup } from "@/utils/upcoming-transactions";

function createMonthGroup(
  overrides: Partial<UpcomingTransactionsMonthGroup> = {},
): UpcomingTransactionsMonthGroup {
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
        marker: "Recorrente",
        sourceKind: "recurring-instance",
      },
    ],
    totalIncome: 0,
    totalExpense: 90,
    projectedBalance: 910,
    balanceTone: "positive",
    balanceSummary: "Mes com folga prevista.",
    ...overrides,
  };
}

describe("UpcomingTransactions", () => {
  it("deve renderizar a agenda principal com o primeiro mes recebido", () => {
    render(
      <UpcomingTransactions
        monthGroups={[
          createMonthGroup(),
          createMonthGroup({
            id: "2026-06",
            monthLabel: "junho de 2026",
            monthDate: "2026-06-01",
            items: [
              {
                id: "item-2",
                title: "Parcela notebook",
                amount: 250,
                type: "expense",
                occurrenceDate: "2026-06-15",
                marker: "Parcela 2/10",
                sourceKind: "installment-instance",
              },
            ],
          }),
        ]}
      />,
    );

    expect(screen.getByText("Próximos lançamentos")).toBeInTheDocument();
    expect(screen.getAllByText("maio de 2026").length).toBeGreaterThan(0);
    expect(screen.getByText("1 de 2")).toBeInTheDocument();
    expect(screen.getByText("Academia")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Anterior/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Próximo/i })).toBeEnabled();
  });

  it("deve navegar entre os meses quando houver mais de um grupo", async () => {
    const user = userEvent.setup();

    render(
      <UpcomingTransactions
        monthGroups={[
          createMonthGroup(),
          createMonthGroup({
            id: "2026-06",
            monthLabel: "junho de 2026",
            monthDate: "2026-06-01",
            items: [
              {
                id: "item-2",
                title: "Parcela notebook",
                amount: 250,
                type: "expense",
                occurrenceDate: "2026-06-15",
                marker: "Parcela 2/10",
                sourceKind: "installment-instance",
              },
            ],
          }),
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Próximo/i }));

    expect(screen.getAllByText("junho de 2026").length).toBeGreaterThan(0);
    expect(screen.getByText("2 de 2")).toBeInTheDocument();
    expect(screen.getByText("Parcela notebook")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Anterior/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Próximo/i })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /Anterior/i }));

    expect(screen.getByText("Academia")).toBeInTheDocument();
    expect(screen.getByText("1 de 2")).toBeInTheDocument();
  });

  it("deve exibir fallback visual quando nao houver itens previstos", () => {
    render(
      <UpcomingTransactions
        monthGroups={[
          createMonthGroup({ items: [] }),
          createMonthGroup({
            id: "2026-06",
            monthLabel: "junho de 2026",
            monthDate: "2026-06-01",
            items: [],
          }),
        ]}
      />,
    );

    expect(
      screen.getByText(/Nenhum lan.amento futuro previsto/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Assim que houver parcelas ou recorr.ncias futuras/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Posi/i)).not.toBeInTheDocument();
  });
});
