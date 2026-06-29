"use client";

import { useState } from "react";
import { useFinanceSource } from "@/contexts/finance-source-context";
import type { LocalFinanceTransactionInput } from "@/hooks/use-local-finance";
import { useAuthSession } from "@/hooks/use-auth-session";
import {
  createTransaction as createTransactionWithApi,
  TRANSACTION_WRITE_COMPLETED_EVENT,
  type CreateApiTransactionRequest,
} from "@/lib/api/transactions";
import type { TransactionKind } from "@/types/transaction";
import type { Profile } from "@/types/profile";
import { getTodayDateValue } from "@/utils/recurring-transactions";

type UseCreateTransactionOptions = {
  addLocalTransaction: (input: LocalFinanceTransactionInput) => void;
  selectedProfile: Profile | null;
};

type UseCreateTransactionReturn = {
  createTransaction: (input: LocalFinanceTransactionInput) => Promise<void>;
  errorMessage: string | null;
  isSubmitting: boolean;
};

function getBackendTransactionKind(value: TransactionKind | undefined) {
  switch (value) {
    case "installment-template":
      return "InstallmentTemplate";
    case "installment-instance":
      return "InstallmentInstance";
    case "recurring-template":
      return "RecurringTemplate";
    case "recurring-instance":
      return "RecurringInstance";
    case "single":
    default:
      return "Single";
  }
}

function getTransactionDate(input: LocalFinanceTransactionInput) {
  if (input.transactionKind === "installment-template") {
    return input.installmentStartDate ?? getTodayDateValue();
  }

  if (input.transactionKind === "recurring-template") {
    return input.recurrenceStartDate ?? getTodayDateValue();
  }

  return input.transactionDate ?? getTodayDateValue();
}

function mapToCreateRequest(
  input: LocalFinanceTransactionInput,
  financialProfileId: string,
): CreateApiTransactionRequest {
  return {
    financialProfileId,
    title: input.title.trim(),
    amount: input.amount,
    type: input.type === "income" ? "Income" : "Expense",
    category: input.category.trim().toLowerCase(),
    transactionKind: getBackendTransactionKind(input.transactionKind),
    transactionDate: getTransactionDate(input),
    sourceId: null,
    installmentIndex: null,
    installmentCount:
      input.transactionKind === "installment-template"
        ? input.installmentCount ?? null
        : null,
    isRecurring: input.isRecurring,
    recurrenceStartDate: input.isRecurring
      ? input.recurrenceStartDate
      : null,
    recurrenceEndDate: input.isRecurring ? input.recurrenceEndDate ?? null : null,
    recurrenceDay: input.isRecurring ? input.recurrenceDay : null,
    recurrenceMonths: input.isRecurring ? input.recurrenceMonths ?? null : null,
  };
}

function getFriendlyErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Não foi possível criar o lançamento agora.";
}

export function useCreateTransaction({
  addLocalTransaction,
  selectedProfile,
}: UseCreateTransactionOptions): UseCreateTransactionReturn {
  const { source } = useFinanceSource();
  const { session } = useAuthSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function createTransaction(input: LocalFinanceTransactionInput) {
    setErrorMessage(null);

    if (source === "local") {
      addLocalTransaction(input);
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
      await createTransactionWithApi(request, session.token);
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
    createTransaction,
    errorMessage,
    isSubmitting,
  };
}
