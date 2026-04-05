import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AppFloatingHeader } from "@/components/layout/app-floating-header";

describe("AppFloatingHeader", () => {
  it("deve renderizar os itens principais da navegação", () => {
    render(
      <AppFloatingHeader activeView="home" onChangeView={vi.fn()} />,
    );

    expect(screen.getByText("Finly")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Início/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Lançamentos/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Metas/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Insights/i })).toBeInTheDocument();
  });

  it("deve chamar onChangeView com o valor correto ao clicar em outra view", async () => {
    const user = userEvent.setup();
    const onChangeView = vi.fn();

    render(
      <AppFloatingHeader activeView="home" onChangeView={onChangeView} />,
    );

    await user.click(screen.getByRole("button", { name: /Metas/i }));

    expect(onChangeView).toHaveBeenCalledWith("goals");
  });

  it("deve chamar onChangeView ao clicar em Lançamentos", async () => {
    const user = userEvent.setup();
    const onChangeView = vi.fn();

    render(
      <AppFloatingHeader activeView="home" onChangeView={onChangeView} />,
    );

    await user.click(screen.getByRole("button", { name: /Lançamentos/i }));

    expect(onChangeView).toHaveBeenCalledWith("transactions");
  });

  it("deve marcar a view ativa corretamente", () => {
    render(
      <AppFloatingHeader activeView="insights" onChangeView={vi.fn()} />,
    );

    const insightsButton = screen.getByRole("button", { name: /Insights/i });

    expect(insightsButton).toHaveAttribute("data-slot", "button");
  });
});
