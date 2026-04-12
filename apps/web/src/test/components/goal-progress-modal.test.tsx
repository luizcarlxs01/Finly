import { describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { GoalProgressModal } from "@/components/dashboard/goal-progress-modal";
import type { Goal } from "@/types/goal";

function createGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: "goal-1",
    title: "Reserva de emergencia",
    targetAmount: 10000,
    currentAmount: 2500,
    category: "geral",
    deadline: "2026-12-31",
    createdAt: "2026-04-01T12:00:00.000Z",
    ...overrides,
  };
}

function renderGoalProgressModal(
  overrides: Partial<React.ComponentProps<typeof GoalProgressModal>> = {},
) {
  const props: React.ComponentProps<typeof GoalProgressModal> = {
    goal: createGoal(),
    open: true,
    onOpenChange: vi.fn(),
    onSave: vi.fn(),
    ...overrides,
  };

  return {
    ...render(<GoalProgressModal {...props} />),
    props,
  };
}

describe("GoalProgressModal", () => {
  it("deve renderizar o modal aberto com os dados iniciais da meta", () => {
    renderGoalProgressModal();

    expect(screen.getByText("Atualizar progresso")).toBeInTheDocument();
    expect(
      screen.getByText("Ajuste o valor que você já guardou nessa meta."),
    ).toBeInTheDocument();
    expect(screen.getByText("Meta")).toBeInTheDocument();
    expect(screen.getByText("Reserva de emergencia")).toBeInTheDocument();
    expect(screen.getByLabelText("Valor atual")).toHaveValue(2500);
    expect(screen.getByRole("button", { name: "Fechar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument();
  });

  it("nao deve renderizar conteudo relevante quando estiver fechado ou sem meta", () => {
    const { rerender } = render(
      <GoalProgressModal
        goal={createGoal()}
        open={false}
        onOpenChange={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(screen.queryByText("Atualizar progresso")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Valor atual")).not.toBeInTheDocument();

    rerender(
      <GoalProgressModal
        goal={null}
        open
        onOpenChange={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(screen.queryByText("Atualizar progresso")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Valor atual")).not.toBeInTheDocument();
  });

  it("deve permitir editar o progresso manualmente e salvar com os dados corretos", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onOpenChange = vi.fn();

    renderGoalProgressModal({ onSave, onOpenChange });

    const input = screen.getByLabelText("Valor atual");
    await user.clear(input);
    await user.type(input, "3500.5");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onSave).toHaveBeenCalledWith({
      id: "goal-1",
      currentAmount: 3500.5,
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("deve fechar ao clicar em Fechar, em Cancelar e ao pressionar Escape", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    renderGoalProgressModal({ onOpenChange });

    await user.click(screen.getByRole("button", { name: "Fechar" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(onOpenChange).toHaveBeenNthCalledWith(1, false);
    expect(onOpenChange).toHaveBeenNthCalledWith(2, false);
    expect(onOpenChange).toHaveBeenNthCalledWith(3, false);
  });

  it("deve exibir corretamente estados limite de progresso zerado e meta concluida", () => {
    render(
      <GoalProgressModal
        goal={createGoal({
          id: "goal-zero",
          title: "Viagem",
          currentAmount: 0,
        })}
        open
        onOpenChange={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByText("Viagem")).toBeInTheDocument();
    expect(screen.getByLabelText("Valor atual")).toHaveValue(0);

    cleanup();

    render(
      <GoalProgressModal
        goal={createGoal({
          id: "goal-complete",
          title: "Reserva concluida",
          currentAmount: 10000,
        })}
        open
        onOpenChange={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByText("Reserva concluida")).toBeInTheDocument();
    expect(screen.getByLabelText("Valor atual")).toHaveValue(10000);
  });

  it("nao deve salvar quando o valor informado for invalido", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onOpenChange = vi.fn();

    renderGoalProgressModal({ onSave, onOpenChange });

    const input = screen.getByLabelText("Valor atual");
    await user.clear(input);
    await user.type(input, "-10");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onSave).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
