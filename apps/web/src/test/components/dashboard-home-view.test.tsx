import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DashboardHomeView } from "@/components/dashboard/views/dashboard-home-view";

function renderDashboardHomeView(
  overrides: Partial<React.ComponentProps<typeof DashboardHomeView>> = {},
) {
  const props: React.ComponentProps<typeof DashboardHomeView> = {
    onGoToTransactions: vi.fn(),
    onOpenCalendar: vi.fn(),
    onOpenStatementProjection: vi.fn(),
    ...overrides,
  };

  return {
    ...render(<DashboardHomeView {...props} />),
    props,
  };
}

describe("DashboardHomeView", () => {
  it("deve renderizar os blocos principais da view inicial", () => {
    renderDashboardHomeView();

    expect(screen.getByText("Finly")).toBeInTheDocument();
    expect(
      screen.getByText("Seu financeiro mais claro, simples e organizado."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Comece pelo essencial e ganhe clareza sobre seu dinheiro."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ir para a aba de lançamentos" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Começar lançamentos")).toBeInTheDocument();
  });

  it("deve exibir os resumos, cards e a ação principal da interface atual", () => {
    renderDashboardHomeView();

    expect(screen.getByText("Veja seu momento")).toBeInTheDocument();
    expect(screen.getByText("Registre com facilidade")).toBeInTheDocument();
    expect(screen.getByText("Acompanhe objetivos")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ir para a aba de lançamentos" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Começar lançamentos")).toBeInTheDocument();
    expect(screen.getByText("Calendário")).toBeInTheDocument();
    expect(screen.getByText("Extrato")).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });

  it("deve renderizar de forma estavel com as props minimas validas", () => {
    renderDashboardHomeView();

    expect(screen.getByText("Saldo, entradas e saídas num relance.")).toBeInTheDocument();
    expect(screen.getByText("Adicione movimentações sem perder clareza.")).toBeInTheDocument();
    expect(screen.getByText("Metas e insights no seu caminho.")).toBeInTheDocument();
  });

  it("deve chamar onGoToTransactions ao clicar no botão principal da hero", async () => {
    const user = userEvent.setup();
    const onGoToTransactions = vi.fn();

    renderDashboardHomeView({ onGoToTransactions });

    await user.click(
      screen.getByRole("button", { name: "Ir para a aba de lançamentos" }),
    );

    expect(onGoToTransactions).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole("button", { name: /ir para o resumo financeiro/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /ir para novo lançamento/i }),
    ).not.toBeInTheDocument();
  });
});
