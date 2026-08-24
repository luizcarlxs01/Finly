import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { HeroSection } from "@/components/dashboard/hero-section";

describe("HeroSection", () => {
  it("deve renderizar o bloco principal com os textos e a ação esperada", () => {
    render(<HeroSection onStartTransactions={vi.fn()} />);

    expect(
      screen.getByRole("heading", {
        name: "Seu dinheiro. Mais claro todos os dias.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Acompanhe o que importa e registre seus lançamentos em poucos passos.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ir para a aba de lançamentos" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Começar lançamentos")).toBeInTheDocument();
  });

  it("deve preservar a ação que leva aos lançamentos", async () => {
    const user = userEvent.setup();
    const onStartTransactions = vi.fn();

    render(<HeroSection onStartTransactions={onStartTransactions} />);

    await user.click(
      screen.getByRole("button", { name: "Ir para a aba de lançamentos" }),
    );

    expect(onStartTransactions).toHaveBeenCalledOnce();
  });

  it("deve manter a Home enxuta sem reintroduzir cards decorativos", () => {
    render(<HeroSection onStartTransactions={vi.fn()} />);

    expect(screen.queryByText("Veja seu momento")).not.toBeInTheDocument();
    expect(screen.queryByText("Registre com facilidade")).not.toBeInTheDocument();
    expect(screen.queryByText("Acompanhe objetivos")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });
});
