import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/components/dashboard/transaction-filter-tabs", () => ({
  TransactionFilterTabs: ({
    value,
    onChange,
  }: {
    value: "all" | "income" | "expense";
    onChange: (value: "all" | "income" | "expense") => void;
  }) => (
    <div>
      <p>Filtro atual: {value}</p>
      <button type="button" onClick={() => onChange("income")}>
        Filtrar entradas
      </button>
      <button type="button" onClick={() => onChange("expense")}>
        Filtrar saídas
      </button>
    </div>
  ),
}));

vi.mock("@/components/dashboard/transaction-advanced-filters", () => ({
  TransactionAdvancedFilters: ({
    searchValue,
    categoryValue,
    sortValue,
    resultCount,
    totalCount,
    hasActiveFilters,
    onClearFilters,
  }: {
    searchValue: string;
    categoryValue: string;
    sortValue: string;
    resultCount: number;
    totalCount: number;
    hasActiveFilters: boolean;
    onClearFilters: () => void;
  }) => (
    <div>
      <p>Busca: {searchValue || "vazia"}</p>
      <p>Categoria: {categoryValue}</p>
      <p>Ordenação: {sortValue}</p>
      <p>
        Resultados: {resultCount}/{totalCount}
      </p>
      <p>Filtros ativos: {hasActiveFilters ? "sim" : "não"}</p>
      <button type="button" onClick={onClearFilters}>
        Limpar filtros
      </button>
    </div>
  ),
}));

