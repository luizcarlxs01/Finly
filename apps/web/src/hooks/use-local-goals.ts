"use client";

import { useEffect, useMemo, useState } from "react";
import type { Goal } from "@/types/goal";

const LOCAL_STORAGE_KEY = "finly:local-goals";
const DEFAULT_GOAL_CATEGORY = "general";

type GoalInput = {
  title: string;
  targetAmount: number;
  currentAmount?: number;
  category?: string;
  deadline?: string;
};

type GoalProgressInput = {
  id: string;
  currentAmount: number;
};

function sortGoalsByMostRecent(goals: Goal[]) {
  return [...goals].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

function normalizeCategory(category: unknown) {
  if (typeof category !== "string") {
    return DEFAULT_GOAL_CATEGORY;
  }

  const normalizedCategory = category.trim().toLowerCase();
  return normalizedCategory || DEFAULT_GOAL_CATEGORY;
}

function normalizeDeadline(deadline?: string) {
  if (!deadline) {
    return undefined;
  }

  const normalizedDeadline = deadline.trim();
  return normalizedDeadline || undefined;
}

function normalizeGoal(goal: Goal): Goal {
  return {
    ...goal,
    targetAmount: Number(goal.targetAmount ?? 0),
    currentAmount: Number(goal.currentAmount ?? 0),
    category: normalizeCategory(goal.category),
    deadline: normalizeDeadline(goal.deadline),
  };
}

function normalizeGoalInput(input: GoalInput) {
  return {
    title: input.title.trim(),
    targetAmount: Number(input.targetAmount),
    currentAmount: Number(input.currentAmount ?? 0),
    category: normalizeCategory(input.category),
    deadline: normalizeDeadline(input.deadline),
  };
}

function isValidGoalInput(input: ReturnType<typeof normalizeGoalInput>) {
  return (
    Boolean(input.title) &&
    !Number.isNaN(input.targetAmount) &&
    input.targetAmount > 0 &&
    !Number.isNaN(input.currentAmount) &&
    input.currentAmount >= 0
  );
}

export function useLocalGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const storedValue = window.localStorage.getItem(LOCAL_STORAGE_KEY);

    if (!storedValue) {
      setIsLoaded(true);
      return;
    }

    try {
      const parsedValue = JSON.parse(storedValue) as Goal[];

      setGoals(
        sortGoalsByMostRecent(
          Array.isArray(parsedValue) ? parsedValue.map(normalizeGoal) : [],
        ),
      );
    } catch {
      setGoals([]);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(goals));
  }, [goals, isLoaded]);

  const totalGoalTarget = useMemo(
    () => goals.reduce((total, goal) => total + goal.targetAmount, 0),
    [goals],
  );

  const totalGoalProgress = useMemo(
    () => goals.reduce((total, goal) => total + goal.currentAmount, 0),
    [goals],
  );

  function addGoal(input: GoalInput) {
    const normalizedInput = normalizeGoalInput(input);

    if (!isValidGoalInput(normalizedInput)) {
      return;
    }

    const newGoal: Goal = {
      id: crypto.randomUUID(),
      title: normalizedInput.title,
      targetAmount: normalizedInput.targetAmount,
      currentAmount: normalizedInput.currentAmount,
      category: normalizedInput.category,
      deadline: normalizedInput.deadline,
      createdAt: new Date().toISOString(),
    };

    setGoals((currentGoals) =>
      sortGoalsByMostRecent([newGoal, ...currentGoals]),
    );
  }

  function updateGoalProgress(input: GoalProgressInput) {
    const normalizedAmount = Number(input.currentAmount);

    if (Number.isNaN(normalizedAmount) || normalizedAmount < 0) {
      return;
    }

    setGoals((currentGoals) =>
      currentGoals.map((goal) =>
        goal.id === input.id
          ? {
              ...goal,
              currentAmount: normalizedAmount,
            }
          : goal,
      ),
    );
  }

  function removeGoal(id: string) {
    setGoals((currentGoals) =>
      currentGoals.filter((goal) => goal.id !== id),
    );
  }

  return {
    goals,
    isLoaded,
    totalGoalTarget,
    totalGoalProgress,
    addGoal,
    updateGoalProgress,
    removeGoal,
  };
}
