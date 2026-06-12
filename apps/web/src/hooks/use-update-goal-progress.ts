"use client";

import { useState } from "react";
import { useFinanceSource } from "@/contexts/finance-source-context";
import { useAuthSession } from "@/hooks/use-auth-session";
import {
  GOAL_WRITE_COMPLETED_EVENT,
  updateGoalProgress as updateGoalProgressWithApi,
} from "@/lib/api/goals";

type GoalProgressInput = {
  id: string;
  currentAmount: number;
};

type UseUpdateGoalProgressOptions = {
  updateLocalGoalProgress: (input: GoalProgressInput) => void;
};

type UseUpdateGoalProgressReturn = {
  errorMessage: string | null;
  isSubmitting: boolean;
  updateGoalProgress: (input: GoalProgressInput) => Promise<void>;
};

function getFriendlyErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Nao foi possivel atualizar o progresso da meta agora.";
}

export function useUpdateGoalProgress({
  updateLocalGoalProgress,
}: UseUpdateGoalProgressOptions): UseUpdateGoalProgressReturn {
  const { source } = useFinanceSource();
  const { session } = useAuthSession();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function updateGoalProgress(input: GoalProgressInput) {
    setErrorMessage(null);

    if (source === "local") {
      updateLocalGoalProgress(input);
      return;
    }

    if (isSubmitting) {
      return;
    }

    if (!session?.token) {
      const nextErrorMessage = "Sua sessao de conta nao esta disponivel.";
      setErrorMessage(nextErrorMessage);
      throw new Error(nextErrorMessage);
    }

    setIsSubmitting(true);

    try {
      await updateGoalProgressWithApi(
        input.id,
        { currentAmount: input.currentAmount },
        session.token,
      );
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
    errorMessage,
    isSubmitting,
    updateGoalProgress,
  };
}
