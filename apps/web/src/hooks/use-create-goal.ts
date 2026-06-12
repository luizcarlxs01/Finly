"use client";

import { useState } from "react";
import { useFinanceSource } from "@/contexts/finance-source-context";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useGoalsData } from "@/hooks/use-goals-data";
import {
  createGoal as createGoalWithApi,
  GOAL_WRITE_COMPLETED_EVENT,
  type CreateApiGoalRequest,
} from "@/lib/api/goals";

type GoalInput = {
  title: string;
  targetAmount: number;
  currentAmount?: number;
  category?: string;
  deadline?: string;
};

type UseCreateGoalOptions = {
  addLocalGoal: (input: GoalInput) => void;
};

type UseCreateGoalReturn = {
  createGoal: (input: GoalInput) => Promise<void>;
  errorMessage: string | null;
  isSubmitting: boolean;
};

function mapToCreateRequest(
  input: GoalInput,
  financialProfileId: string,
): CreateApiGoalRequest {
  return {
    financialProfileId,
    title: input.title.trim(),
    targetAmount: input.targetAmount,
    currentAmount: input.currentAmount ?? 0,
    deadline: input.deadline ?? null,
  };
}

function getFriendlyErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Não foi possível criar a meta agora.";
}

export function useCreateGoal({
  addLocalGoal,
}: UseCreateGoalOptions): UseCreateGoalReturn {
  const { source } = useFinanceSource();
  const { session } = useAuthSession();
  const { selectedProfile } = useGoalsData();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function createGoal(input: GoalInput) {
    setErrorMessage(null);

    if (source === "local") {
      addLocalGoal(input);
      return;
    }

    if (isSubmitting) {
      return;
    }

    if (!session?.token) {
      const nextErrorMessage = "Sua sessão de conta não está disponível.";
      setErrorMessage(nextErrorMessage);
      throw new Error(nextErrorMessage);
    }

    if (!selectedProfile) {
      const nextErrorMessage = "Não foi possível identificar o perfil da conta.";
      setErrorMessage(nextErrorMessage);
      throw new Error(nextErrorMessage);
    }

    setIsSubmitting(true);

    try {
      const request = mapToCreateRequest(input, selectedProfile.id);
      await createGoalWithApi(request, session.token);
      window.dispatchEvent(new Event(GOAL_WRITE_COMPLETED_EVENT));
      setErrorMessage(null);
    } catch (error) {
      const nextErrorMessage = getFriendlyErrorMessage(error);
      setErrorMessage(nextErrorMessage);
      throw new Error(nextErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    createGoal,
    errorMessage,
    isSubmitting,
  };
}
