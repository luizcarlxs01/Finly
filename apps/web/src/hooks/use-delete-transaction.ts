"use client";

import { useState } from "react";
import { useFinanceSource } from "@/contexts/finance-source-context";
import { useAuthSession } from "@/hooks/use-auth-session";
import {
  deleteTransaction as deleteTransactionWithApi,
  TRANSACTION_WRITE_COMPLETED_EVENT,
} from "@/lib/api/transactions";

type UseDeleteTransactionOptions = {
  removeLocalTransaction: (id: string) => void;
};

type UseDeleteTransactionReturn = {
  deleteTransaction: (id: string) => Promise<void>;
  errorMessage: string | null;
  isSubmitting: boolean;
};

function getFriendlyErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Não foi possível remover o lançamento agora.";
}

export function useDeleteTransaction({
  removeLocalTransaction,
}: UseDeleteTransactionOptions): UseDeleteTransactionReturn {
  const { source } = useFinanceSource();
  const { session } = useAuthSession();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function deleteTransaction(id: string) {
    setErrorMessage(null);

    if (source === "local") {
      removeLocalTransaction(id);
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
      await deleteTransactionWithApi(id, session.token);
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
    deleteTransaction,
    errorMessage,
    isSubmitting,
  };
}
