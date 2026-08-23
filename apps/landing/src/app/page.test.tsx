import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("Finly landing page", () => {
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
});
