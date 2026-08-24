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
  it("renderiza a experiência cinematográfica como conteúdo oficial da Home", () => {
    renderDashboardHomeView();

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Seu dinheiro. Mais claro todos os dias.",
      }),
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
    expect(screen.queryByText("Calendário")).not.toBeInTheDocument();
    expect(screen.queryByText("Extrato")).not.toBeInTheDocument();
  });

  it("mantém os dois CTAs conectados a onGoToTransactions", async () => {
    const user = userEvent.setup();
    const onGoToTransactions = vi.fn();

    renderDashboardHomeView({ onGoToTransactions });

    const transactionButtons = screen.getAllByRole("button", {
      name: "Ir para a aba de lançamentos",
    });
    expect(transactionButtons).toHaveLength(2);

    await user.click(transactionButtons[0]);
    await user.click(transactionButtons[1]);

    expect(onGoToTransactions).toHaveBeenCalledTimes(2);
  });
});
