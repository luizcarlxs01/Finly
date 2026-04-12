import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DashboardHomeView } from "@/components/dashboard/views/dashboard-home-view";

describe("DashboardHomeView", () => {
  it("deve chamar onGoToTransactions ao clicar no botão principal da hero", async () => {
    const user = userEvent.setup();
    const onGoToTransactions = vi.fn();

    render(<DashboardHomeView onGoToTransactions={onGoToTransactions} />);

    await user.click(
      screen.getByRole("button", { name: /ir para a aba de lançamentos/i }),
    );

    expect(onGoToTransactions).toHaveBeenCalledTimes(1);
  });

  it("não deve renderizar os botões antigos da hero", () => {
    render(<DashboardHomeView onGoToTransactions={vi.fn()} />);

    expect(
      screen.queryByRole("button", { name: /ver resumo/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /fazer lançamento/i }),
    ).not.toBeInTheDocument();
  });
});
