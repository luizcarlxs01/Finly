"use client";

import { useState } from "react";
import { useFinanceSource } from "@/contexts/finance-source-context";
import { useAuthSession } from "@/hooks/use-auth-session";
import { markAsPending } from "@/lib/api/occurrences";
import { TRANSACTION_WRITE_COMPLETED_EVENT } from "@/lib/api/transactions";

type UseMarkOccurrencePendingOptions = {
  markLocalOccurrencePending: (occurrenceId: string) => void;
};

type UseMarkOccurrencePendingReturn = {
  errorMessage: string | null;
  isSubmitting: boolean;
  markAsPending: (occurrenceId: string) => Promise<void>;
};

function getFriendlyErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Não foi possível marcar a ocorrência como pendente agora.";
}

export function useMarkOccurrencePending({
  markLocalOccurrencePending,
}: UseMarkOccurrencePendingOptions): UseMarkOccurrencePendingReturn {
  const { source } = useFinanceSource();
  const { session } = useAuthSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleMarkAsPending(occurrenceId: string) {
    setErrorMessage(null);

    if (source === "local") {
      markLocalOccurrencePending(occurrenceId);
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
      await markAsPending(occurrenceId, session.token);
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
    markAsPending: handleMarkAsPending,
  };
}
