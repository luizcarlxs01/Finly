import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Transaction } from "@/types/finance";
import { getTodayDateValue } from "@/utils/recurring-transactions";
import { DashboardTransactionsView } from "@/components/dashboard/views/dashboard-transactions-view";

beforeEach(() => {
  window.localStorage.clear();
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});
afterEach(() => vi.unstubAllGlobals());
function createTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "tx-1",
    title: "Mercado",
    amount: 200,
    type: "expense",
    category: "alimentacao",
    transactionKind: "single",
    sourceId: null,
    occurrenceDate: getTodayDateValue(),
    installmentIndex: null,
    installmentCount: null,
    installmentStartDate: null,
    recurringSourceId: null,
    recurringOccurrenceDate: null,
    isRecurring: false,
    recurrenceType: null,
    recurrenceMode: null,
    recurrenceDay: null,
    recurrenceStartDate: null,
    recurrenceEndDate: null,
    recurrenceMonths: null,
    lastGeneratedAt: null,
    createdAt: "2026-04-01T12:00:00.000Z",
    ...overrides,
  };
}

function renderDashboardTransactionsView(
  overrides: Partial<React.ComponentProps<typeof DashboardTransactionsView>> = {},
) {
  const filteredTransactions = [
    createTransaction(),
    createTransaction({
      id: "tx-2",
      title: "Salário",
      amount: 3000,
      type: "income",
      category: "salario",
    }),
  ];

  const props: React.ComponentProps<typeof DashboardTransactionsView> = {
    transactionFilter: "all",
    onTransactionFilterChange: vi.fn(),
    searchTerm: "",
    onSearchTermChange: vi.fn(),
    categoryFilter: "all",
    onCategoryFilterChange: vi.fn(),
    sortOption: "newest",
    onSortOptionChange: vi.fn(),
    filteredTransactions,
    statementTransactions: filteredTransactions,
    hasActiveAdvancedFilters: false,
    onClearAdvancedFilters: vi.fn(),
    onAddTransaction: vi.fn(),
    onPreviewTransaction: vi.fn(),
    onClearPreview: vi.fn(),
    isPreviewActive: false,
    onEditTransaction: vi.fn(),
    onRemoveTransaction: vi.fn(),
    getNextRecurringOccurrence: vi.fn(() => null),
    emptyStateTitle: "Nenhuma transação",
    emptyStateDescription: "Cadastre itens para começar.",
    onOpenCalendar: vi.fn(),
    onOpenStatementProjection: vi.fn(),
    initialBalance: 1000,
    totalIncome: 3000,
    totalExpense: 200,
    currentBalance: 2800,
    forecastTotalIncome: 3200,
    forecastTotalExpense: 450,
    forecastProjectedBalance: 3750,
    onUpdateInitialBalance: vi.fn(),
    ...overrides,
  };

  return {
    ...render(<DashboardTransactionsView {...props} />),
    props,
  };
}


