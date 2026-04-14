import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useLocalGoals } from "@/hooks/use-local-goals";
import type { Goal } from "@/types/goal";

const LOCAL_STORAGE_KEY = "finly:local-goals";

function createStoredGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: "goal-1",
    title: "Reserva",
    targetAmount: 1000,
    currentAmount: 200,
    category: "general",
    deadline: "2026-12-31",
    createdAt: "2026-04-01T12:00:00.000Z",
    ...overrides,
  };
}

function getPersistedGoals() {
  return JSON.parse(
    window.localStorage.getItem(LOCAL_STORAGE_KEY) ?? "[]",
  ) as Goal[];
}

async function renderLoadedHook() {
  const rendered = renderHook(() => useLocalGoals());

  await waitFor(() => {
    expect(rendered.result.current.isLoaded).toBe(true);
  });

  return rendered;
}

describe("useLocalGoals", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("deve hidratar o estado inicial a partir do localStorage mantendo os dados consistentes", async () => {
    window.localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify([
        createStoredGoal({
          id: "goal-older",
          title: "Viagem",
          targetAmount: "1500" as unknown as number,
          currentAmount: "1500" as unknown as number,
          category: "  LAZER  ",
          deadline: " 2026-11-20 ",
          createdAt: "2026-04-01T12:00:00.000Z",
        }),
        createStoredGoal({
          id: "goal-newer",
          title: "Reserva de emergencia",
          targetAmount: "2000" as unknown as number,
          currentAmount: "500" as unknown as number,
          category: " ",
          deadline: "   ",
          createdAt: "2026-04-03T12:00:00.000Z",
        }),
      ]),
    );

    const { result } = await renderLoadedHook();

    expect(result.current.goals).toHaveLength(2);
    expect(result.current.goals.map((goal) => goal.id)).toEqual([
      "goal-newer",
      "goal-older",
    ]);
    expect(result.current.goals).toEqual([
      expect.objectContaining({
        id: "goal-newer",
        title: "Reserva de emergencia",
        targetAmount: 2000,
        currentAmount: 500,
        category: "general",
        deadline: undefined,
      }),
      expect.objectContaining({
        id: "goal-older",
        title: "Viagem",
        targetAmount: 1500,
        currentAmount: 1500,
        category: "lazer",
        deadline: "2026-11-20",
      }),
    ]);
    expect(result.current.totalGoalTarget).toBe(3500);
    expect(result.current.totalGoalProgress).toBe(2000);
  });

  it("deve iniciar vazio quando o storage estiver vazio e persistir o estado padrao", async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");

    const { result } = await renderLoadedHook();

    expect(result.current.goals).toEqual([]);
    expect(result.current.totalGoalTarget).toBe(0);
    expect(result.current.totalGoalProgress).toBe(0);

    await waitFor(() => {
      expect(setItemSpy).toHaveBeenCalledWith(
        LOCAL_STORAGE_KEY,
        JSON.stringify([]),
      );
    });
  });

  it("deve usar fallback vazio quando encontrar JSON invalido no storage", async () => {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, "{invalido");

    const { result } = await renderLoadedHook();

    expect(result.current.goals).toEqual([]);
    expect(result.current.totalGoalTarget).toBe(0);
    expect(result.current.totalGoalProgress).toBe(0);

    await waitFor(() => {
      expect(window.localStorage.getItem(LOCAL_STORAGE_KEY)).toBe(
        JSON.stringify([]),
      );
    });
  });

  it("deve criar, atualizar progresso e remover metas persistindo as alteracoes", async () => {
    const randomUuidSpy = vi
      .spyOn(globalThis.crypto, "randomUUID")
      .mockReturnValue("generated-goal-id");

    const { result } = await renderLoadedHook();

    act(() => {
      result.current.addGoal({
        title: "  Reserva da casa  ",
        targetAmount: 5000,
        currentAmount: 1200,
        category: "  MORADIA  ",
        deadline: " 2026-12-25 ",
      });
    });

    await waitFor(() => {
      expect(result.current.goals).toHaveLength(1);
    });

    expect(randomUuidSpy).toHaveBeenCalled();
    expect(result.current.goals[0]).toMatchObject({
      id: "generated-goal-id",
      title: "Reserva da casa",
      targetAmount: 5000,
      currentAmount: 1200,
      category: "moradia",
      deadline: "2026-12-25",
    });
    expect(result.current.totalGoalTarget).toBe(5000);
    expect(result.current.totalGoalProgress).toBe(1200);

    await waitFor(() => {
      expect(getPersistedGoals()).toEqual(result.current.goals);
    });

    act(() => {
      result.current.updateGoalProgress({
        id: "generated-goal-id",
        currentAmount: 5000,
      });
    });

    await waitFor(() => {
      expect(result.current.goals[0]).toMatchObject({
        id: "generated-goal-id",
        currentAmount: 5000,
      });
    });

    expect(result.current.totalGoalTarget).toBe(5000);
    expect(result.current.totalGoalProgress).toBe(5000);

    await waitFor(() => {
      expect(getPersistedGoals()[0]).toMatchObject({
        id: "generated-goal-id",
        currentAmount: 5000,
      });
    });

    act(() => {
      result.current.removeGoal("generated-goal-id");
    });

    await waitFor(() => {
      expect(result.current.goals).toEqual([]);
    });

    expect(result.current.totalGoalTarget).toBe(0);
    expect(result.current.totalGoalProgress).toBe(0);

    await waitFor(() => {
      expect(window.localStorage.getItem(LOCAL_STORAGE_KEY)).toBe(
        JSON.stringify([]),
      );
    });
  });

  it("deve ignorar entradas invalidas sem alterar os dados observaveis", async () => {
    const { result } = await renderLoadedHook();

    act(() => {
      result.current.addGoal({
        title: "Meta valida",
        targetAmount: 1000,
        currentAmount: 100,
      });
    });

    await waitFor(() => {
      expect(result.current.goals).toHaveLength(1);
    });

    const previousGoals = result.current.goals;

    act(() => {
      result.current.addGoal({
        title: "   ",
        targetAmount: 500,
        currentAmount: 50,
      });
      result.current.addGoal({
        title: "Meta invalida",
        targetAmount: 0,
        currentAmount: 50,
      });
      result.current.updateGoalProgress({
        id: previousGoals[0].id,
        currentAmount: -10,
      });
      result.current.updateGoalProgress({
        id: previousGoals[0].id,
        currentAmount: Number.NaN,
      });
    });

    expect(result.current.goals).toEqual(previousGoals);
    expect(result.current.totalGoalTarget).toBe(1000);
    expect(result.current.totalGoalProgress).toBe(100);
    expect(getPersistedGoals()).toEqual(previousGoals);
  });
});
