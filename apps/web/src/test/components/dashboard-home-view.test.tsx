import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Transaction } from "@/types/transaction";
import { DashboardHomeView } from "@/components/dashboard/views/dashboard-home-view";

vi.mock("@/utils/recurring-transactions", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/utils/recurring-transactions")>(),
  getTodayDateValue: () => "2026-09-28",
}));

vi.mock("@/components/visuals/orb", () => ({ default: () => <div data-testid="balance-orb" /> }));

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
  }]} onViewTransactions={onViewTransactions} onViewGoals={onViewGoals} onViewInsights={vi.fn()} {...overrides} />);
  return { onViewTransactions, onViewGoals, ...rendered };
}

describe("DashboardHomeView", () => {
  beforeEach(() => {
    window.localStorage.removeItem("finly:dashboard-values-hidden");
  });

  it("organiza a visão geral com saldo central, metas, transações e fluxo de caixa", () => {
    renderHome();
    expect(screen.getByRole("heading", { name: "Visão geral" })).toBeVisible();
    expect(screen.getByText("Suas finanças em um só lugar")).toBeVisible();
    expect(screen.getByTestId("balance-orb")).toBeInTheDocument();
    expect(screen.queryByText("Receitas e despesas de cada mês")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Ver metas|Ver transações|Ocultar valores/ })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Resumo de metas" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Transações Recentes" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Fluxo de Caixa" })).toBeInTheDocument();
  });

  it("mostra o saldo até hoje, exclui futuras e ordena transações pagas", () => {
    renderHome();
    const home = screen.getByRole("region", { name: "Início" });
    expect(within(home).getByRole("heading", { name: "Visão geral" })).toBeInTheDocument();
    expect(home.textContent).toContain("R$ 570,00");
    expect(home.textContent).toContain("R$ 500,00");
    expect(within(home).getByText("25%")).toBeInTheDocument();
    const recent = screen.getByRole("region", { name: "Transações Recentes" });
    expect(within(recent).queryByText("Parcela futura")).not.toBeInTheDocument();
    expect(within(recent).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      expect.stringContaining("Salário"),
      expect.stringContaining("Mercado"),
      expect.stringContaining("Receita antiga"),
    ]);
  });

  it("mostra o insight positivo somente quando o saldo cobre ao menos o dobro das despesas do mês", () => {
    const { rerender } = renderHome({ currentBalance: 500, postedTransactions: [transaction("expense", "Mercado", 100, "expense", "2026-09-20")] });
    const insight = screen.getByRole("region", { name: "Insight do saldo" });
    expect(insight).toHaveTextContent("Saldo saudável");
    expect(insight).toHaveTextContent("Bom sinal");

    rerender(<DashboardHomeView currentBalance={150} postedTransactions={[transaction("expense", "Mercado", 100, "expense", "2026-09-20")]} goals={[]} onViewTransactions={vi.fn()} onViewGoals={vi.fn()} onViewInsights={vi.fn()} />);
    expect(insight).toHaveTextContent("Acompanhe o saldo");
    expect(insight).not.toHaveTextContent("Saldo saudável");
    expect(insight).not.toHaveTextContent("Bom sinal");
  });

  it("não conclui que o saldo é saudável sem despesas no mês", () => {
    renderHome({ currentBalance: 500, postedTransactions: [] });
    const insight = screen.getByRole("region", { name: "Insight do saldo" });
    expect(insight).toHaveTextContent("Saldo sem comparação");
    expect(insight).toHaveTextContent("Sem dados");
    expect(insight).not.toHaveTextContent("Saldo saudável");
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

  it("alterna a esfera entre saldo e resultado do mês sem incluir outros meses ou futuras", async () => {
    const user = userEvent.setup();
    renderHome({ postedTransactions: [...entries, transaction("sep-expense", "Conta", 125, "expense", "2026-09-25")] });
    const sphere = screen.getByRole("button", { name: "Saldo atual. Mostrar resultado do mês" });
    expect(sphere.textContent).toContain("R$ 570,00");
    await user.click(screen.getByTestId("balance-orb"));
    expect(sphere).toHaveAttribute("aria-pressed", "true");
    expect(sphere.textContent).toContain("Resultado do mês");
    expect(sphere.textContent).toContain("R$ 375,00");
    await user.click(screen.getByRole("button", { name: "YTD" }));
    expect(sphere.textContent).toContain("R$ 375,00");
    sphere.focus();
    await user.keyboard("{Enter}");
    expect(sphere).toHaveAttribute("aria-pressed", "false");
    expect(sphere.textContent).toContain("R$ 570,00");
  });

  it("mantém o resultado mensal oculto ao alternar a esfera com privacidade ativa", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem("finly:dashboard-values-hidden", "true");
    renderHome();
    const sphere = screen.getByRole("button", { name: "Saldo atual. Mostrar resultado do mês" });
    await user.click(sphere);
    expect(sphere.textContent).toContain("Resultado do mês");
    expect(sphere.textContent).toContain("••••••");
    expect(sphere.textContent).not.toContain("R$");
  });

  it("preserva a preferência de privacidade sem exibir os controles removidos", () => {
    window.localStorage.setItem("finly:dashboard-values-hidden", "true");
    const firstRender = renderHome();
    expect(screen.queryByTestId("cashflow-data")).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Gráfico com valores ocultos" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Início" }).textContent).not.toContain("R$ 570,00");
    expect(screen.queryByText("25%")).not.toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Progresso de Reserva" })).not.toHaveAttribute("aria-valuenow");
    firstRender.unmount();
    renderHome();
    expect(screen.getByRole("img", { name: "Gráfico com valores ocultos" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Mostrar valores|Ocultar valores|Ver metas|Ver transações/ })).not.toBeInTheDocument();
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
