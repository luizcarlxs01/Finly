import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Transaction } from "@/types/transaction";
import { DashboardHomeView } from "@/components/dashboard/views/dashboard-home-view";

vi.mock("@/utils/recurring-transactions", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/utils/recurring-transactions")>(),
  getTodayDateValue: () => "2026-09-28",
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ComposedChart: ({ data, children }: { data: unknown; children: React.ReactNode }) =>
    <div data-testid="cashflow-data" data-values={JSON.stringify(data)}>{children}</div>,
  Area: () => null,
  CartesianGrid: () => null,
  Line: () => null,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

function transaction(id: string, title: string, amount: number, type: "income" | "expense", date: string): Transaction {
  return {
    id, title, amount, type, category: "geral", transactionKind: "single",
    sourceId: null, occurrenceDate: date, installmentIndex: null, installmentCount: null,
    installmentStartDate: null, recurringSourceId: null, recurringOccurrenceDate: null,
    isRecurring: false, recurrenceType: null, recurrenceMode: null, recurrenceDay: null,
    recurrenceStartDate: null, recurrenceEndDate: null, recurrenceMonths: null,
    lastGeneratedAt: null, createdAt: `${date}T12:00:00`, occurrenceStatus: "paid",
  };
}

const entries = [
  transaction("jan", "Receita antiga", 100, "income", "2026-01-05"),
  transaction("aug", "Mercado", 30, "expense", "2026-08-10"),
  transaction("sep", "Salário", 500, "income", "2026-09-20"),
  transaction("future", "Parcela futura", 200, "expense", "2026-10-02"),
];

function renderHome(overrides: Partial<React.ComponentProps<typeof DashboardHomeView>> = {}) {
  const onViewTransactions = vi.fn();
  const onViewGoals = vi.fn();
  const rendered = render(<DashboardHomeView currentBalance={370} postedTransactions={entries} goals={[{
    id: "goal", title: "Reserva", currentAmount: 250, targetAmount: 1000,
    category: "geral", createdAt: "2026-01-01",
  }]} onViewTransactions={onViewTransactions} onViewGoals={onViewGoals} {...overrides} />);
  return { onViewTransactions, onViewGoals, ...rendered };
}

describe("DashboardHomeView", () => {
  beforeEach(() => {
    window.localStorage.removeItem("finly:dashboard-values-hidden");
  });

  it("remove os subtítulos solicitados e alinha os quatro valores à esquerda", () => {
    renderHome();
    expect(screen.queryByText(/Acompanhe suas finanças em/)).not.toBeInTheDocument();
    expect(screen.queryByText("Até hoje, sem lançamentos futuros")).not.toBeInTheDocument();
    expect(screen.queryByText("setembro de 2026")).not.toBeInTheDocument();
    expect(screen.queryByText("Receitas menos despesas do mês")).not.toBeInTheDocument();
    expect(screen.getByText("Receitas e despesas de cada mês")).toBeInTheDocument();
    expect(screen.queryByText("Receitas e despesas de cada mês, não acumuladas")).not.toBeInTheDocument();
    expect(screen.queryByText("Últimas movimentações pagas até hoje")).not.toBeInTheDocument();

    for (const title of ["Saldo atual", "Receitas do mês", "Despesas do mês", "Resultado do mês"]) {
      const card = screen.getByText(title).parentElement?.parentElement;
      const value = card?.querySelectorAll("p")[1];
      expect(value).toBeInTheDocument();
      expect(value).not.toHaveClass("text-center");
    }
  });

  it("mostra indicadores até hoje, exclui futuras e ordena transações pagas", () => {
    renderHome();
    const home = screen.getByRole("region", { name: "Início" });
    expect(within(home).getByRole("heading", { name: "Visão Geral" })).toBeInTheDocument();
    expect(home.textContent).toContain("R$ 570,00");
    expect(home.textContent).toContain("R$ 500,00");
    expect(home.textContent).toContain("R$ 0,00");
    expect(within(home).getByText("25%")).toBeInTheDocument();
    const recent = screen.getByRole("region", { name: "Transações Recentes" });
    expect(within(recent).queryByText("Parcela futura")).not.toBeInTheDocument();
    expect(within(recent).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      expect.stringContaining("Salário"),
      expect.stringContaining("Mercado"),
      expect.stringContaining("Receita antiga"),
    ]);
  });

  it("altera os meses e dados do fluxo de caixa", async () => {
    const user = userEvent.setup();
    renderHome();
    const readChart = () => JSON.parse(screen.getByTestId("cashflow-data").getAttribute("data-values")!);
    expect(readChart()).toHaveLength(6);
    expect(readChart().at(-1)).toMatchObject({ key: "2026-09", income: 500, expense: 0 });
    await user.click(screen.getByRole("button", { name: "YTD" }));
    expect(readChart()).toHaveLength(9);
    expect(readChart()[0]).toMatchObject({ key: "2026-01", income: 100 });
    await user.click(screen.getByRole("button", { name: "1A" }));
    expect(readChart()).toHaveLength(12);
    expect(readChart().at(-1).key).toBe("2026-09");
  });

  it("oculta valores, gráfico, progresso e permite navegar", async () => {
    const user = userEvent.setup();
    const callbacks = renderHome();
    await user.click(screen.getByRole("button", { name: "Ocultar valores" }));
    expect(screen.queryByTestId("cashflow-data")).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Gráfico com valores ocultos" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Início" }).textContent).not.toContain("R$ 570,00");
    expect(screen.queryByText("25%")).not.toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Progresso de Reserva" })).not.toHaveAttribute("aria-valuenow");
    await user.click(screen.getByRole("button", { name: "Ver todas as transações" }));
    await user.click(screen.getByRole("button", { name: "Ver metas" }));
    expect(callbacks.onViewTransactions).toHaveBeenCalledOnce();
    expect(callbacks.onViewGoals).toHaveBeenCalledOnce();
  });

  it("persiste a preferência de ocultar valores ao reabrir a Visão Geral", async () => {
    const user = userEvent.setup();
    const firstRender = renderHome();
    await user.click(screen.getByRole("button", { name: "Ocultar valores" }));
    expect(window.localStorage.getItem("finly:dashboard-values-hidden")).toBe("true");
    firstRender.unmount();

    renderHome();
    expect(screen.getByRole("button", { name: "Mostrar valores" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("img", { name: "Gráfico com valores ocultos" })).toBeInTheDocument();
  });

  it("mostra estados vazios", () => {
    renderHome({ postedTransactions: [], goals: [] });
    expect(screen.getByText("Nenhuma transação paga até hoje.")).toBeInTheDocument();
    expect(screen.getByText("Nenhuma meta cadastrada.")).toBeInTheDocument();
    expect(screen.getByText("Sem movimentações pagas neste período.")).toBeInTheDocument();
  });

  it("não apresenta zeros como dados reais quando a consulta falha", () => {
    renderHome({ errorMessage: "Não foi possível carregar os dados." });
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível carregar os dados.");
    expect(screen.queryByText("Saldo atual")).not.toBeInTheDocument();
  });
});
