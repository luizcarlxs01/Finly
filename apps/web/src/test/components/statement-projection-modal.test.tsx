import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { StatementProjectionModal } from "@/components/dashboard/overlays/statement-projection-modal";

function createProps(
  overrides: Partial<React.ComponentProps<typeof StatementProjectionModal>> = {},
): React.ComponentProps<typeof StatementProjectionModal> {
  return {
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
    filteredTransactions: [],
    statementTransactions: [],
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
}

describe("StatementProjectionModal", () => {
  it("nao renderiza o dialogo quando fechado", () => {
    render(<StatementProjectionModal {...createProps({ open: false })} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("exibe os valores da previsao e permite fechar apos a animacao", async () => {
    const props = createProps();
    render(<StatementProjectionModal {...props} />);
    const dialog = screen.getByRole("dialog", { name: "Previsão" });
    const forecast = within(dialog);

    expect(forecast.getByText("Saldo previsto")).toBeInTheDocument();
    expect(forecast.getByLabelText("R$ 2.880,00")).toBeInTheDocument();
    expect(forecast.getByLabelText("R$ 3.000,00")).toBeInTheDocument();
    expect(forecast.getByLabelText("R$ 120,00")).toBeInTheDocument();
    expect(forecast.getByText("Folga")).toBeInTheDocument();

    await userEvent.click(forecast.getByRole("button", { name: "Fechar" }));
    await waitFor(() => expect(props.onClose).toHaveBeenCalledTimes(1));
  });

  it("atualiza a previsao aberta e destaca o saldo negativo", () => {
    const props = createProps();
    const { rerender } = render(<StatementProjectionModal {...props} />);
    rerender(<StatementProjectionModal {...props} forecastTotalIncome={1000} forecastTotalExpense={1800} forecastProjectedBalance={-800} />);
    const forecast = within(screen.getByRole("dialog", { name: "Previsão" }));

    expect(forecast.getByLabelText("-R$ 800,00")).toBeInTheDocument();
    expect(forecast.getByLabelText("R$ 1.000,00")).toBeInTheDocument();
    expect(forecast.getByLabelText("R$ 1.800,00")).toBeInTheDocument();
    expect(forecast.getByText("Atenção")).toBeInTheDocument();
    expect(forecast.queryByText("Folga")).not.toBeInTheDocument();
  });

  it("exibe uma previsao vazia com saldo neutro", () => {
    render(<StatementProjectionModal {...createProps({ forecastTotalIncome: 0, forecastTotalExpense: 0, forecastProjectedBalance: 0 })} />);
    const forecast = within(screen.getByRole("dialog", { name: "Previsão" }));

    expect(forecast.getAllByLabelText("R$ 0,00")).toHaveLength(3);
    expect(forecast.getByText("Em dia")).toBeInTheDocument();
  });
});
