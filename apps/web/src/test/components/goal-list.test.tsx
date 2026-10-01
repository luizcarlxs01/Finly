import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GoalList } from "@/components/dashboard/goal-list";
import type { Goal } from "@/types/goal";

const goal: Goal = { id: "one", title: "Reserva", targetAmount: 1000, currentAmount: 250, category: "geral", createdAt: "2026-09-01T12:00:00Z" };

describe("GoalList", () => {
  it("shows no message without goals and suggests the current amount for an active goal", () => {
    const onUpdateProgress = vi.fn(); const onRemoveGoal = vi.fn();
    const { rerender } = render(<GoalList goals={[]} onUpdateProgress={onUpdateProgress} onRemoveGoal={onRemoveGoal} />);
    expect(screen.queryByText(/Nenhuma meta/)).not.toBeInTheDocument();
    rerender(<GoalList goals={[]} noResults onUpdateProgress={onUpdateProgress} onRemoveGoal={onRemoveGoal} />);
    expect(screen.getByText("Nenhuma meta corresponde à busca ou aos filtros.")).toBeInTheDocument();
    rerender(<GoalList goals={[goal]} onUpdateProgress={onUpdateProgress} onRemoveGoal={onRemoveGoal} />);
    expect(screen.getByText("Reserva")).toBeInTheDocument();
    expect(screen.getByLabelText("Progresso: 25%")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /\+ R\$\s*250,00/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+ Adicionar" })).toBeInTheDocument();
  });

  it("suggests R$ 1,00 for a goal created with zero and hides quick add for completed goals", async () => {
    const user = userEvent.setup(); const onAddContribution = vi.fn(async () => {});
    const { rerender } = render(<GoalList goals={[{ ...goal, currentAmount: 0 }]} onAddContribution={onAddContribution} onUpdateProgress={vi.fn()} onRemoveGoal={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /\+ R\$\s*1,00/ }));
    expect(onAddContribution).toHaveBeenCalledWith(expect.objectContaining({ currentAmount: 0 }), 1);
    rerender(<GoalList goals={[{ ...goal, currentAmount: 1000 }]} lastContributions={{ one: 50 }} onUpdateProgress={vi.fn()} onRemoveGoal={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /\+ R\$/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "+ Adicionar" })).not.toBeInTheDocument();
  });

  it("uses the contribution callback and preserves the edit/delete actions", async () => {
    const user = userEvent.setup(); const onAddContribution = vi.fn(async () => {}); const onUpdateProgress = vi.fn(); const onRemoveGoal = vi.fn();
    render(<GoalList goals={[goal]} lastContributions={{ one: 50 }} onAddContribution={onAddContribution} onUpdateProgress={onUpdateProgress} onRemoveGoal={onRemoveGoal} />);
    await user.click(screen.getByRole("button", { name: /\+ R\$/ }));
    expect(onAddContribution).toHaveBeenCalledWith(goal, 50);
    await user.click(screen.getByRole("button", { name: "Opções de Reserva" }));
    await user.click(screen.getByRole("button", { name: "Editar valor" }));
    expect(onUpdateProgress).toHaveBeenCalledWith(goal);
    await user.click(screen.getByRole("button", { name: "Opções de Reserva" }));
    await user.click(screen.getByRole("button", { name: "Deletar" }));
    expect(onRemoveGoal).toHaveBeenCalledWith("one");
  });

  it("reenables quick contribution after a failed write without changing the displayed amount", async () => {
    const user = userEvent.setup(); const onAddContribution = vi.fn(async () => { throw new Error("Falha"); });
    render(<GoalList goals={[goal]} lastContributions={{ one: 50 }} onAddContribution={onAddContribution} onUpdateProgress={vi.fn()} onRemoveGoal={vi.fn()} />);
    const quick = screen.getByRole("button", { name: /\+ R\$/ });
    await user.click(quick);
    expect(onAddContribution).toHaveBeenCalledOnce();
    expect(quick).toBeEnabled();
    expect(screen.getByLabelText("Progresso: 25%")).toBeInTheDocument();
  });
});
