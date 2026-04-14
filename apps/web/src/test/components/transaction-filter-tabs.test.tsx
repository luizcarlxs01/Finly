import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TransactionFilterTabs } from "@/components/dashboard/transaction-filter-tabs";

function renderTransactionFilterTabs(
  overrides: Partial<React.ComponentProps<typeof TransactionFilterTabs>> = {},
) {
  const props: React.ComponentProps<typeof TransactionFilterTabs> = {
    value: "all",
    onChange: vi.fn(),
    ...overrides,
  };

  return {
    ...render(<TransactionFilterTabs {...props} />),
    props,
  };
}

describe("TransactionFilterTabs", () => {
  it("deve renderizar os filtros disponiveis com props minimas validas", () => {
    renderTransactionFilterTabs();

    expect(screen.getByText("Filtro principal")).toBeInTheDocument();
    expect(
      screen.getByText("Escolha o tipo de movimentação que deseja visualizar"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Todas/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Entradas/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Saídas/i })).toBeInTheDocument();
  });

  it("deve destacar visualmente a aba selecionada no estado inicial informado", () => {
    renderTransactionFilterTabs({ value: "income" });

    const allButton = screen.getByRole("button", { name: /Todas/i });
    const incomeButton = screen.getByRole("button", { name: /Entradas/i });
    const expenseButton = screen.getByRole("button", { name: /Saídas/i });

    expect(incomeButton.className).toContain("bg-primary");
    expect(allButton.className).toContain("hover:bg-muted");
    expect(expenseButton.className).toContain("hover:bg-muted");
  });

  it("deve disparar o callback com o valor correto ao selecionar cada filtro", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderTransactionFilterTabs({ value: "all", onChange });

    await user.click(screen.getByRole("button", { name: /Todas/i }));
    await user.click(screen.getByRole("button", { name: /Entradas/i }));
    await user.click(screen.getByRole("button", { name: /Saídas/i }));

    expect(onChange).toHaveBeenNthCalledWith(1, "all");
    expect(onChange).toHaveBeenNthCalledWith(2, "income");
    expect(onChange).toHaveBeenNthCalledWith(3, "expense");
  });

  it("deve refletir a troca de aba quando o valor selecionado muda entre renderizacoes", () => {
    const { rerender } = render(
      <TransactionFilterTabs value="all" onChange={vi.fn()} />,
    );

    expect(screen.getByRole("button", { name: /Todas/i }).className).toContain(
      "bg-primary",
    );
    expect(
      screen.getByRole("button", { name: /Entradas/i }).className,
    ).toContain("hover:bg-muted");

    rerender(<TransactionFilterTabs value="expense" onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: /Saídas/i }).className).toContain(
      "bg-primary",
    );
    expect(
      screen.getByRole("button", { name: /Todas/i }).className,
    ).toContain("hover:bg-muted");
  });
});
