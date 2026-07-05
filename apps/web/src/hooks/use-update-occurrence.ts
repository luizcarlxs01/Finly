"use client";

import { useState } from "react";
import { useAuthSession } from "@/hooks/use-auth-session";
import { updateOccurrence as updateOccurrenceWithApi } from "@/lib/api/occurrences";
import { TRANSACTION_WRITE_COMPLETED_EVENT } from "@/lib/api/transactions";

type UpdateOccurrenceInput = {
  id: string;
  dueDate: string;
  amount: number;
};

type UseUpdateOccurrenceReturn = {
  errorMessage: string | null;
  isSubmitting: boolean;
  updateOccurrence: (input: UpdateOccurrenceInput) => Promise<void>;
};

function getFriendlyErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Não foi possível atualizar a ocorrência agora.";
}

export function useUpdateOccurrence(): UseUpdateOccurrenceReturn {
  const { session } = useAuthSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function updateOccurrence(input: UpdateOccurrenceInput) {
    setErrorMessage(null);

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
      await updateOccurrenceWithApi(
        input.id,
        { dueDate: input.dueDate, amount: input.amount },
        session.token,
      );
      window.dispatchEvent(new Event(TRANSACTION_WRITE_COMPLETED_EVENT));
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
    updateOccurrence,
  };
}
