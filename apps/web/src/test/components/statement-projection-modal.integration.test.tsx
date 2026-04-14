import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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
  const filteredTransactions = [
    createTransaction(),
    createTransaction({
      id: "tx-2",
      title: "Salario",
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
    onEditTransaction: vi.fn(),
    onRemoveTransaction: vi.fn(),
    getNextRecurringOccurrence: vi.fn(() => null),
    emptyStateTitle: "Nenhuma transação cadastrada",
    emptyStateDescription: "Cadastre itens para começar.",
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

describe("StatementProjectionModal integration", () => {
  it("deve integrar tabs, filtros e lista reais no modo historico", async () => {
    const user = userEvent.setup();
    const onTransactionFilterChange = vi.fn();
    const onSearchTermChange = vi.fn();
    const onCategoryFilterChange = vi.fn();
    const onSortOptionChange = vi.fn();
    const onEditTransaction = vi.fn();
    const onRemoveTransaction = vi.fn();

    renderStatementProjectionModal({
      onTransactionFilterChange,
      onSearchTermChange,
      onCategoryFilterChange,
      onSortOptionChange,
      onEditTransaction,
      onRemoveTransaction,
    });

    expect(screen.getByText(/Filtro principal/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Buscar transa/i)).toHaveValue("");
    expect(screen.getByLabelText("Categoria")).toHaveValue("all");
    expect(screen.getByLabelText(/Ordena/i)).toHaveValue("newest");
    expect(screen.getByText("Mercado")).toBeInTheDocument();
    expect(screen.getByText("Salario")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Entradas/i }));
    fireEvent.change(screen.getByLabelText(/Buscar transa/i), {
      target: { value: "mercado" },
    });
    await user.selectOptions(screen.getByLabelText("Categoria"), "moradia");
    await user.selectOptions(screen.getByLabelText(/Ordena/i), "highest");
    await user.click(screen.getAllByRole("button", { name: /Editar/i })[0]);
    await user.click(screen.getAllByRole("button", { name: /Remover/i })[0]);

    expect(onTransactionFilterChange).toHaveBeenCalledWith("income");
    expect(onSearchTermChange).toHaveBeenCalledWith("mercado");
    expect(onCategoryFilterChange).toHaveBeenCalledWith("moradia");
    expect(onSortOptionChange).toHaveBeenCalledWith("highest");
    expect(onEditTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ id: "tx-1", title: "Mercado" }),
    );
    expect(onRemoveTransaction).toHaveBeenCalledWith("tx-1");
  });
});
