<<<<<<< HEAD
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
=======
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DashboardHomeView } from "@/components/dashboard/views/dashboard-home-view";

function renderDashboardHomeView(
  overrides: Partial<React.ComponentProps<typeof DashboardHomeView>> = {},
) {
  const props: React.ComponentProps<typeof DashboardHomeView> = {
    onGoToTransactions: vi.fn(),
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
    expect(screen.getByText("Seu financeiro mais claro, simples e organizado.")).toBeInTheDocument();
    expect(screen.getByText("Você já pode usar o Finly agora")).toBeInTheDocument();
    expect(screen.getByText("O que você já pode fazer")).toBeInTheDocument();
    expect(screen.getByText("O Finly ainda pode crescer com você")).toBeInTheDocument();
  });

  it("deve exibir os resumos, cards e links principais da interface atual", () => {
    renderDashboardHomeView();

    expect(screen.getByText("Veja seu momento")).toBeInTheDocument();
    expect(screen.getByText("Registre com facilidade")).toBeInTheDocument();
    expect(screen.getByText("Acompanhe objetivos")).toBeInTheDocument();
    expect(screen.getByText("Seus dados ficam aqui")).toBeInTheDocument();
    expect(screen.getByText("Vale lembrar")).toBeInTheDocument();
    expect(screen.getByText("Começo sem fricção")).toBeInTheDocument();
    expect(
      screen.getByText("Conta para acessar seus dados com mais continuidade"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Sincronização entre dispositivos"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ir para o resumo financeiro" }),
    ).toHaveAttribute("href", "#resumo-financeiro");
    expect(
      screen.getByRole("button", { name: "Ir para novo lançamento" }),
    ).toHaveAttribute("href", "#nova-transacao");
  });

  it("deve renderizar de forma estavel com as props minimas validas", () => {
    renderDashboardHomeView();

    expect(screen.getByText("Modo atual")).toBeInTheDocument();
    expect(screen.getByText("Em evolução")).toBeInTheDocument();
    expect(screen.getByText("Acompanhar seu saldo")).toBeInTheDocument();
    expect(screen.getByText("Registrar lançamentos")).toBeInTheDocument();
    expect(screen.getByText("Organizar categorias")).toBeInTheDocument();
    expect(screen.getByText("Seguir metas")).toBeInTheDocument();
  });

  it("deve manter a interface observavel estavel ao interagir com os links principais", async () => {
    const user = userEvent.setup();
    const onGoToTransactions = vi.fn();

    renderDashboardHomeView({ onGoToTransactions });

    await user.click(
      screen.getByRole("button", { name: "Ir para o resumo financeiro" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Ir para novo lançamento" }),
    );

    expect(onGoToTransactions).not.toHaveBeenCalled();
    expect(screen.getByText("Seu financeiro mais claro, simples e organizado.")).toBeInTheDocument();
>>>>>>> luiz
  });
});
