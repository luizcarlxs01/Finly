"use client";

import { useCallback, useEffect, useState } from "react";
import type { FinanceSource } from "@/contexts/finance-source-context";
import {
  isValidTransactionInput,
  normalizeTransactionInput,
  type LocalFinanceTransactionInput,
} from "@/hooks/use-local-finance";
import type {
  Transaction,
  TransactionKind,
  TransactionRecurrenceMode,
} from "@/types/transaction";
import { generateOccurrences } from "@/utils/occurrence-generation";
import { getTodayDateValue, parseDateValue } from "@/utils/recurring-transactions";

type UseImpactSimulationInput = {
  source: FinanceSource;
  transactions: Transaction[];
};

type UseImpactSimulationReturn = {
  clearSimulation: () => void;
  isPreviewActive: boolean;
  previewTransactions: Transaction[] | null;
  simulateImpact: (input: LocalFinanceTransactionInput) => void;
};

function sortTransactionsByMostRecent(transactions: Transaction[]) {
  return [...transactions].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

function getTransactionCreatedAt(transactionDate: string | null | undefined) {
  const normalizedDate =
    parseDateValue(transactionDate) ?? parseDateValue(getTodayDateValue());

  return normalizedDate ? normalizedDate.toISOString() : new Date().toISOString();
}

/**
 * Constrói as linhas de preview usando generateOccurrences (utils/occurrence-generation.ts) —
 * a mesma geração real usada por use-local-finance.ts para persistir de verdade. Como o
 * formato de linha achatada agora é idêntico nos dois modos (Fases C e D), um único preview
 * serve tanto para local quanto para API — não persiste em nenhum dos dois, só mescla com a
 * lista real de transações para simular o impacto.
 */
function buildPreviewLineItems(
  input: ReturnType<typeof normalizeTransactionInput>,
): Transaction[] {
  const previewOccurrences = generateOccurrences(input);
  const displayKind: TransactionKind =
    input.transactionKind === "installment-template"
      ? "installment-instance"
      : input.transactionKind === "recurring-template"
        ? "recurring-instance"
        : "single";
  const createdAt = getTransactionCreatedAt(
    input.transactionDate ?? input.installmentStartDate ?? input.recurrenceStartDate,
  );

  return previewOccurrences.map((occurrence, index) => ({
    id: `preview-occurrence-${index}`,
    title: input.title,
    amount: occurrence.amount,
    type: input.type,
    category: input.category,
    transactionKind: displayKind,
    sourceId: "preview-transaction",
    occurrenceDate: occurrence.dueDate,
    installmentIndex: occurrence.installmentIndex,
    installmentCount: input.installmentCount,
    installmentStartDate: null,
    recurringSourceId: displayKind === "recurring-instance" ? "preview-transaction" : null,
    recurringOccurrenceDate:
      displayKind === "recurring-instance" ? occurrence.dueDate : null,
    isRecurring: input.isRecurring,
    recurrenceType: displayKind === "recurring-instance" ? "monthly" : null,
    recurrenceMode: input.recurrenceMode as TransactionRecurrenceMode | null,
    recurrenceDay: input.recurrenceDay,
    recurrenceStartDate: input.recurrenceStartDate,
    recurrenceEndDate: input.recurrenceEndDate,
    recurrenceMonths: input.recurrenceMonths,
    lastGeneratedAt: null,
    createdAt,
    occurrenceId: `preview-occurrence-${index}`,
    occurrenceStatus: occurrence.status,
    isCustomized: false,
  }));
}

export function useImpactSimulation({
  source,
  transactions,
}: UseImpactSimulationInput): UseImpactSimulationReturn {
  const [previewTransactions, setPreviewTransactions] =
    useState<Transaction[] | null>(null);

  useEffect(() => {
    setPreviewTransactions(null);
  }, [source]);

  const clearSimulation = useCallback(() => {
    setPreviewTransactions(null);
  }, []);

  const simulateImpact = useCallback(
    (input: LocalFinanceTransactionInput) => {
      const normalizedInput = normalizeTransactionInput(input);

      if (!isValidTransactionInput(normalizedInput)) {
        setPreviewTransactions(null);
        return;
      }

      const previewLineItems = buildPreviewLineItems(normalizedInput);
      setPreviewTransactions(
        sortTransactionsByMostRecent([...previewLineItems, ...transactions]),
      );
    },
    [transactions],
  );

  return {
    clearSimulation,
    isPreviewActive: previewTransactions !== null,
    previewTransactions,
    simulateImpact,
  };
}
