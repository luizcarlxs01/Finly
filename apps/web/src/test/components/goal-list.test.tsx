import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { GoalList } from "@/components/dashboard/goal-list";
import type { Goal } from "@/types/goal";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

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

function getGoalCard(title: string) {
  return screen.getByText(title).closest('[data-slot="card"]');
}

function getByExactText(scope: ReturnType<typeof within>, value: string) {
  return scope.getByText((_, element) => element?.textContent === value);
}

function getAllByExactText(scope: ReturnType<typeof within>, value: string) {
  return scope.getAllByText((_, element) => element?.textContent === value);
}

function renderGoalList(
  overrides: Partial<React.ComponentProps<typeof GoalList>> = {},
) {
  const props: React.ComponentProps<typeof GoalList> = {
    goals: [createGoal()],
    onUpdateProgress: vi.fn(),
    onRemoveGoal: vi.fn(),
    ...overrides,
  };

  return {
    ...render(<GoalList {...props} />),
    props,
  };
}

describe("GoalList", () => {
  it("deve renderizar estado vazio quando nao houver metas", () => {
    renderGoalList({ goals: [] });

    expect(screen.getByText("Nenhuma meta por aqui ainda")).toBeInTheDocument();
    expect(
      screen.getByText("Crie uma meta para começar a acompanhar sua evolução."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Atualizar progresso" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Remover" }),
    ).not.toBeInTheDocument();
  });

  it("deve renderizar uma ou mais metas com suas informacoes principais", () => {
    const goals = [
      createGoal(),
      createGoal({
        id: "goal-2",
        title: "Viagem",
        targetAmount: 3000,
        currentAmount: 300,
        category: "lazer",
        deadline: undefined,
      }),
    ];

    renderGoalList({ goals });

    expect(screen.getByText("Reserva de emergencia")).toBeInTheDocument();
    expect(screen.getByText("Viagem")).toBeInTheDocument();
    expect(screen.getByText("Geral")).toBeInTheDocument();
    expect(screen.getByText("Lazer")).toBeInTheDocument();
    expect(
      screen.getByText(dateFormatter.format(new Date("2026-12-31"))),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Progresso")).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Atualizar progresso" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Remover" })).toHaveLength(2);
  });

  it("deve exibir progresso, valores monetarios e falta de forma consistente para metas nao concluidas e concluidas", () => {
    renderGoalList({
      goals: [
        createGoal({
          id: "goal-in-progress",
          title: "Casa",
          targetAmount: 8000,
          currentAmount: 2000,
        }),
        createGoal({
          id: "goal-complete",
          title: "Viagem concluida",
          targetAmount: 5000,
          currentAmount: 6000,
          category: "lazer",
        }),
      ],
    });

    const inProgressCard = getGoalCard("Casa");
    const completeCard = getGoalCard("Viagem concluida");

    expect(inProgressCard).not.toBeNull();
    expect(completeCard).not.toBeNull();

    const inProgressScope = within(inProgressCard!);
    const completeScope = within(completeCard!);

    expect(getByExactText(inProgressScope, "25%")).toBeInTheDocument();
    expect(
      getByExactText(inProgressScope, currencyFormatter.format(8000)),
    ).toBeInTheDocument();
    expect(
      getByExactText(inProgressScope, currencyFormatter.format(2000)),
    ).toBeInTheDocument();
    expect(
      getByExactText(inProgressScope, currencyFormatter.format(6000)),
    ).toBeInTheDocument();

    expect(getByExactText(completeScope, "100%")).toBeInTheDocument();
    expect(
      getByExactText(completeScope, currencyFormatter.format(5000)),
    ).toBeInTheDocument();
    expect(
      getByExactText(completeScope, currencyFormatter.format(6000)),
    ).toBeInTheDocument();
    expect(
      getByExactText(completeScope, currencyFormatter.format(0)),
    ).toBeInTheDocument();
  });

  it("deve disparar os callbacks de atualizar progresso e remover com os dados corretos", async () => {
    const user = userEvent.setup();
    const goal = createGoal({ id: "goal-action", title: "Notebook" });
    const onUpdateProgress = vi.fn();
    const onRemoveGoal = vi.fn();

    renderGoalList({
      goals: [goal],
      onUpdateProgress,
      onRemoveGoal,
    });

    await user.click(screen.getByRole("button", { name: "Atualizar progresso" }));
    await user.click(screen.getByRole("button", { name: "Remover" }));

    expect(onUpdateProgress).toHaveBeenCalledWith(goal);
    expect(onRemoveGoal).toHaveBeenCalledWith("goal-action");
  });

  it("deve renderizar de forma consistente com dados minimos validos", () => {
    renderGoalList({
      goals: [
        createGoal({
          id: "goal-minimal",
          title: "Meta simples",
          targetAmount: 1,
          currentAmount: 0,
          category: "general",
          deadline: undefined,
        }),
      ],
    });

    expect(screen.getByText("Meta simples")).toBeInTheDocument();
    expect(screen.getByText("Geral")).toBeInTheDocument();
    const minimalScope = within(getGoalCard("Meta simples")!);

    expect(getByExactText(minimalScope, "0%")).toBeInTheDocument();
    expect(getAllByExactText(minimalScope, currencyFormatter.format(1))).toHaveLength(2);
    expect(
      getByExactText(minimalScope, currencyFormatter.format(0)),
    ).toBeInTheDocument();
  });
});
