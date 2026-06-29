"use client";

import { useState } from "react";
import { useFinanceSource } from "@/contexts/finance-source-context";
import { useAuthSession } from "@/hooks/use-auth-session";
import {
  deleteGoal as deleteGoalWithApi,
  GOAL_WRITE_COMPLETED_EVENT,
} from "@/lib/api/goals";

type UseDeleteGoalOptions = {
  removeLocalGoal: (id: string) => void;
};

type UseDeleteGoalReturn = {
  deleteGoal: (id: string) => Promise<void>;
  errorMessage: string | null;
  isSubmitting: boolean;
};

function getFriendlyErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Não foi possível remover a meta agora.";
}

export function useDeleteGoal({
  removeLocalGoal,
}: UseDeleteGoalOptions): UseDeleteGoalReturn {
  const { source } = useFinanceSource();
  const { session } = useAuthSession();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function deleteGoal(id: string) {
    setErrorMessage(null);

    if (source === "local") {
      removeLocalGoal(id);
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

    setIsSubmitting(true);

    try {
      await deleteGoalWithApi(id, session.token);
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
    deleteGoal,
    errorMessage,
    isSubmitting,
  };
}
