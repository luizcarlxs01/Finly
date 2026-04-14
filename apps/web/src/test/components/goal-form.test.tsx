import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { GoalForm } from "@/components/dashboard/goal-form";

function renderGoalForm(
  overrides: Partial<React.ComponentProps<typeof GoalForm>> = {},
) {
  const props: React.ComponentProps<typeof GoalForm> = {
    onAddGoal: vi.fn(),
    ...overrides,
  };

  return {
    ...render(<GoalForm {...props} />),
    props,
  };
}

describe("GoalForm", () => {
  it("deve renderizar os campos principais com defaults relevantes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-10T12:00:00.000Z"));

    renderGoalForm();

    expect(screen.getByText("Nova meta")).toBeInTheDocument();
    expect(screen.getByLabelText("Título")).toHaveValue("");
    expect(screen.getByLabelText("Valor alvo")).toHaveValue(null);
    expect(screen.getByLabelText("Valor atual")).toHaveValue(null);
    expect(screen.getByLabelText("Categoria")).toHaveValue("general");
    expect(screen.getByLabelText("Prazo")).toHaveValue("");
    expect(screen.getByLabelText("Prazo")).toHaveAttribute("min", "2026-04-10");
    expect(screen.getByRole("button", { name: "Salvar meta" })).toBeInTheDocument();

    vi.useRealTimers();
  });

  it("deve preencher e enviar uma meta minima valida com currentAmount padrao igual a zero", async () => {
    const user = userEvent.setup();
    const onAddGoal = vi.fn();

    renderGoalForm({ onAddGoal });

    await user.type(screen.getByLabelText("Título"), "  Reserva  ");
    await user.type(screen.getByLabelText("Valor alvo"), "1000");
    await user.click(screen.getByRole("button", { name: "Salvar meta" }));

    expect(onAddGoal).toHaveBeenCalledWith({
      title: "Reserva",
      targetAmount: 1000,
      currentAmount: 0,
      category: "general",
      deadline: undefined,
    });
  });

  it("deve preencher e enviar uma meta completa com numeros e data corretos", async () => {
    const user = userEvent.setup();
    const onAddGoal = vi.fn();

    renderGoalForm({ onAddGoal });

    await user.type(screen.getByLabelText("Título"), "Viagem internacional");
    await user.type(screen.getByLabelText("Valor alvo"), "12500.5");
    await user.type(screen.getByLabelText("Valor atual"), "2300.75");
    await user.selectOptions(screen.getByLabelText("Categoria"), "lazer");
    await user.type(screen.getByLabelText("Prazo"), "2026-12-20");
    await user.click(screen.getByRole("button", { name: "Salvar meta" }));

    expect(onAddGoal).toHaveBeenCalledWith({
      title: "Viagem internacional",
      targetAmount: 12500.5,
      currentAmount: 2300.75,
      category: "lazer",
      deadline: "2026-12-20",
    });
  });

  it("deve limpar o formulario apos submit valido", async () => {
    const user = userEvent.setup();

    renderGoalForm();

    await user.type(screen.getByLabelText("Título"), "Casa");
    await user.type(screen.getByLabelText("Valor alvo"), "50000");
    await user.type(screen.getByLabelText("Valor atual"), "4000");
    await user.selectOptions(screen.getByLabelText("Categoria"), "moradia");
    await user.type(screen.getByLabelText("Prazo"), "2027-01-15");
    await user.click(screen.getByRole("button", { name: "Salvar meta" }));

    expect(screen.getByLabelText("Título")).toHaveValue("");
    expect(screen.getByLabelText("Valor alvo")).toHaveValue(null);
    expect(screen.getByLabelText("Valor atual")).toHaveValue(null);
    expect(screen.getByLabelText("Categoria")).toHaveValue("general");
    expect(screen.getByLabelText("Prazo")).toHaveValue("");
  });

  it("nao deve disparar callback quando os dados forem invalidos", async () => {
    const user = userEvent.setup();
    const onAddGoal = vi.fn();

    renderGoalForm({ onAddGoal });

    await user.type(screen.getByLabelText("Título"), "   ");
    await user.type(screen.getByLabelText("Valor alvo"), "0");
    await user.type(screen.getByLabelText("Valor atual"), "-10");
    await user.click(screen.getByRole("button", { name: "Salvar meta" }));

    expect(onAddGoal).not.toHaveBeenCalled();
  });
});
