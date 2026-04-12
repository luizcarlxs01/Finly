import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { LocalFinanceTransactionInput } from "@/hooks/use-local-finance";
import type { Transaction } from "@/types/finance";
import type { UpcomingTransactionsMonthGroup } from "@/utils/upcoming-transactions";

vi.mock("@/components/dashboard/finance-summary-card", () => ({
  FinanceSummaryCard: ({
    initialBalance,
    totalIncome,
    totalExpense,
    currentBalance,
  }: {
    initialBalance: number;
    totalIncome: number;
    totalExpense: number;
    currentBalance: number;
  }) => (
    <div>
      <p>FinanceSummaryCard</p>
      <p>Inicial: {initialBalance}</p>
      <p>Entradas: {totalIncome}</p>
      <p>Saídas: {totalExpense}</p>
      <p>Saldo: {currentBalance}</p>
    </div>
  ),
}));

vi.mock("@/components/dashboard/transaction-form", () => ({
  TransactionForm: ({
    initialBalance,
    onUpdateInitialBalance,
    onAddTransaction,
    onPreviewTransaction,
    onClearPreview,
    isPreviewActive,
    showPreviewNotice,
  }: {
    initialBalance: number;
    onUpdateInitialBalance: (value: number) => void;
    onAddTransaction: (input: LocalFinanceTransactionInput) => void;
    onPreviewTransaction: (input: LocalFinanceTransactionInput) => void;
    onClearPreview: () => void;
    isPreviewActive: boolean;
    showPreviewNotice?: boolean;
  }) => {
    const sampleInput: LocalFinanceTransactionInput = {
      title: "Teste",
      amount: 10,
      type: "expense",
      category: "geral",
      transactionKind: "single",
      transactionDate: "2026-04-10",
      isRecurring: false,
      recurrenceType: null,
      recurrenceDay: null,
      recurrenceStartDate: null,
    };

    return (
      <div>
        <p>TransactionForm</p>
        <p>Saldo inicial form: {initialBalance}</p>
        <p>Preview ativo form: {String(isPreviewActive)}</p>
        <p>Preview notice form: {String(showPreviewNotice)}</p>
        <button type="button" onClick={() => onUpdateInitialBalance(123)}>
          Trigger update balance
        </button>
        <button type="button" onClick={() => onAddTransaction(sampleInput)}>
          Trigger add transaction
        </button>
        <button type="button" onClick={() => onPreviewTransaction(sampleInput)}>
          Trigger preview transaction
        </button>
        <button type="button" onClick={onClearPreview}>
          Trigger clear preview form
        </button>
      </div>
    );
  },
}));

vi.mock("@/components/dashboard/overlays/statement-projection-modal", () => ({
  StatementProjectionModal: ({
    open,
    onClose,
    transactionFilter,
    onTransactionFilterChange,
    searchTerm,
    onSearchTermChange,
    categoryFilter,
    onCategoryFilterChange,
    sortOption,
    onSortOptionChange,
    filteredTransactions,
    statementTransactions,
    hasActiveAdvancedFilters,
    onClearAdvancedFilters,
    onEditTransaction,
    onRemoveTransaction,
    emptyStateTitle,
    emptyStateDescription,
  }: {
    open: boolean;
    onClose: () => void;
    transactionFilter: string;
    onTransactionFilterChange: (value: any) => void;
    searchTerm: string;
    onSearchTermChange: (value: string) => void;
    categoryFilter: string;
    onCategoryFilterChange: (value: string) => void;
    sortOption: string;
    onSortOptionChange: (value: any) => void;
    filteredTransactions: Transaction[];
    statementTransactions: Transaction[];
    hasActiveAdvancedFilters: boolean;
    onClearAdvancedFilters: () => void;
    onEditTransaction: (transaction: Transaction) => void;
    onRemoveTransaction: (id: string) => void;
    emptyStateTitle: string;
    emptyStateDescription: string;
  }) =>
    open ? (
      <div>
        <p>StatementProjectionModal</p>
        <p>Filtro modal: {transactionFilter}</p>
        <p>Busca modal: {searchTerm}</p>
        <p>Categoria modal: {categoryFilter}</p>
        <p>Ordenação modal: {sortOption}</p>
        <p>Filtros ativos modal: {String(hasActiveAdvancedFilters)}</p>
        <p>{emptyStateTitle}</p>
        <p>{emptyStateDescription}</p>
        <p>Filtradas: {filteredTransactions.length}</p>
        <p>Extrato: {statementTransactions.length}</p>
        <button type="button" onClick={onClose}>
          Close statement modal
        </button>
        <button type="button" onClick={() => onTransactionFilterChange("income")}>
          Change filter
        </button>
        <button type="button" onClick={() => onSearchTermChange("mercado")}>
          Change search
        </button>
        <button type="button" onClick={() => onCategoryFilterChange("moradia")}>
          Change category
        </button>
        <button type="button" onClick={() => onSortOptionChange("highest")}>
          Change sort
        </button>
        <button type="button" onClick={onClearAdvancedFilters}>
          Clear advanced filters
        </button>
        <button
          type="button"
          onClick={() => filteredTransactions[0] && onEditTransaction(filteredTransactions[0])}
        >
          Edit first filtered
        </button>
        <button
          type="button"
          onClick={() =>
            filteredTransactions[0] && onRemoveTransaction(filteredTransactions[0].id)
          }
        >
          Remove first filtered
        </button>
      </div>
    ) : null,
}));

