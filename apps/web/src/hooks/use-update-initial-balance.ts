"use client";

import { useState } from "react";
import { useFinanceSource } from "@/contexts/finance-source-context";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useFinanceData } from "@/hooks/use-finance-data";
import {
  PROFILE_UPDATED_EVENT,
  updateProfile,
} from "@/lib/api/profiles";

type UseUpdateInitialBalanceOptions = {
  updateLocalInitialBalance: (value: number) => void;
};

type UseUpdateInitialBalanceReturn = {
  errorMessage: string | null;
  isSubmitting: boolean;
  updateInitialBalance: (value: number) => Promise<void>;
};

function getFriendlyErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Não foi possível atualizar o saldo inicial agora.";
}

export function useUpdateInitialBalance({
  updateLocalInitialBalance,
}: UseUpdateInitialBalanceOptions): UseUpdateInitialBalanceReturn {
  const { source } = useFinanceSource();
  const { session } = useAuthSession();
  const { selectedProfile } = useFinanceData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function updateInitialBalance(value: number) {
    setErrorMessage(null);

    if (source === "local") {
      updateLocalInitialBalance(value);
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
      await updateProfile(
        selectedProfile.id,
        {
          name: selectedProfile.name,
          description: selectedProfile.description,
          initialBalance: value,
        },
        session.token,
      );

      window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
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
    updateInitialBalance,
  };
}
