import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { GoalProgressModal } from "@/components/dashboard/goal-progress-modal";
import type { Goal } from "@/types/goal";

function createGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: "goal-1",
    title: "Reserva de emergência",
    targetAmount: 10000,
    currentAmount: 2500,
    category: "geral",
    deadline: "2026-12-31",
    ...overrides,
  } as Goal;
}

describe("GoalProgressModal", () => {
  it("não deve renderizar quando open for false", () => {
    render(
      <GoalProgressModal
        goal={createGoal()}
        open={false}
        onOpenChange={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(screen.queryByText("Atualizar progresso")).not.toBeInTheDocument();
  });

  it("deve renderizar título, descrição e nome da meta quando open for true", () => {
    render(
      <GoalProgressModal
        goal={createGoal()}
        open
        onOpenChange={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByText("Atualizar progresso")).toBeInTheDocument();
    expect(
      screen.getByText("Ajuste o valor que você já guardou nessa meta."),
    ).toBeInTheDocument();
    expect(screen.getByText("Reserva de emergência")).toBeInTheDocument();
  });

  it("deve chamar onOpenChange(false) ao clicar em Fechar", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(
      <GoalProgressModal
        goal={createGoal()}
        open
        onOpenChange={onOpenChange}
        onSave={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Fechar" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("deve chamar onOpenChange(false) ao clicar em Cancelar", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(
      <GoalProgressModal
        goal={createGoal()}
        open
        onOpenChange={onOpenChange}
        onSave={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("deve chamar onSave com id e currentAmount corretos ao salvar", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <GoalProgressModal
        goal={createGoal()}
        open
        onOpenChange={onOpenChange}
        onSave={onSave}
      />,
    );

    const input = screen.getByLabelText("Valor atual");
    await user.clear(input);
    await user.type(input, "3500");

    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onSave).toHaveBeenCalledWith({
      id: "goal-1",
      currentAmount: 3500,
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("não deve salvar quando o valor for inválido", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <GoalProgressModal
        goal={createGoal()}
        open
        onOpenChange={onOpenChange}
        onSave={onSave}
      />,
    );

    const input = screen.getByLabelText("Valor atual");
    await user.clear(input);
    await user.type(input, "-10");

    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onSave).not.toHaveBeenCalled();
  });

  it("deve fechar ao pressionar Escape", async () => {
    const onOpenChange = vi.fn();

    render(
      <GoalProgressModal
        goal={createGoal()}
        open
        onOpenChange={onOpenChange}
        onSave={vi.fn()}
      />,
    );

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