vi.mock("@/components/dashboard/overlays/schedule-modal", () => ({
  ScheduleModal: ({
    open,
    onClose,
    monthGroups,
  }: {
    open: boolean;
    onClose: () => void;
    monthGroups: UpcomingTransactionsMonthGroup[];
  }) =>
    open ? (
      <div>
        <p>ScheduleModal</p>
        <p>{monthGroups[0]?.monthLabel ?? "Sem grupos"}</p>
        <button type="button" onClick={onClose}>
          Close schedule modal
        </button>
      </div>
    ) : null,
}));

import { DashboardTransactionsView } from "@/components/dashboard/views/dashboard-transactions-view";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function getByExactText(value: string) {
  return screen.getByText(
    (_, element) =>
      element?.textContent === value && (element.children.length ?? 0) === 0,
  );
}

function createTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "tx-1",
    title: "Mercado",
    amount: 200,
    type: "expense",
    category: "alimentacao",
    transactionKind: "single",
    sourceId: null,
    occurrenceDate: null,
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

function createUpcomingGroup(
  overrides: Partial<UpcomingTransactionsMonthGroup> = {},
): UpcomingTransactionsMonthGroup {
  return {
    id: "2026-05",
    monthLabel: "maio de 2026",
    monthDate: "2026-05-01",
    items: [],
    totalIncome: 1000,
    totalExpense: 300,
    projectedBalance: 700,
    balanceTone: "positive",
    balanceSummary: "Saldo positivo",
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
    initialBalance: 1000,
    totalIncome: 3000,
    totalExpense: 200,
    currentBalance: 3800,
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
    onUpdateInitialBalance: vi.fn(),
    onAddTransaction: vi.fn(),
    onPreviewTransaction: vi.fn(),
    onClearPreview: vi.fn(),
    isPreviewActive: false,
    onEditTransaction: vi.fn(),
    onRemoveTransaction: vi.fn(),
    getNextRecurringOccurrence: vi.fn(() => null),
    emptyStateTitle: "Nenhuma transação",
    emptyStateDescription: "Cadastre itens para começar.",
    forecastTotalIncome: 3200,
    forecastTotalExpense: 450,
    forecastProjectedBalance: 3750,
    upcomingMonthGroups: [createUpcomingGroup()],
    ...overrides,
  };

  return {
    ...render(<DashboardTransactionsView {...props} />),
    props,
  };
}

