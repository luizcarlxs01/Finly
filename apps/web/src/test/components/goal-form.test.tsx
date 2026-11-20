import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GoalForm } from "@/components/dashboard/goal-form";

describe("GoalForm", () => {
  it("renders the creation fields and cancel action", async () => {
    const user = userEvent.setup(); const onCancel = vi.fn();
    render(<GoalForm onAddGoal={vi.fn()} onCancel={onCancel} />);
    expect(screen.getByLabelText("Título")).toHaveValue("");
    expect(screen.getByLabelText("Valor alvo")).toHaveValue("");
    expect(screen.getByLabelText("Valor atual")).toHaveValue("");
    expect(screen.getByLabelText("Categoria")).toHaveValue("general");
    expect(screen.getByLabelText("Prazo")).toBeRequired();
    expect(screen.getByRole("button", { name: "Criar meta" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("submits validated values and resets after success", async () => {
    const user = userEvent.setup(); const onAddGoal = vi.fn(async () => {});
    render(<GoalForm onAddGoal={onAddGoal} />);
    await user.type(screen.getByLabelText("Título"), " Reserva ");
    await user.type(screen.getByLabelText("Valor alvo"), "1000");
    await user.type(screen.getByLabelText("Valor atual"), "250");
    await user.click(screen.getByRole("button", { name: "Criar meta" }));
    expect(onAddGoal).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Prazo"), { target: { value: "2099-12-31" } });
    await user.click(screen.getByRole("button", { name: "Criar meta" }));
    expect(onAddGoal).toHaveBeenCalledWith({ title: "Reserva", targetAmount: 1000, currentAmount: 250, category: "general", deadline: "2099-12-31" });
    expect(screen.getByLabelText("Título")).toHaveValue("");
  });

  it("rejects invalid amounts and preserves the existing fields when save fails", async () => {
    const user = userEvent.setup(); const onAddGoal = vi.fn(async () => { throw new Error("Falha"); });
    render(<GoalForm onAddGoal={onAddGoal} />);
    await user.type(screen.getByLabelText("Título"), "Reserva");
    await user.type(screen.getByLabelText("Valor alvo"), "0");
    await user.click(screen.getByRole("button", { name: "Criar meta" }));
    expect(onAddGoal).not.toHaveBeenCalled();
    await user.clear(screen.getByLabelText("Valor alvo"));
    await user.type(screen.getByLabelText("Valor alvo"), "500");
    fireEvent.change(screen.getByLabelText("Prazo"), { target: { value: "2099-12-31" } });
    await user.click(screen.getByRole("button", { name: "Criar meta" }));
    expect(screen.getByLabelText("Título")).toHaveValue("Reserva");
  });
});
