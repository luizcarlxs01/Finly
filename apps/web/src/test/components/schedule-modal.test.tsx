import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/components/dashboard/upcoming-transactions", () => ({
  UpcomingTransactions: ({
    monthGroups,
  }: {
    monthGroups: Array<{
      id: string;
      monthLabel: string;
      items: Array<{ id: string; title: string; marker: string }>;
    }>;
  }) => {
    const hasItems = monthGroups.some((group) => group.items.length > 0);

    if (!hasItems) {
      return (
        <div>
          <p>Nenhum lançamento futuro previsto</p>
          <p>
            Assim que houver parcelas ou recorrências futuras, elas aparecerão
            organizadas aqui por mês.
          </p>
        </div>
      );
    }

    return (
      <div>
        <p>Agenda com {monthGroups.length} meses</p>
        {monthGroups.map((group) => (
          <div key={group.id}>
            <p>{group.monthLabel}</p>
            {group.items.map((item) => (
              <div key={item.id}>
                <p>{item.title}</p>
                <p>{item.marker}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  },
}));

import { ScheduleModal } from "@/components/dashboard/overlays/schedule-modal";
import type { UpcomingTransactionsMonthGroup } from "@/utils/upcoming-transactions";

function createMonthGroup(
  overrides: Partial<UpcomingTransactionsMonthGroup> = {},
): UpcomingTransactionsMonthGroup {
  return {
    id: "2026-05-01",
    monthLabel: "maio de 2026",
    monthDate: "2026-05-01",
    items: [
      {
        id: "item-1",
        title: "Academia",
        amount: 120,
        type: "expense",
        occurrenceDate: "2026-05-10",
        marker: "Recorrente",
        sourceKind: "recurring-instance",
      },
    ],
    totalIncome: 0,
    totalExpense: 120,
    projectedBalance: 880,
    balanceTone: "positive",
    balanceSummary: "Mês com folga prevista.",
    ...overrides,
  };
}

function renderScheduleModal(
  overrides: Partial<React.ComponentProps<typeof ScheduleModal>> = {},
) {
  const props: React.ComponentProps<typeof ScheduleModal> = {
    open: true,
    onClose: vi.fn(),
    monthGroups: [createMonthGroup()],
    ...overrides,
  };

  return {
    ...render(<ScheduleModal {...props} />),
    props,
  };
}

describe("ScheduleModal", () => {
  it("deve nao renderizar conteudo relevante quando estiver fechado", () => {
    renderScheduleModal({ open: false });

    expect(screen.queryByText("Agenda")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Fechar" }),
    ).not.toBeInTheDocument();
  });

  it("deve renderizar o modal aberto com os textos principais e os itens recebidos", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderScheduleModal({
      onClose,
      monthGroups: [
        createMonthGroup(),
        createMonthGroup({
          id: "2026-06-01",
          monthLabel: "junho de 2026",
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
      ],
    });

    expect(screen.getByText("Agenda")).toBeInTheDocument();
    expect(
      screen.getByText("Veja o que está previsto para os próximos meses."),
    ).toBeInTheDocument();
    expect(screen.getByText("Próximos lançamentos")).toBeInTheDocument();
    expect(
      screen.getByText("Uma visão simples do que está por vir."),
    ).toBeInTheDocument();
    expect(screen.getByText("Agenda com 2 meses")).toBeInTheDocument();
    expect(screen.getByText("maio de 2026")).toBeInTheDocument();
    expect(screen.getByText("junho de 2026")).toBeInTheDocument();
    expect(screen.getByText("Academia")).toBeInTheDocument();
    expect(screen.getByText("Recorrente")).toBeInTheDocument();
    expect(screen.getByText("Parcela notebook")).toBeInTheDocument();
    expect(screen.getByText("Parcela 2/10")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Fechar" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("deve renderizar de forma estavel com dados minimos validos", () => {
    renderScheduleModal({
      monthGroups: [
        createMonthGroup({
          items: [
            {
              id: "item-minimal",
              title: "Receita prevista",
              amount: 1,
              type: "income",
              occurrenceDate: "2026-05-01",
              marker: "Recorrente indefinido",
              sourceKind: "recurring-instance",
            },
          ],
        }),
      ],
    });

    expect(screen.getByText("Agenda com 1 meses")).toBeInTheDocument();
    expect(screen.getByText("Receita prevista")).toBeInTheDocument();
    expect(screen.getByText("Recorrente indefinido")).toBeInTheDocument();
  });

  it("deve exibir fallback visual quando nao houver itens previstos", () => {
    renderScheduleModal({
      monthGroups: [
        createMonthGroup({
          id: "empty-1",
          monthLabel: "maio de 2026",
          items: [],
        }),
      ],
    });

    expect(
      screen.getByText("Nenhum lançamento futuro previsto"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Assim que houver parcelas ou recorrências futuras, elas aparecerão organizadas aqui por mês.",
      ),
    ).toBeInTheDocument();
  });
});
