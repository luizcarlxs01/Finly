import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { Goal } from "@/types/goal";

vi.mock("@/components/dashboard/goal-form", () => ({
  GoalForm: ({
    onAddGoal,
  }: {
    onAddGoal: (input: {
      title: string;
      targetAmount: number;
      currentAmount: number;
      category: string;
      deadline?: string;
    }) => void;
  }) => (
    <div>
      <p>GoalForm</p>
      <button
        type="button"
        onClick={() =>
          onAddGoal({
            title: "Nova meta",
            targetAmount: 5000,
            currentAmount: 500,
            category: "general",
            deadline: "2026-12-31",
          })
        }
      >
        Trigger add goal
      </button>
    </div>
  ),
}));

vi.mock("@/components/dashboard/goal-list", () => ({
  GoalList: ({
    goals,
    onUpdateProgress,
    onRemoveGoal,
  }: {
    goals: Goal[];
    onUpdateProgress: (goal: Goal) => void;
    onRemoveGoal: (id: string) => void;
  }) => (
    <div>
      <p>GoalList</p>
      <p>Quantidade metas list: {goals.length}</p>
      {goals.length === 0 ? <p>Nenhuma meta por aqui ainda</p> : null}
      {goals.map((goal) => (
        <div key={goal.id}>
          <p>{goal.title}</p>
          <p>
            {goal.currentAmount >= goal.targetAmount ? "Concluída" : "Em andamento"}
          </p>
          <button type="button" onClick={() => onUpdateProgress(goal)}>
            Trigger update progress {goal.id}
          </button>
          <button type="button" onClick={() => onRemoveGoal(goal.id)}>
            Trigger remove goal {goal.id}
          </button>
        </div>
      ))}
    </div>
  ),
}));

import { DashboardGoalsView } from "@/components/dashboard/views/dashboard-goals-view";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function getByExactText(value: string) {
  return screen.getByText(
    (_, element) =>
      element?.textContent === value && (element.children.length ?? 0) === 0,
  );
}

function getAllByExactText(value: string) {
  return screen.getAllByText(
    (_, element) =>
      element?.textContent === value && (element.children.length ?? 0) === 0,
  );
}

function createGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: "goal-1",
    title: "Reserva de emergencia",
    targetAmount: 10000,
    currentAmount: 2500,
    category: "general",
    deadline: "2026-12-31",
    createdAt: "2026-04-01T12:00:00.000Z",
    ...overrides,
  };
}

function renderDashboardGoalsView(
  overrides: Partial<React.ComponentProps<typeof DashboardGoalsView>> = {},
) {
  const goals = [createGoal()];

  const props: React.ComponentProps<typeof DashboardGoalsView> = {
    goals,
    totalGoalProgress: 2500,
    remainingGoalAmount: 7500,
    currencyFormatter,
    onAddGoal: vi.fn(),
    onUpdateProgress: vi.fn(),
    onRemoveGoal: vi.fn(),
    ...overrides,
  };

  return {
    ...render(<DashboardGoalsView {...props} />),
    props,
  };
}

describe("DashboardGoalsView", () => {
  it("deve renderizar os blocos principais da view com dados completos", () => {
    renderDashboardGoalsView({
      goals: [
        createGoal(),
        createGoal({
          id: "goal-2",
          title: "Viagem",
          targetAmount: 3000,
          currentAmount: 3000,
          category: "lazer",
        }),
      ],
      totalGoalProgress: 5500,
      remainingGoalAmount: 7500,
    });

    expect(screen.getByText("Metas")).toBeInTheDocument();
    expect(
      screen.getByText("Organize seus objetivos e acompanhe o quanto falta para chegar lá."),
    ).toBeInTheDocument();
    expect(screen.getByText("Metas ativas")).toBeInTheDocument();
    expect(screen.getByText("Acumulado")).toBeInTheDocument();
    expect(screen.getByText("Falta")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(getByExactText(currencyFormatter.format(5500))).toBeInTheDocument();
    expect(getByExactText(currencyFormatter.format(7500))).toBeInTheDocument();
    expect(screen.getByText("GoalForm")).toBeInTheDocument();
    expect(screen.getByText("GoalList")).toBeInTheDocument();
    expect(screen.getByText("Reserva de emergencia")).toBeInTheDocument();
    expect(screen.getByText("Viagem")).toBeInTheDocument();
  });

  it("deve renderizar de forma estavel com dados minimos validos", () => {
    renderDashboardGoalsView({
      goals: [
        createGoal({
          id: "goal-minimal",
          title: "Meta simples",
          targetAmount: 1,
          currentAmount: 0,
          deadline: undefined,
        }),
      ],
      totalGoalProgress: 0,
      remainingGoalAmount: 1,
    });

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(getByExactText(currencyFormatter.format(0))).toBeInTheDocument();
    expect(getByExactText(currencyFormatter.format(1))).toBeInTheDocument();
    expect(screen.getByText("Meta simples")).toBeInTheDocument();
    expect(screen.getByText("Em andamento")).toBeInTheDocument();
  });

  it("deve exibir o comportamento condicional de ausencia de metas quando a lista estiver vazia", () => {
    renderDashboardGoalsView({
      goals: [],
      totalGoalProgress: 0,
      remainingGoalAmount: 0,
    });

    expect(screen.getByText("0")).toBeInTheDocument();
    expect(getAllByExactText(currencyFormatter.format(0))).toHaveLength(2);
    expect(screen.getByText("Quantidade metas list: 0")).toBeInTheDocument();
    expect(screen.getByText("Nenhuma meta por aqui ainda")).toBeInTheDocument();
  });

  it("deve disparar os callbacks expostos pela view a partir das acoes dos filhos", async () => {
    const user = userEvent.setup();
    const onAddGoal = vi.fn();
    const onUpdateProgress = vi.fn();
    const onRemoveGoal = vi.fn();
    const goal = createGoal({ id: "goal-action", title: "Casa" });

    renderDashboardGoalsView({
      goals: [goal],
      totalGoalProgress: 2500,
      remainingGoalAmount: 7500,
      onAddGoal,
      onUpdateProgress,
      onRemoveGoal,
    });

    await user.click(screen.getByRole("button", { name: "Trigger add goal" }));
    await user.click(
      screen.getByRole("button", { name: "Trigger update progress goal-action" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Trigger remove goal goal-action" }),
    );

    expect(onAddGoal).toHaveBeenCalledWith({
      title: "Nova meta",
      targetAmount: 5000,
      currentAmount: 500,
      category: "general",
      deadline: "2026-12-31",
    });
    expect(onUpdateProgress).toHaveBeenCalledWith(goal);
    expect(onRemoveGoal).toHaveBeenCalledWith("goal-action");
  });

  it("deve refletir diferencas visuais observaveis entre metas concluidas e nao concluidas quando os filhos as exibem", () => {
    renderDashboardGoalsView({
      goals: [
        createGoal({
          id: "goal-open",
          title: "Reserva",
          targetAmount: 1000,
          currentAmount: 200,
        }),
        createGoal({
          id: "goal-done",
          title: "Notebook",
          targetAmount: 3000,
          currentAmount: 3000,
        }),
      ],
      totalGoalProgress: 3200,
      remainingGoalAmount: 800,
    });

    expect(screen.getByText("Reserva")).toBeInTheDocument();
    expect(screen.getByText("Notebook")).toBeInTheDocument();
    expect(screen.getByText("Em andamento")).toBeInTheDocument();
    expect(screen.getByText("Concluída")).toBeInTheDocument();
  });
});
