import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TransactionAdvancedFilters } from "@/components/dashboard/transaction-advanced-filters";

function renderTransactionAdvancedFilters(
  overrides: Partial<
    React.ComponentProps<typeof TransactionAdvancedFilters>
  > = {},
) {
  const props: React.ComponentProps<typeof TransactionAdvancedFilters> = {
    searchValue: "",
    onSearchChange: vi.fn(),
    categoryValue: "all",
    onCategoryChange: vi.fn(),
    sortValue: "newest",
    onSortChange: vi.fn(),
    resultCount: 3,
    totalCount: 8,
    hasActiveFilters: false,
    onClearFilters: vi.fn(),
    ...overrides,
  };

  return {
    ...render(<TransactionAdvancedFilters {...props} />),
    props,
  };
}

describe("TransactionAdvancedFilters", () => {
  it("deve renderizar os filtros principais e os indicadores de estado", () => {
    renderTransactionAdvancedFilters();

    expect(screen.getByText(/Filtros avan/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Refine o extrato com mais contexto/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Buscar transa/i)).toHaveValue("");
    expect(screen.getByLabelText("Categoria")).toHaveValue("all");
    expect(screen.getByLabelText(/Ordena/i)).toHaveValue("newest");
    expect(screen.getByText("3 de 8")).toBeInTheDocument();
    expect(screen.getByText(/Visualiza/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Limpar filtros/i }),
    ).not.toBeInTheDocument();
  });

  it("deve disparar os callbacks de busca, categoria e ordenacao corretamente", async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    const onCategoryChange = vi.fn();
    const onSortChange = vi.fn();

    renderTransactionAdvancedFilters({
      onSearchChange,
      onCategoryChange,
      onSortChange,
    });

    fireEvent.change(screen.getByLabelText(/Buscar transa/i), {
      target: { value: "mercado" },
    });
    await user.selectOptions(screen.getByLabelText("Categoria"), "moradia");
    await user.selectOptions(screen.getByLabelText(/Ordena/i), "highest");

    expect(onSearchChange).toHaveBeenCalledWith("mercado");
    expect(onCategoryChange).toHaveBeenCalledWith("moradia");
    expect(onSortChange).toHaveBeenCalledWith("highest");
  });

  it("deve permitir limpar filtros quando houver filtros ativos", async () => {
    const user = userEvent.setup();
    const onClearFilters = vi.fn();

    renderTransactionAdvancedFilters({
      searchValue: "merc",
      categoryValue: "alimentacao",
      sortValue: "highest",
      resultCount: 1,
      totalCount: 5,
      hasActiveFilters: true,
      onClearFilters,
    });

    expect(screen.getByText(/Filtros ativos/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Limpar filtros/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Limpar filtros/i }));

    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });

  it("deve manter comportamento estavel com props minimas validas", () => {
    renderTransactionAdvancedFilters({
      resultCount: 0,
      totalCount: 0,
      hasActiveFilters: false,
    });

    expect(screen.getByText("0 de 0")).toBeInTheDocument();
    expect(screen.getByLabelText("Categoria")).toHaveValue("all");
    expect(screen.getByLabelText(/Ordena/i)).toHaveValue("newest");
  });
});
