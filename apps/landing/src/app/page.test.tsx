import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Home from "@/app/page";

describe("Finly landing page", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("presents the exact hero promise and CTA destinations", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Seu dinheiro. Finalmente claro.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Organize, planeje e entenda suas finanças em um único lugar.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "Começar agora" })[0],
    ).toHaveAttribute("href", "https://app.finly.systems");
    expect(
      screen.getByRole("link", { name: "Conhecer o Finly" }),
    ).toHaveAttribute("href", "#produto");
  });

  it("provides semantic navigation and a single primary heading", () => {
    render(<Home />);

    expect(
      screen.getByRole("navigation", { name: "Navegação principal" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("shows representative financial indicators in the product showcase", () => {
    const { container } = render(<Home />);

    expect(container.querySelector("#produto")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: /tudo o que importa/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Saldo atual")).toBeInTheDocument();
    expect(screen.getByText("Entradas")).toBeInTheDocument();
    expect(screen.getByText("Saídas")).toBeInTheDocument();
    expect(screen.getByText("Saldo projetado")).toBeInTheDocument();
    expect(screen.getByText("Reserva de tranquilidade")).toBeInTheDocument();
  });

  it("surrounds the dashboard with concise financial signals", () => {
    render(<Home />);

    expect(screen.getByText("+ R$ 4.250")).toBeInTheDocument();
    expect(screen.getByText("Meta 72%")).toBeInTheDocument();
    expect(screen.getByText("R$ 15.840")).toBeInTheDocument();
  });

  it("explains that an account is optional until the user chooses to sync", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { level: 2, name: /comece sem conta/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("No seu dispositivo")).toBeInTheDocument();
    expect(screen.getByText("Sincronizado quando quiser")).toBeInTheDocument();
  });

  it("ends with a second direct link to the Finly app", () => {
    render(<Home />);

    const primaryLinks = screen.getAllByRole("link", {
      name: "Começar agora",
    });
    expect(primaryLinks).toHaveLength(2);
    expect(primaryLinks[1]).toHaveAttribute(
      "href",
      "https://app.finly.systems",
    );
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("reveals lower sections as they enter the viewport", () => {
    const callbacks: IntersectionObserverCallback[] = [];
    const observe = vi.fn();
    const unobserve = vi.fn();

    class TestIntersectionObserver implements IntersectionObserver {
      readonly root = null;
      readonly rootMargin = "0px 0px -8% 0px";
      readonly thresholds = [0.16];

      constructor(callback: IntersectionObserverCallback) {
        callbacks.push(callback);
      }

      observe = observe;
      unobserve = unobserve;
      disconnect = vi.fn();
      takeRecords = vi.fn(() => []);
    }

    vi.stubGlobal("IntersectionObserver", TestIntersectionObserver);

    const { container } = render(<Home />);
    const reveals = container.querySelectorAll(".scroll-reveal");

    expect(reveals).toHaveLength(3);
    expect(observe).toHaveBeenCalledTimes(3);

    act(() => {
      callbacks[0]?.(
        [
          {
            isIntersecting: true,
            target: reveals[0],
          } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      );
    });

    expect(reveals[0]).toHaveAttribute("data-visible", "true");
    expect(unobserve).toHaveBeenCalledWith(reveals[0]);
  });
});
