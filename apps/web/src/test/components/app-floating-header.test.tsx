import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
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
  const desktopButton = (label: string) =>
    within(screen.getByRole("navigation", { name: "Navegação desktop" })).getByRole("button", { name: label });
  it("deve renderizar os elementos principais e as opcoes de navegacao", () => {
    render(<AppFloatingHeader activeView="home" onChangeView={vi.fn()} />);

    expect(screen.getByRole("img", { name: "Finly" })).toBeInTheDocument();
    expect(screen.getByText("Finly")).toBeInTheDocument();
    expect(screen.getByText("Seu painel financeiro")).toBeInTheDocument();
    expect(desktopButton("Início")).toBeInTheDocument();
    expect(
      desktopButton("Lançamentos"),
    ).toBeInTheDocument();
    expect(desktopButton("Metas")).toBeInTheDocument();
    expect(desktopButton("Insights")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Alternar tema" }),
    ).toBeInTheDocument();
  });

  it("deve disparar onChangeView com a secao correta ao clicar nas abas", async () => {
    const user = userEvent.setup();
    const onChangeView = vi.fn();

    render(<AppFloatingHeader activeView="home" onChangeView={onChangeView} />);

    await user.click(desktopButton("Início"));
    await user.click(desktopButton("Lançamentos"));
    await user.click(desktopButton("Metas"));
    await user.click(desktopButton("Insights"));

    expect(onChangeView).toHaveBeenNthCalledWith(1, "home");
    expect(onChangeView).toHaveBeenNthCalledWith(2, "transactions");
    expect(onChangeView).toHaveBeenNthCalledWith(3, "goals");
    expect(onChangeView).toHaveBeenNthCalledWith(4, "insights");
  });

  it("deve abrir o painel de conta sem mudar a secao ativa", async () => {
    const user = userEvent.setup();
    const onChangeView = vi.fn();

    render(
      <AppFloatingHeader
        activeView="home"
        onChangeView={onChangeView}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Conta" }));

    expect(screen.getByRole("dialog", { name: "Acesse sua conta" })).toBeVisible();
    expect(onChangeView).not.toHaveBeenCalled();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Conta" })).toHaveFocus();
  });

  it("deve destacar visualmente a aba ativa de forma observavel", () => {
    const { rerender } = render(<AppFloatingHeader activeView="home" onChangeView={vi.fn()} />);

    const goalsButton = desktopButton("Metas");
    const homeButton = desktopButton("Início");
    const desktopNavigation = screen.getByRole("navigation", { name: "Navegação desktop" });

    expect(homeButton).toHaveAttribute("aria-current", "page");
    expect(desktopNavigation.parentElement?.querySelectorAll("[data-jelly-indicator]")).toHaveLength(1);

    rerender(<AppFloatingHeader activeView="goals" onChangeView={vi.fn()} />);
    expect(goalsButton).toHaveAttribute("aria-current", "page");
    expect(goalsButton).toHaveClass("text-white");
    expect(homeButton).not.toHaveAttribute("aria-current");

    rerender(<AppFloatingHeader activeView="forum" onChangeView={vi.fn()} />);
    expect(desktopNavigation.querySelector('[aria-current="page"]')).toBeNull();
    expect(screen.getByRole("button", { name: "Fórum" })).toHaveAttribute("aria-current", "page");

    rerender(<AppFloatingHeader activeView="download" onChangeView={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Download" })).toHaveAttribute("aria-current", "page");
  });

  it("deve usar a mesma superfície premium em todas as abas", () => {
    const { container } = render(
      <AppFloatingHeader
        activeView="goals"
        onChangeView={vi.fn()}
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
    expect(desktopButton("Lançamentos")).toBeInTheDocument();
  });

  it("navega pelo painel compacto, marca a seção ativa e fecha após a escolha", async () => {
    const user = userEvent.setup();
    const onChangeView = vi.fn();
    window.matchMedia = ((query: string) => ({
      matches: query.includes("max-width: 1099px") || query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as typeof window.matchMedia;

    const { rerender } = render(<AppFloatingHeader activeView="home" onChangeView={onChangeView} />);
    const closedMenuButton = screen.getByRole("button", { name: "Abrir menu" });
    expect(closedMenuButton).toHaveClass("size-11");
    expect(closedMenuButton).not.toHaveTextContent(/Menu|Fechar/);
    const iconLines = closedMenuButton.querySelectorAll("[aria-hidden='true'] > span");
    expect(iconLines).toHaveLength(2);
    expect(iconLines[0]).toHaveClass("left-1/2", "top-1/2");
    expect(iconLines[1]).toHaveClass("left-1/2", "top-1/2");
    await user.click(closedMenuButton);
    expect(screen.getByRole("button", { name: "Fechar menu" })).toHaveAttribute("aria-expanded", "true");
    expect(document.body.style.overflow).toBe("hidden");

    const navigation = screen.getByRole("navigation", { name: "Navegação principal" });
    expect(within(navigation).getByRole("button", { name: "Fórum" })).toBeInTheDocument();
    expect(within(navigation).getByRole("button", { name: "Download" })).toBeInTheDocument();
    await user.click(within(navigation).getByRole("button", { name: "Lançamentos" }));
    expect(onChangeView).toHaveBeenCalledWith("transactions");
    expect(document.body.style.overflow).toBe("");
    rerender(<AppFloatingHeader activeView="transactions" onChangeView={onChangeView} />);
    await user.click(screen.getByRole("button", { name: "Abrir menu" }));
    expect(within(screen.getByRole("navigation", { name: "Navegação principal" }))
      .getByRole("button", { name: "Lançamentos" })).toHaveAttribute("aria-current", "page");
    rerender(<AppFloatingHeader activeView="forum" onChangeView={onChangeView} />);
    expect(within(screen.getByRole("navigation", { name: "Navegação principal" }))
      .getByRole("button", { name: "Fórum" })).toHaveAttribute("aria-current", "page");
  });

  it("fecha o painel por Escape e clique fora e mantém conta e tema no painel", async () => {
    const user = userEvent.setup();
    window.matchMedia = ((query: string) => ({
      matches: query.includes("max-width: 1099px") || query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as typeof window.matchMedia;
    render(
      <>
        <AppFloatingHeader activeView="home" onChangeView={vi.fn()} />
        <button type="button">Fora do cabeçalho</button>
      </>,
    );

    await user.click(screen.getByRole("button", { name: "Abrir menu" }));
    expect(screen.getByRole("button", { name: "Conta" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Alternar tema" })).toBeInTheDocument();
    const panel = document.getElementById("finly-staggered-menu-panel");
    expect(panel).toHaveClass("fixed", "inset-y-0", "h-dvh", "overflow-hidden");
    expect(document.getElementById("finly-staggered-menu-content")).toHaveClass("overflow-y-auto");
    expect(panel).toHaveClass("pointer-events-auto");
    expect(panel?.contains(screen.getByRole("button", { name: "Conta" }))).toBe(false);
    expect(panel?.contains(screen.getByRole("button", { name: "Alternar tema" }))).toBe(false);
    await user.click(screen.getByRole("button", { name: "Alternar tema" }));
    expect(screen.getByRole("button", { name: "Fechar menu" })).toHaveAttribute("aria-expanded", "true");
    await user.click(screen.getByRole("button", { name: "Conta" }));
    expect(screen.getByRole("dialog", { name: "Acesse sua conta" })).toBeVisible();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    if (screen.getByRole("button", { name: /menu/i }).getAttribute("aria-expanded") === "true") {
      await user.keyboard("{Escape}");
    }
    expect(screen.getByRole("button", { name: "Abrir menu" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: "Abrir menu" })).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "Abrir menu" }));
    await user.click(screen.getByRole("button", { name: "Fora do cabeçalho" }));
    expect(screen.getByRole("button", { name: "Abrir menu" })).toHaveAttribute("aria-expanded", "false");
    expect(document.body.style.overflow).toBe("");
  });
});
