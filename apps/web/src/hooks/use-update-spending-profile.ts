"use client";

import { useState } from "react";
import { useFinanceSource } from "@/contexts/finance-source-context";
import { useAuthSession } from "@/hooks/use-auth-session";
import { PROFILE_UPDATED_EVENT, updateProfile } from "@/lib/api/profiles";
import type { Profile } from "@/types/profile";
import {
  getBackendSpendingProfile,
  validateCustomThresholds,
  type SpendingProfileSettings,
} from "@/utils/spending-profile";

type UseUpdateSpendingProfileOptions = {
  updateLocalSpendingProfile: (settings: SpendingProfileSettings) => void;
  selectedProfile: Profile | null;
};

type UseUpdateSpendingProfileReturn = {
  errorMessage: string | null;
  isSubmitting: boolean;
  updateSpendingProfile: (settings: SpendingProfileSettings) => Promise<void>;
};

function getFriendlyErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Não foi possível atualizar o perfil de gastos agora.";
}

export function useUpdateSpendingProfile({
  updateLocalSpendingProfile,
  selectedProfile,
}: UseUpdateSpendingProfileOptions): UseUpdateSpendingProfileReturn {
  const { source } = useFinanceSource();
  const { session } = useAuthSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function updateSpendingProfile(settings: SpendingProfileSettings) {
    setErrorMessage(null);

    if (settings.id === "personalizado") {
      const validationError = validateCustomThresholds(
        settings.customGoodThreshold ?? undefined,
        settings.customOkThreshold ?? undefined,
      );

      if (validationError) {
        setErrorMessage(validationError);
        throw new Error(validationError);
      }
    }

    if (source === "local") {
      updateLocalSpendingProfile(settings);
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
          initialBalance: selectedProfile.initialBalance,
          spendingProfile: getBackendSpendingProfile(settings.id),
          customOkThreshold:
            settings.id === "personalizado" ? settings.customOkThreshold ?? undefined : undefined,
          customGoodThreshold:
            settings.id === "personalizado" ? settings.customGoodThreshold ?? undefined : undefined,
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
    updateSpendingProfile,
  };
}