describe("DashboardTransactionsView", () => {
  it("deve renderizar os blocos principais da view com dados completos", () => {
    renderDashboardTransactionsView();

    expect(screen.getByText("Lançamentos")).toBeInTheDocument();
    expect(screen.getByText("Novo lançamento")).toBeInTheDocument();
    expect(screen.getByText("Resumo rápido")).toBeInTheDocument();
    expect(screen.getAllByText("Extrato").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Agenda").length).toBeGreaterThan(0);
    expect(screen.getByText("FinanceSummaryCard")).toBeInTheDocument();
    expect(screen.getByText("TransactionForm")).toBeInTheDocument();
    expect(screen.getByText("Inicial: 1000")).toBeInTheDocument();
    expect(screen.getByText("Entradas: 3000")).toBeInTheDocument();
    expect(screen.getByText("Saídas: 200")).toBeInTheDocument();
    expect(getByExactText(currencyFormatter.format(3750))).toBeInTheDocument();
    expect(getByExactText(currencyFormatter.format(3200))).toBeInTheDocument();
    expect(getByExactText(currencyFormatter.format(450))).toBeInTheDocument();
    expect(screen.getByText("maio de 2026")).toBeInTheDocument();
  });

  it("deve renderizar de forma estavel com dados minimos validos e fallback sem proximos lancamentos", () => {
    renderDashboardTransactionsView({
      filteredTransactions: [],
      statementTransactions: [],
      forecastTotalIncome: 0,
      forecastTotalExpense: 0,
      forecastProjectedBalance: 0,
      upcomingMonthGroups: [],
      isPreviewActive: false,
    });

    expect(screen.getByText("Simule antes de salvar")).toBeInTheDocument();
    expect(
      screen.getByText('Use "Simular impacto" para ver como esse lançamento pode ficar.'),
    ).toBeInTheDocument();
    expect(screen.getByText("Sem lançamentos previstos")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Quando houver parcelas ou recorrências, elas aparecem aqui.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("Limpar simulação")).not.toBeInTheDocument();
  });

  it("deve refletir o estado condicional de simulacao ativa e permitir limpá-la", async () => {
    const user = userEvent.setup();
    const onClearPreview = vi.fn();

    renderDashboardTransactionsView({
      isPreviewActive: true,
      onClearPreview,
    });

    expect(screen.getByText("Simulação ativa")).toBeInTheDocument();
    expect(
      screen.getByText("Os valores abaixo já mostram esse impacto."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Limpar simulação" }));

    expect(onClearPreview).toHaveBeenCalledTimes(1);
  });

  it("deve disparar callbacks expostos pela view e integrar os filhos no nivel da interface", async () => {
    const user = userEvent.setup();
    const onUpdateInitialBalance = vi.fn();
    const onAddTransaction = vi.fn();
    const onPreviewTransaction = vi.fn();
    const onClearPreview = vi.fn();
    const onTransactionFilterChange = vi.fn();
    const onSearchTermChange = vi.fn();
    const onCategoryFilterChange = vi.fn();
    const onSortOptionChange = vi.fn();
    const onClearAdvancedFilters = vi.fn();
    const onEditTransaction = vi.fn();
    const onRemoveTransaction = vi.fn();

    renderDashboardTransactionsView({
      onUpdateInitialBalance,
      onAddTransaction,
      onPreviewTransaction,
      onClearPreview,
      onTransactionFilterChange,
      onSearchTermChange,
      onCategoryFilterChange,
      onSortOptionChange,
      onClearAdvancedFilters,
      onEditTransaction,
      onRemoveTransaction,
      hasActiveAdvancedFilters: true,
      searchTerm: "merc",
      categoryFilter: "alimentacao",
      transactionFilter: "expense",
      sortOption: "highest",
      emptyStateTitle: "Nada encontrado",
      emptyStateDescription: "Ajuste os filtros.",
    });

    await user.click(screen.getByRole("button", { name: "Trigger update balance" }));
    await user.click(screen.getByRole("button", { name: "Trigger add transaction" }));
    await user.click(screen.getByRole("button", { name: "Trigger preview transaction" }));
    await user.click(screen.getByRole("button", { name: "Extrato" }));

    expect(screen.getByText("StatementProjectionModal")).toBeInTheDocument();
    expect(screen.getByText("Filtro modal: expense")).toBeInTheDocument();
    expect(screen.getByText("Busca modal: merc")).toBeInTheDocument();
    expect(screen.getByText("Categoria modal: alimentacao")).toBeInTheDocument();
    expect(screen.getByText("Ordenação modal: highest")).toBeInTheDocument();
    expect(screen.getByText("Filtros ativos modal: true")).toBeInTheDocument();
    expect(screen.getByText("Nada encontrado")).toBeInTheDocument();
    expect(screen.getByText("Ajuste os filtros.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Change filter" }));
    await user.click(screen.getByRole("button", { name: "Change search" }));
    await user.click(screen.getByRole("button", { name: "Change category" }));
    await user.click(screen.getByRole("button", { name: "Change sort" }));
    await user.click(screen.getByRole("button", { name: "Clear advanced filters" }));
    await user.click(screen.getByRole("button", { name: "Edit first filtered" }));
    await user.click(screen.getByRole("button", { name: "Remove first filtered" }));
    await user.click(screen.getByRole("button", { name: "Close statement modal" }));
    await user.click(screen.getByRole("button", { name: "Agenda" }));

    expect(screen.getByText("ScheduleModal")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close schedule modal" }));

    expect(onUpdateInitialBalance).toHaveBeenCalledWith(123);
    expect(onAddTransaction).toHaveBeenCalledTimes(1);
    expect(onPreviewTransaction).toHaveBeenCalledTimes(1);
    expect(onTransactionFilterChange).toHaveBeenCalledWith("income");
    expect(onSearchTermChange).toHaveBeenCalledWith("mercado");
    expect(onCategoryFilterChange).toHaveBeenCalledWith("moradia");
    expect(onSortOptionChange).toHaveBeenCalledWith("highest");
    expect(onClearAdvancedFilters).toHaveBeenCalledTimes(1);
    expect(onEditTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ id: "tx-1" }),
    );
    expect(onRemoveTransaction).toHaveBeenCalledWith("tx-1");
  });

  it("deve exibir as acoes principais da tela e os atalhos para extrato e agenda", async () => {
    const user = userEvent.setup();

    renderDashboardTransactionsView();

    expect(screen.getByRole("button", { name: "Extrato" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Agenda" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Abrir extrato" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Abrir agenda" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Abrir extrato" }));
    expect(screen.getByText("StatementProjectionModal")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close statement modal" }));
    await user.click(screen.getByRole("button", { name: "Abrir agenda" }));

    expect(screen.getByText("ScheduleModal")).toBeInTheDocument();
  });
});
