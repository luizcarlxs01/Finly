"use client";

import { useEffect, useMemo, useState } from "react";
import { useFinanceSource } from "@/contexts/finance-source-context";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useLocalGoals } from "@/hooks/use-local-goals";
import {
  getGoals,
  GOAL_WRITE_COMPLETED_EVENT,
} from "@/lib/api/goals";
import { getProfiles } from "@/lib/api/profiles";
import type { Goal } from "@/types/goal";
import type { Profile } from "@/types/profile";

type GoalsDataState = {
  errorMessage: string | null;
  goals: Goal[];
  isLoaded: boolean;
  isLoading: boolean;
  remainingGoalAmount: number;
  selectedProfile: Profile | null;
  source: "local" | "api";
  totalGoalProgress: number;
  totalGoalTarget: number;
};

type UseGoalsDataOptions = {
  localGoals?: ReturnType<typeof useLocalGoals>;
};

const DEFAULT_API_GOAL_CATEGORY = "general";

function getFriendlyErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Não foi possível carregar as metas da API agora.";
}

function getSelectedProfile(profiles: Profile[]) {
  return profiles.find((profile) => profile.isPrimary) ?? profiles[0] ?? null;
}

function mapApiGoalToGoal(goal: Awaited<ReturnType<typeof getGoals>>[number]): Goal {
  return {
    id: goal.id,
    title: goal.title,
    targetAmount: goal.targetAmount,
    currentAmount: goal.currentAmount,
    category: DEFAULT_API_GOAL_CATEGORY,
    deadline: goal.deadline ?? undefined,
    createdAt: goal.createdAt,
  };
}

export function useGoalsData(
  options: UseGoalsDataOptions = {},
): GoalsDataState {
  const { source, isLoaded: isSourceLoaded } = useFinanceSource();
  const { session } = useAuthSession();
  const localGoals = options.localGoals ?? useLocalGoals();
  const [apiGoals, setApiGoals] = useState<Goal[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const token = session?.token ?? null;

  useEffect(() => {
    function handleGoalWritten() {
      setReloadKey((current) => current + 1);
    }

    window.addEventListener(GOAL_WRITE_COMPLETED_EVENT, handleGoalWritten);

    return () => {
      window.removeEventListener(GOAL_WRITE_COMPLETED_EVENT, handleGoalWritten);
    };
  }, []);

  useEffect(() => {
    if (!isSourceLoaded || source !== "api" || !token) {
      setApiGoals([]);
      setSelectedProfile(null);
      setErrorMessage(null);
      setIsApiLoading(false);
      return;
    }

    const authToken = token;
    let isMounted = true;

    async function loadApiGoals() {
      setIsApiLoading(true);
      setErrorMessage(null);

      try {
        const profiles = await getProfiles(authToken);
        const nextSelectedProfile = getSelectedProfile(profiles);

        if (!isMounted) {
          return;
        }

        if (!nextSelectedProfile) {
          setSelectedProfile(null);
          setApiGoals([]);
          return;
        }

        setSelectedProfile(nextSelectedProfile);

        const goals = await getGoals(nextSelectedProfile.id, authToken);

        if (!isMounted) {
          return;
        }

        setApiGoals(goals.map(mapApiGoalToGoal));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setSelectedProfile(null);
        setApiGoals([]);
        setErrorMessage(getFriendlyErrorMessage(error));
      } finally {
        if (isMounted) {
          setIsApiLoading(false);
        }
      }
    }

    loadApiGoals();

    return () => {
      isMounted = false;
    };
  }, [isSourceLoaded, reloadKey, source, token]);

  const goals = source === "local" ? localGoals.goals : apiGoals;
  const totalGoalTarget = useMemo(
    () => goals.reduce((total, goal) => total + goal.targetAmount, 0),
    [goals],
  );
  const totalGoalProgress = useMemo(
    () => goals.reduce((total, goal) => total + goal.currentAmount, 0),
    [goals],
  );
  const remainingGoalAmount = useMemo(
    () => Math.max(totalGoalTarget - totalGoalProgress, 0),
    [totalGoalProgress, totalGoalTarget],
  );

  return {
    source,
    isLoaded:
      source === "local"
        ? isSourceLoaded && localGoals.isLoaded
        : isSourceLoaded && !isApiLoading,
    isLoading:
      source === "local"
        ? !isSourceLoaded || !localGoals.isLoaded
        : !isSourceLoaded || isApiLoading,
    errorMessage: source === "local" ? null : errorMessage,
    remainingGoalAmount,
    selectedProfile: source === "local" ? null : selectedProfile,
    goals,
    totalGoalTarget:
      source === "local" ? localGoals.totalGoalTarget : totalGoalTarget,
    totalGoalProgress:
      source === "local" ? localGoals.totalGoalProgress : totalGoalProgress,
  };
}
