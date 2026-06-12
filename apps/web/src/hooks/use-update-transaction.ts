"use client";

import { useState } from "react";
import { useFinanceSource } from "@/contexts/finance-source-context";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useFinanceData } from "@/hooks/use-finance-data";
import {
  TRANSACTION_WRITE_COMPLETED_EVENT,
  type UpdateApiTransactionRequest,
  updateTransaction as updateTransactionWithApi,
} from "@/lib/api/transactions";
import type { Transaction, TransactionKind } from "@/types/transaction";
import { getTodayDateValue } from "@/utils/recurring-transactions";

type UpdateTransactionInput = {
  id: string;
  title: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  transactionKind?: TransactionKind;
  transactionDate?: string | null;
  isRecurring: boolean;
  recurrenceType: "monthly" | null;
  recurrenceMode?: "indefinite" | "until-date" | "for-months" | null;
  recurrenceDay: number | null;
  recurrenceStartDate: string | null;
  recurrenceEndDate?: string | null;
  recurrenceMonths?: number | null;
  installmentCount?: number | null;
  installmentStartDate?: string | null;
};

type UseUpdateTransactionOptions = {
  updateLocalTransaction: (input: UpdateTransactionInput) => void;
};

type UseUpdateTransactionReturn = {
  errorMessage: string | null;
  isSubmitting: boolean;
  updateTransaction: (input: UpdateTransactionInput) => Promise<void>;
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

function inferRecurrenceMode(transaction: Transaction) {
  if (transaction.recurrenceEndDate) {
    return "until-date";
  }

  if (transaction.recurrenceMonths) {
    return "for-months";
  }

  return "indefinite";
}

function resolveTransactionToEdit(
  currentTransaction: Transaction,
  transactions: Transaction[],
) {
  const isGeneratedInstance =
    currentTransaction.transactionKind === "installment-instance" ||
    currentTransaction.transactionKind === "recurring-instance";

  if (!isGeneratedInstance || !currentTransaction.sourceId) {
    return currentTransaction;
  }

  return (
    transactions.find((transaction) => transaction.id === currentTransaction.sourceId) ??
    currentTransaction
  );
}

function getResolvedTransactionKind(
  currentTransaction: Transaction,
  transactionToEdit: Transaction,
  input: UpdateTransactionInput,
) {
  const isGeneratedInstance =
    currentTransaction.transactionKind === "installment-instance" ||
    currentTransaction.transactionKind === "recurring-instance";

  return isGeneratedInstance
    ? transactionToEdit.transactionKind
    : input.transactionKind ?? transactionToEdit.transactionKind;
}

function getTransactionDateForRequest(
  input: UpdateTransactionInput,
  transactionToEdit: Transaction,
  resolvedTransactionKind: TransactionKind,
) {
  if (resolvedTransactionKind === "installment-template") {
    return (
      input.installmentStartDate ??
      transactionToEdit.installmentStartDate ??
      transactionToEdit.occurrenceDate ??
      getTodayDateValue()
    );
  }

  if (resolvedTransactionKind === "recurring-template") {
    return (
      input.recurrenceStartDate ??
      transactionToEdit.recurrenceStartDate ??
      transactionToEdit.occurrenceDate ??
      getTodayDateValue()
    );
  }

  return (
    input.transactionDate ??
    transactionToEdit.occurrenceDate ??
    transactionToEdit.createdAt.slice(0, 10) ??
    getTodayDateValue()
  );
}

function mapToUpdateRequest(
  currentTransaction: Transaction,
  transactionToEdit: Transaction,
  input: UpdateTransactionInput,
  financialProfileId: string,
): {
  request: UpdateApiTransactionRequest;
  targetTransactionId: string;
} {
  const resolvedTransactionKind = getResolvedTransactionKind(
    currentTransaction,
    transactionToEdit,
    input,
  );
  const transactionDate = getTransactionDateForRequest(
    input,
    transactionToEdit,
    resolvedTransactionKind,
  );
  const recurrenceMode =
    input.recurrenceMode ??
    transactionToEdit.recurrenceMode ??
    inferRecurrenceMode(transactionToEdit);

  return {
    targetTransactionId: transactionToEdit.id,
    request: {
      financialProfileId,
      title: input.title.trim(),
      amount: input.amount,
      type: input.type === "income" ? "Income" : "Expense",
      category: input.category.trim().toLowerCase(),
      transactionKind: getBackendTransactionKind(resolvedTransactionKind),
      transactionDate,
      sourceId:
        resolvedTransactionKind === "installment-instance" ||
        resolvedTransactionKind === "recurring-instance"
          ? transactionToEdit.sourceId
          : null,
      installmentIndex:
        resolvedTransactionKind === "installment-instance"
          ? transactionToEdit.installmentIndex
          : null,
      installmentCount:
        resolvedTransactionKind === "installment-template"
          ? input.installmentCount ?? transactionToEdit.installmentCount
          : resolvedTransactionKind === "installment-instance"
            ? transactionToEdit.installmentCount
            : null,
      isRecurring: resolvedTransactionKind === "recurring-template",
      recurrenceStartDate:
        resolvedTransactionKind === "recurring-template"
          ? input.recurrenceStartDate ??
            transactionToEdit.recurrenceStartDate ??
            transactionDate
          : null,
      recurrenceEndDate:
        resolvedTransactionKind === "recurring-template"
          ? recurrenceMode === "until-date"
            ? input.recurrenceEndDate ?? transactionToEdit.recurrenceEndDate
            : null
          : null,
      recurrenceDay:
        resolvedTransactionKind === "recurring-template"
          ? input.recurrenceDay ?? transactionToEdit.recurrenceDay
          : null,
      recurrenceMonths:
        resolvedTransactionKind === "recurring-template"
          ? recurrenceMode === "for-months"
            ? input.recurrenceMonths ?? transactionToEdit.recurrenceMonths
            : null
          : null,
    },
  };
}

function getFriendlyErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Não foi possível atualizar o lançamento agora.";
}

export function useUpdateTransaction({
  updateLocalTransaction,
}: UseUpdateTransactionOptions): UseUpdateTransactionReturn {
  const { source } = useFinanceSource();
  const { session } = useAuthSession();
  const { selectedProfile, transactions } = useFinanceData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function updateTransaction(input: UpdateTransactionInput) {
    setErrorMessage(null);

    if (source === "local") {
      updateLocalTransaction(input);
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

    const currentTransaction = transactions.find(
      (transaction) => transaction.id === input.id,
    );

    if (!currentTransaction) {
      const nextErrorMessage = "Não foi possível identificar o lançamento a ser editado.";
      setErrorMessage(nextErrorMessage);
      throw new Error(nextErrorMessage);
    }

    setIsSubmitting(true);

    try {
      const transactionToEdit = resolveTransactionToEdit(
        currentTransaction,
        transactions,
      );
      const { request, targetTransactionId } = mapToUpdateRequest(
        currentTransaction,
        transactionToEdit,
        input,
        selectedProfile.id,
      );

      await updateTransactionWithApi(targetTransactionId, request, session.token);
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
    updateTransaction,
  };
}
