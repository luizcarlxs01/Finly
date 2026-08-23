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
    expect(screen.getByRole("link", { name: "Começar agora" })).toHaveAttribute(
      "href",
      "https://app.finly.systems",
    );
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
});
