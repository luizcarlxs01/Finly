"use client";

import { useState } from "react";
import { useAuthSession } from "@/hooks/use-auth-session";
import { markAsPaid } from "@/lib/api/occurrences";
import { TRANSACTION_WRITE_COMPLETED_EVENT } from "@/lib/api/transactions";

type UseMarkOccurrencePaidReturn = {
  errorMessage: string | null;
  isSubmitting: boolean;
  markAsPaid: (occurrenceId: string) => Promise<void>;
};

function getFriendlyErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Não foi possível marcar a ocorrência como paga agora.";
}

export function useMarkOccurrencePaid(): UseMarkOccurrencePaidReturn {
  const { session } = useAuthSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleMarkAsPaid(occurrenceId: string) {
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
      await markAsPaid(occurrenceId, session.token);
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
    markAsPaid: handleMarkAsPaid,
  };
}