describe("Lançamentos redesenhado", () => {
  it("mostra indicadores reais do mês e oculta todos os valores da tela", async () => {
    const date = getTodayDateValue();
    const items = [createTransaction({ id: "income", amount: 100, type: "income", occurrenceDate: date, occurrenceStatus: "paid" }), createTransaction({ id: "expense", amount: 30, occurrenceDate: date, occurrenceStatus: "paid" }), createTransaction({ id: "future", amount: 80, occurrenceDate: date, occurrenceStatus: "pending" })];
    renderDashboardTransactionsView({ statementTransactions: items, filteredTransactions: items });
    const summary = screen.getByRole("region", { name: "Indicadores financeiros" });
    expect(screen.queryByRole("button", { name: "Abrir resumo financeiro" })).not.toBeInTheDocument();
    expect(within(summary).getByText(/100,00/)).toBeInTheDocument();
    expect(within(summary).getByText(/30,00/)).toBeInTheDocument();
    expect(within(summary).getByText(/70,00/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Ocultar valores" }));
    expect(within(summary).queryByText(/100,00/)).not.toBeInTheDocument();
    expect(within(screen.getByRole("table")).getAllByText("••••••")).toHaveLength(3);
    expect(localStorage.getItem("finly:dashboard-values-hidden")).toBe("true");
  });
  it("preserva busca, filtros, projeção e alterna a ordenação pelos cabeçalhos", async () => {
    const user = userEvent.setup();
    const { props, rerender } = renderDashboardTransactionsView();
    expect(screen.getByRole("columnheader", { name: "Data" })).toHaveAttribute("aria-sort", "descending");
    await user.click(screen.getByRole("button", { name: "Data" }));
    expect(props.onSortOptionChange).toHaveBeenLastCalledWith("oldest");
    await user.click(screen.getByRole("button", { name: "Valor" }));
    expect(props.onSortOptionChange).toHaveBeenLastCalledWith("highest");
    rerender(<DashboardTransactionsView {...props} sortOption="highest" />);
    expect(screen.getByRole("columnheader", { name: "Data" })).toHaveAttribute("aria-sort", "none");
    expect(screen.getByRole("columnheader", { name: "Valor" })).toHaveAttribute("aria-sort", "descending");
    await user.click(screen.getByRole("button", { name: "Valor" }));
    expect(props.onSortOptionChange).toHaveBeenLastCalledWith("lowest");
    await user.type(screen.getByRole("searchbox"), "a");
    expect(props.onSearchTermChange).toHaveBeenCalledWith("a");
    await user.click(screen.getByRole("button", { name: "Entradas" }));
    expect(props.onTransactionFilterChange).toHaveBeenCalledWith("income");
    await user.click(screen.getByRole("button", { name: "Filtros do extrato" }));
    await user.selectOptions(screen.getByLabelText("Categoria"), "educacao");
    expect(props.onCategoryFilterChange).toHaveBeenCalledWith("educacao");
    await user.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(props.onClearAdvancedFilters).toHaveBeenCalledOnce();
    await user.click(screen.getByRole("button", { name: "Ver projeção" }));
    expect(props.onOpenStatementProjection).toHaveBeenCalledOnce();
  });
  it("calcula o marcador misto, limita a prévia a dois itens e abre o dia ou o mês correto", async () => {
    const date = getTodayDateValue();
    const rows = [createTransaction({ id: "1", title: "Entrada", type: "income", occurrenceDate: date }), createTransaction({ id: "2", title: "Saída A", occurrenceDate: date }), createTransaction({ id: "3", title: "Saída B", occurrenceDate: date })];
    const { props } = renderDashboardTransactionsView({ statementTransactions: rows, filteredTransactions: rows });
    const calendar = screen.getByRole("region", { name: "Calendário compacto" });
    expect(calendar.querySelector('[data-kind="both"]')).toBeInTheDocument();
    expect(within(calendar).getAllByRole("listitem")).toHaveLength(2);
    expect(within(calendar).getByRole("button", { name: "+1 lançamento · Ver todos" })).toBeInTheDocument();
    expect(within(calendar).queryByText("Saída B")).not.toBeInTheDocument();
    const anotherDay = Number(date.slice(-2)) === 1 ? 2 : 1;
    const otherButton = within(calendar).getByRole("button", { name: new RegExp("^" + anotherDay + " de ") });
    await userEvent.click(otherButton);
    expect(otherButton).toHaveAttribute("aria-pressed", "true");
    expect(props.onOpenCalendar).not.toHaveBeenCalled();
    expect(within(calendar).getByText("Nenhum lançamento nesta data.")).toBeInTheDocument();
    await userEvent.click(otherButton);
    expect(props.onOpenCalendar).toHaveBeenCalledOnce();
    expect(props.onOpenCalendar).toHaveBeenLastCalledWith(date.slice(0, 8) + String(anotherDay).padStart(2, "0"));
    vi.mocked(props.onOpenCalendar).mockClear();
    await userEvent.click(within(calendar).getByRole("heading", { level: 2 }));
    await userEvent.click(calendar);
    expect(props.onOpenCalendar).not.toHaveBeenCalled();
    await userEvent.click(within(calendar).getByRole("button", { name: "Abrir calendário pelos dias da semana" }));
    expect(props.onOpenCalendar).toHaveBeenCalledOnce();
    vi.mocked(props.onOpenCalendar).mockClear();
    await userEvent.click(within(calendar).getByRole("button", { name: new RegExp("^" + Number(date.slice(-2)) + " de .*entradas e saídas") }));
    expect(props.onOpenCalendar).not.toHaveBeenCalled();
    expect(within(calendar).getAllByRole("listitem")).toHaveLength(2);
    await userEvent.click(within(calendar).getByRole("button", { name: new RegExp("^" + Number(date.slice(-2)) + " de .*entradas e saídas") }));
    expect(props.onOpenCalendar).toHaveBeenLastCalledWith(date);
    expect(within(calendar).queryByRole("button", { name: /mês no calendário compacto/i })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Mês de referência:/ }));
    fireEvent.change(screen.getByLabelText("Mês de referência"), { target: { value: "2027-02" } });
    expect(within(calendar).getByRole("heading", { level: 2 })).toHaveTextContent("fevereiro de 2027");
    expect(within(screen.getByRole("table")).queryByText("Entrada")).not.toBeInTheDocument();
    await userEvent.click(within(calendar).getByRole("heading", { level: 2 }));
    expect(props.onOpenCalendar).toHaveBeenLastCalledWith(date);
    await userEvent.click(within(calendar).getByRole("button", { name: /^1 de fevereiro/ }));
    expect(props.onOpenCalendar).toHaveBeenLastCalledWith("2027-02-01");
    await userEvent.click(screen.getByRole("button", { name: /Mês de referência:/ }));
    await userEvent.click(screen.getByRole("button", { name: "Todos os meses" }));
    expect(within(screen.getByRole("table")).getByText("Entrada")).toBeInTheDocument();
  });
  it("abre a criação completa e mantém as ações dos lançamentos", async () => {
    const user = userEvent.setup();
    const { props } = renderDashboardTransactionsView();
    await user.click(screen.getByRole("button", { name: "Opções de Mercado" }));
    await user.click(screen.getByRole("menuitem", { name: "Editar" }));
    expect(props.onEditTransaction).toHaveBeenCalledWith(props.filteredTransactions[0]);
    await user.click(screen.getByRole("button", { name: "Opções de Mercado" }));
    await user.click(screen.getByRole("menuitem", { name: "Remover" }));
    expect(props.onRemoveTransaction).toHaveBeenCalledWith("tx-1");
    await user.click(screen.getByRole("button", { name: "Novo lançamento" }));
    const dialog = screen.getByRole("dialog", { name: "Novo lançamento" });
    for (const name of ["Único", "Parcelado", "Recorrente"]) expect(within(dialog).getByRole("button", { name })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Simular impacto" })).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Fechar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});