vi.mock("@/components/dashboard/transaction-list", () => ({
  TransactionList: ({
    transactions,
    onEditTransaction,
    onRemoveTransaction,
    emptyStateTitle,
    emptyStateDescription,
  }: {
    transactions: Array<{ id: string; title: string }>;
    onEditTransaction: (transaction: { id: string; title: string }) => void;
    onRemoveTransaction: (id: string) => void;
    emptyStateTitle: string;
    emptyStateDescription: string;
  }) =>
    transactions.length === 0 ? (
      <div>
        <p>{emptyStateTitle}</p>
        <p>{emptyStateDescription}</p>
      </div>
    ) : (
      <div>
        <p>Lista com {transactions.length} transações</p>
        {transactions.map((transaction) => (
          <div key={transaction.id}>
            <p>{transaction.title}</p>
            <button type="button" onClick={() => onEditTransaction(transaction)}>
              Editar {transaction.title}
            </button>
            <button type="button" onClick={() => onRemoveTransaction(transaction.id)}>
              Remover {transaction.title}
            </button>
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
      <p>Previsão</p>
      <p>Entradas previstas: {totalIncome}</p>
      <p>Saídas previstas: {totalExpense}</p>
      <p>Saldo previsto: {projectedBalance}</p>
    </div>
  ),
}));

import { StatementProjectionModal } from "@/components/dashboard/overlays/statement-projection-modal";
import type { Transaction } from "@/types/finance";

function createTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "tx-1",
    title: "Mercado",
    amount: 120,
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
    createdAt: "2026-04-10T12:00:00.000Z",
    ...overrides,
  };
}

function renderStatementProjectionModal(
  overrides: Partial<React.ComponentProps<typeof StatementProjectionModal>> = {},
) {
  const filteredTransactions = [createTransaction()];
  const statementTransactions = [
    filteredTransactions[0],
    createTransaction({
      id: "tx-2",
      title: "Salário",
      amount: 3000,
      type: "income",
      category: "salario",
    }),
  ];

  const props: React.ComponentProps<typeof StatementProjectionModal> = {
    open: true,
    onClose: vi.fn(),
    transactionFilter: "all",
    onTransactionFilterChange: vi.fn(),
    searchTerm: "mer",
    onSearchTermChange: vi.fn(),
    categoryFilter: "alimentacao",
    onCategoryFilterChange: vi.fn(),
    sortOption: "newest",
    onSortOptionChange: vi.fn(),
    filteredTransactions,
    statementTransactions,
    hasActiveAdvancedFilters: true,
    onClearAdvancedFilters: vi.fn(),
    onEditTransaction: vi.fn(),
    onRemoveTransaction: vi.fn(),
    getNextRecurringOccurrence: vi.fn(() => null),
    emptyStateTitle: "Nenhum resultado",
    emptyStateDescription: "Ajuste os filtros para tentar novamente.",
    forecastTotalIncome: 3000,
    forecastTotalExpense: 120,
    forecastProjectedBalance: 2880,
    ...overrides,
  };

  return {
    ...render(<StatementProjectionModal {...props} />),
    props,
  };
}

describe("StatementProjectionModal", () => {
  it("deve nao renderizar conteudo relevante quando estiver fechado", () => {
    renderStatementProjectionModal({ open: false });

    expect(screen.queryByText("Extrato")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Fechar" })).not.toBeInTheDocument();
  });

  it("deve renderizar o modo historico por padrao com dados completos e permitir fechar", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onTransactionFilterChange = vi.fn();
    const onClearAdvancedFilters = vi.fn();
    const onEditTransaction = vi.fn();
    const onRemoveTransaction = vi.fn();

    renderStatementProjectionModal({
      onClose,
      onTransactionFilterChange,
      onClearAdvancedFilters,
      onEditTransaction,
      onRemoveTransaction,
    });

    expect(screen.getByText("Extrato")).toBeInTheDocument();
    expect(
      screen.getByText("Veja seu histórico e acompanhe os próximos movimentos."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Histórico/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Previsão/i })).toBeInTheDocument();
    expect(screen.getByText("Filtro atual: all")).toBeInTheDocument();
    expect(screen.getByText("Busca: mer")).toBeInTheDocument();
    expect(screen.getByText("Categoria: alimentacao")).toBeInTheDocument();
    expect(screen.getByText("Ordenação: newest")).toBeInTheDocument();
    expect(screen.getByText("Resultados: 1/2")).toBeInTheDocument();
    expect(screen.getByText("Filtros ativos: sim")).toBeInTheDocument();
    expect(screen.getByText("Lista com 1 transações")).toBeInTheDocument();
    expect(screen.getByText("Mercado")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Filtrar entradas" }));
    await user.click(screen.getByRole("button", { name: "Limpar filtros" }));
    await user.click(screen.getByRole("button", { name: "Editar Mercado" }));
    await user.click(screen.getByRole("button", { name: "Remover Mercado" }));
    await user.click(screen.getByRole("button", { name: "Fechar" }));

    expect(onTransactionFilterChange).toHaveBeenCalledWith("income");
    expect(onClearAdvancedFilters).toHaveBeenCalledTimes(1);
    expect(onEditTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ id: "tx-1", title: "Mercado" }),
    );
    expect(onRemoveTransaction).toHaveBeenCalledWith("tx-1");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("deve alternar entre historico e previsao exibindo os dados principais de cada modo", async () => {
    const user = userEvent.setup();

    renderStatementProjectionModal();

    expect(screen.getByText("Lista com 1 transações")).toBeInTheDocument();
    expect(screen.queryByText("Entradas previstas: 3000")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Previsão/i }));

    expect(screen.getByText("Entradas previstas: 3000")).toBeInTheDocument();
    expect(screen.getByText("Saídas previstas: 120")).toBeInTheDocument();
    expect(screen.getByText("Saldo previsto: 2880")).toBeInTheDocument();
    expect(screen.queryByText("Lista com 1 transações")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Histórico/i }));

    expect(screen.getByText("Lista com 1 transações")).toBeInTheDocument();
    expect(screen.queryByText("Entradas previstas: 3000")).not.toBeInTheDocument();
  });

  it("deve renderizar de forma estavel com dados minimos validos e fallback de lista vazia", async () => {
    const user = userEvent.setup();

    renderStatementProjectionModal({
      transactionFilter: "expense",
      searchTerm: "",
      categoryFilter: "all",
      sortOption: "oldest",
      filteredTransactions: [],
      statementTransactions: [],
      hasActiveAdvancedFilters: false,
      emptyStateTitle: "Nenhuma transação cadastrada",
      emptyStateDescription:
        "Assim que você registrar movimentações, elas aparecerão aqui.",
      forecastTotalIncome: 0,
      forecastTotalExpense: 0,
      forecastProjectedBalance: 0,
    });

    expect(screen.getByText("Filtro atual: expense")).toBeInTheDocument();
    expect(screen.getByText("Busca: vazia")).toBeInTheDocument();
    expect(screen.getByText("Categoria: all")).toBeInTheDocument();
    expect(screen.getByText("Ordenação: oldest")).toBeInTheDocument();
    expect(screen.getByText("Resultados: 0/0")).toBeInTheDocument();
    expect(screen.getByText("Filtros ativos: sim")).toBeInTheDocument();
    expect(screen.getByText("Nenhuma transação cadastrada")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Assim que você registrar movimentações, elas aparecerão aqui.",
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Previsão/i }));

    expect(screen.getByText("Entradas previstas: 0")).toBeInTheDocument();
    expect(screen.getByText("Saídas previstas: 0")).toBeInTheDocument();
    expect(screen.getByText("Saldo previsto: 0")).toBeInTheDocument();
  });
});
