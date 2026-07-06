"use client";

import { useState } from "react";
import { useFinanceSource } from "@/contexts/finance-source-context";
import { useAuthSession } from "@/hooks/use-auth-session";
import {
  TRANSACTION_WRITE_COMPLETED_EVENT,
  type UpdateApiTransactionRequest,
  updateTransaction as updateTransactionWithApi,
} from "@/lib/api/transactions";
import type { ApiTransaction } from "@/types/api-transaction";
import type { Transaction, TransactionKind } from "@/types/transaction";
import type { Profile } from "@/types/profile";
import {
  getBackendTransactionKind,
  inferContractRecurrenceMode,
} from "@/utils/transaction-normalization";

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
  apiContractTransactions: ApiTransaction[];
  updateLocalTransaction: (input: UpdateTransactionInput) => void;
  selectedProfile: Profile | null;
  transactions: Transaction[];
};

type UseUpdateTransactionReturn = {
  errorMessage: string | null;
  isSubmitting: boolean;
  updateTransaction: (input: UpdateTransactionInput) => Promise<void>;
};

/**
 * Constrói o payload de PUT a partir do contrato CRU (ApiTransaction), não da linha
 * achatada. Isso evita dois bugs: (1) usar a DueDate da ocorrência clicada como
 * TransactionDate do contrato inteiro, e (2) usar o id do contrato (repropósito de
 * Transaction.sourceId no FE) como se fosse o SourceId real do backend (vínculo com
 * FinancialRule), o que corromperia o dedup do RuleProcessingService.
 */
function buildApiContractUpdateRequest(
  contract: ApiTransaction,
  input: UpdateTransactionInput,
  financialProfileId: string,
): UpdateApiTransactionRequest {
  const backendKind = input.transactionKind
    ? getBackendTransactionKind(input.transactionKind)
    : contract.transactionKind;

  const transactionDate =
    input.installmentStartDate ??
    input.recurrenceStartDate ??
    input.transactionDate ??
    contract.transactionDate;

  const recurrenceMode = input.recurrenceMode ?? inferContractRecurrenceMode(contract);

  return {
    financialProfileId,
    title: input.title.trim(),
    amount: input.amount,
    type: input.type === "income" ? "Income" : "Expense",
    category: input.category.trim().toLowerCase(),
    transactionKind: backendKind,
    transactionDate,
    sourceId: contract.sourceId,
    installmentIndex: null,
    installmentCount:
      backendKind === "Installment"
        ? input.installmentCount ?? contract.installmentCount
        : null,
    isRecurring: backendKind === "Recurring",
    recurrenceStartDate:
      backendKind === "Recurring"
        ? input.recurrenceStartDate ?? contract.recurrenceStartDate
        : null,
    recurrenceEndDate:
      backendKind === "Recurring" && recurrenceMode === "until-date"
        ? input.recurrenceEndDate ?? contract.recurrenceEndDate
        : null,
    recurrenceDay:
      backendKind === "Recurring"
        ? input.recurrenceDay ?? contract.recurrenceDay
        : null,
    recurrenceMonths:
      backendKind === "Recurring" && recurrenceMode === "for-months"
        ? input.recurrenceMonths ?? contract.recurrenceMonths
        : null,
  };
}

function getFriendlyErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Não foi possível atualizar o lançamento agora.";
}

export function useUpdateTransaction({
  apiContractTransactions,
  updateLocalTransaction,
  selectedProfile,
  transactions,
}: UseUpdateTransactionOptions): UseUpdateTransactionReturn {
  const { source } = useFinanceSource();
  const { session } = useAuthSession();
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

    const contractId = currentTransaction.sourceId;
    const contract = apiContractTransactions.find(
      (transaction) => transaction.id === contractId,
    );

    if (!contract) {
      const nextErrorMessage = "Não foi possível localizar o lançamento original.";
      setErrorMessage(nextErrorMessage);
      throw new Error(nextErrorMessage);
    }

    setIsSubmitting(true);

    try {
      const request = buildApiContractUpdateRequest(
        contract,
        input,
        selectedProfile.id,
      );

      await updateTransactionWithApi(contract.id, request, session.token);
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
