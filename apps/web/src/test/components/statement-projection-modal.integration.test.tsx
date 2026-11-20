import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { StatementProjectionModal } from "@/components/dashboard/overlays/statement-projection-modal";

function ForecastFlow() {
  const [open, setOpen] = useState(false);
  return <>
    <button onClick={() => setOpen(true)}>Ver projeção</button>
    <StatementProjectionModal
      open={open}
      onClose={() => setOpen(false)}
      transactionFilter="all"
      onTransactionFilterChange={vi.fn()}
      searchTerm=""
      onSearchTermChange={vi.fn()}
      categoryFilter="all"
      onCategoryFilterChange={vi.fn()}
      sortOption="newest"
      onSortOptionChange={vi.fn()}
      filteredTransactions={[]}
      statementTransactions={[]}
      hasActiveAdvancedFilters={false}
      onClearAdvancedFilters={vi.fn()}
      onEditTransaction={vi.fn()}
      onRemoveTransaction={vi.fn()}
      getNextRecurringOccurrence={() => null}
      emptyStateTitle="Nenhuma transação"
      emptyStateDescription="Cadastre itens para começar."
      forecastTotalIncome={3000}
      forecastTotalExpense={120}
      forecastProjectedBalance={2880}
    />
  </>;
}

afterEach(() => { document.body.style.overflow = ""; });

describe("StatementProjectionModal integration", () => {
  it("abre a previsao real e restaura rolagem e foco ao fechar", async () => {
    const user = userEvent.setup();
    document.body.style.overflow = "auto";
    render(<ForecastFlow />);
    const trigger = screen.getByRole("button", { name: "Ver projeção" });

    await user.click(trigger);
    expect(screen.getByRole("dialog", { name: "Previsão" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Previsão financeira" })).toHaveTextContent("Saldo previsto");
    expect(screen.getByLabelText("R$ 2.880,00")).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");

    await user.click(screen.getByRole("button", { name: "Fechar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(document.body.style.overflow).toBe("auto");
    expect(trigger).toHaveFocus();
  });
});
