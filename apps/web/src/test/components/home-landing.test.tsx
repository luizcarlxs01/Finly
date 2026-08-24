import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { HomeLanding } from "@/components/dashboard/home-landing/home-landing";

describe("HomeLanding", () => {
  it("apresenta a experiência completa na Home", () => {
    render(<HomeLanding onStartTransactions={vi.fn()} />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Seu dinheiro. Mais claro todos os dias.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Saldo atual")).toBeInTheDocument();
    expect(screen.getByText("Reserva de tranquilidade")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /tudo o que importa/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /comece sem conta/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /menos dúvida/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "Ir para a aba de lançamentos" }),
    ).toHaveLength(2);
    expect(
      screen.getByRole("link", { name: "Conhecer o Finly" }),
    ).toHaveAttribute("href", "#produto");
  });

  it("mantém as duas chamadas para Lançamentos funcionais", async () => {
    const user = userEvent.setup();
    const onStartTransactions = vi.fn();
    render(<HomeLanding onStartTransactions={onStartTransactions} />);

    const transactionButtons = screen.getAllByRole("button", {
      name: "Ir para a aba de lançamentos",
    });
    await user.click(transactionButtons[0]);
    await user.click(transactionButtons[1]);

    expect(onStartTransactions).toHaveBeenCalledTimes(2);
  });
});
