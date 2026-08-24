import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HomeLanding } from "@/components/dashboard/home-landing/home-landing";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("HomeLanding", () => {
  it("apresenta a experiência completa na Home", () => {
    render(<HomeLanding onStartTransactions={vi.fn()} />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Seu dinheiro. Mais claro todos os dias.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Acompanhe o que importa e registre seus lançamentos em poucos passos.",
      ),
    ).toBeInTheDocument();
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

    const dashboard = screen.getByRole("group", {
      name: "Exemplo visual do painel financeiro Finly",
    });
    expect(within(dashboard).getByText("Saldo atual")).toBeInTheDocument();
    expect(
      within(dashboard).getByText("Reserva de tranquilidade"),
    ).toBeInTheDocument();
    expect(dashboard.parentElement).toHaveAttribute(
      "style",
      "color: var(--finly-navy);",
    );
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

  it("faz scroll suave para o showcase pelo CTA secundário", async () => {
    const user = userEvent.setup();
    const scrollIntoView = vi.fn();
    render(<HomeLanding onStartTransactions={vi.fn()} />);

    const productSection = document.getElementById("produto");
    Object.defineProperty(productSection, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });

    await user.click(screen.getByRole("link", { name: "Conhecer o Finly" }));

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
  });

  it("revela cada seção uma única vez ao entrar na viewport", () => {
    const callbacks: IntersectionObserverCallback[] = [];
    const observe = vi.fn();
    const unobserve = vi.fn();
    const disconnect = vi.fn();

    class IntersectionObserverMock {
      constructor(callback: IntersectionObserverCallback) {
        callbacks.push(callback);
      }

      observe = observe;
      unobserve = unobserve;
      disconnect = disconnect;
    }

    vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);

    const { container } = render(
      <HomeLanding onStartTransactions={vi.fn()} />,
    );
    const reveals = container.querySelectorAll("[data-scroll-reveal]");

    expect(reveals).toHaveLength(3);
    callbacks[0](
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );

    expect(reveals[0]).toHaveAttribute("data-visible", "true");
    expect(unobserve).toHaveBeenCalledWith(reveals[0]);
  });
});
