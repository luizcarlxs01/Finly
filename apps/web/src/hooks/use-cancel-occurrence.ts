"use client";

import { useState } from "react";
import { useFinanceSource } from "@/contexts/finance-source-context";
import { useAuthSession } from "@/hooks/use-auth-session";
import { cancelOccurrence } from "@/lib/api/occurrences";
import { TRANSACTION_WRITE_COMPLETED_EVENT } from "@/lib/api/transactions";

type UseCancelOccurrenceOptions = {
  cancelLocalOccurrence: (occurrenceId: string) => void;
};

type UseCancelOccurrenceReturn = {
  cancelOccurrence: (occurrenceId: string) => Promise<void>;
  errorMessage: string | null;
  isSubmitting: boolean;
};

function getFriendlyErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Não foi possível cancelar a ocorrência agora.";
}

export function useCancelOccurrence({
  cancelLocalOccurrence,
}: UseCancelOccurrenceOptions): UseCancelOccurrenceReturn {
  const { source } = useFinanceSource();
  const { session } = useAuthSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleCancelOccurrence(occurrenceId: string) {
    setErrorMessage(null);

    if (source === "local") {
      cancelLocalOccurrence(occurrenceId);
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
      await cancelOccurrence(occurrenceId, session.token);
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
    cancelOccurrence: handleCancelOccurrence,
    errorMessage,
    isSubmitting,
  };
}
