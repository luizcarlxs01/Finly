import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next/image", () => ({
  default: ({
    alt,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { alt: string }) => (
    <img alt={alt} {...props} />
  ),
}));

vi.mock("@/components/layout/theme-toggle", () => ({
  ThemeToggle: () => <button type="button">Alternar tema</button>,
}));

import { AppFloatingHeader } from "@/components/layout/app-floating-header";

describe("AppFloatingHeader", () => {
  it("deve renderizar os elementos principais e as opcoes de navegacao", () => {
    render(<AppFloatingHeader activeView="home" onChangeView={vi.fn()} isAccountCardOpen={false} onToggleAccountCard={vi.fn()} />);

    expect(screen.getByRole("img", { name: "Finly" })).toBeInTheDocument();
    expect(screen.getByText("Finly")).toBeInTheDocument();
    expect(screen.getByText("Seu painel financeiro")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Início/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Lançamentos/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Metas/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Insights/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Alternar tema" }),
    ).toBeInTheDocument();
  });

  it("deve disparar onChangeView com a secao correta ao clicar nas abas", async () => {
    const user = userEvent.setup();
    const onChangeView = vi.fn();

    render(<AppFloatingHeader activeView="home" onChangeView={onChangeView} isAccountCardOpen={false} onToggleAccountCard={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /Início/i }));
    await user.click(screen.getByRole("button", { name: /Lançamentos/i }));
    await user.click(screen.getByRole("button", { name: /Metas/i }));
    await user.click(screen.getByRole("button", { name: /Insights/i }));

    expect(onChangeView).toHaveBeenNthCalledWith(1, "home");
    expect(onChangeView).toHaveBeenNthCalledWith(2, "transactions");
    expect(onChangeView).toHaveBeenNthCalledWith(3, "goals");
    expect(onChangeView).toHaveBeenNthCalledWith(4, "insights");
  });

  it("deve destacar visualmente a aba ativa de forma observavel", () => {
    render(<AppFloatingHeader activeView="goals" onChangeView={vi.fn()} isAccountCardOpen={false} onToggleAccountCard={vi.fn()} />);

    const goalsButton = screen.getByRole("button", { name: /Metas/i });
    const homeButton = screen.getByRole("button", { name: /Início/i });

    expect(goalsButton.className).toContain("bg-primary");
    expect(homeButton.className).toContain("hover:bg-muted");
  });

  it("deve usar a mesma superfície premium em todas as abas", () => {
    const { container } = render(
      <AppFloatingHeader
        activeView="goals"
        onChangeView={vi.fn()}
        isAccountCardOpen={false}
        onToggleAccountCard={vi.fn()}
      />,
    );

    const header = container.firstElementChild;
    const surface = header?.firstElementChild;

    expect(header).not.toHaveAttribute("data-variant");
    expect(header?.className).toContain("sticky");
    expect(header?.className).not.toContain("translate-x");
    expect(surface?.className).toContain("max-w-7xl");
    expect(surface?.className).toContain("left-1/2");
    expect(surface?.className).toContain("-translate-x-1/2");
    expect(surface?.className).toContain("w-[calc(100vw-2rem)]");
    expect(surface?.className).toContain("bg-white/72");
    expect(screen.getByRole("button", { name: /Lançamentos/i })).toBeInTheDocument();
  });
});
