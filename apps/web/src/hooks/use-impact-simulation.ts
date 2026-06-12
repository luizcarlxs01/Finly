"use client";

import { useCallback, useEffect, useState } from "react";
import type { FinanceSource } from "@/contexts/finance-source-context";
import type {
  LocalFinanceTransactionInput,
} from "@/hooks/use-local-finance";
import type { LocalFinanceProfile } from "@/types/local-finance-profile";
import type {
  Transaction,
  TransactionKind,
  TransactionRecurrenceMode,
  TransactionRecurrenceType,
} from "@/types/transaction";
import { synchronizeInstallmentTransactions } from "@/utils/installment-transactions";
import {
  getTodayDateValue,
  parseDateValue,
  synchronizeRecurringTransactions,
} from "@/utils/recurring-transactions";
import {
  normalizeInstallmentCount,
  normalizeInstallmentStartDate,
  normalizeTransactionKind,
  normalizeTransactionRecurrenceDay,
  normalizeTransactionRecurrenceEndDate,
  normalizeTransactionRecurrenceMode,
  normalizeTransactionRecurrenceMonths,
  normalizeTransactionRecurrenceStartDate,
  normalizeTransactionRecurrenceType,
} from "@/utils/transaction-normalization";

type UseImpactSimulationInput = {
  createLocalPreviewProfile: (
    input: LocalFinanceTransactionInput,
  ) => LocalFinanceProfile | null;
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

function applyTransactionAutomation(profile: LocalFinanceProfile) {
  const recurringProfile = synchronizeRecurringTransactions({
    transactions: profile.transactions,
  });

  const installmentProfile = synchronizeInstallmentTransactions({
    transactions: recurringProfile.transactions,
  });

  return {
    ...profile,
    transactions: sortTransactionsByMostRecent(installmentProfile.transactions),
  };
}

function getTransactionCreatedAt(
  transactionDate: string | null | undefined,
  fallbackDate?: string,
) {
  const normalizedDate =
    parseDateValue(transactionDate) ??
    parseDateValue(fallbackDate) ??
    parseDateValue(getTodayDateValue());

  return normalizedDate ? normalizedDate.toISOString() : new Date().toISOString();
}

function normalizeTransactionInput(input: LocalFinanceTransactionInput) {
  const normalizedTransactionKind = normalizeTransactionKind(
    input.transactionKind,
    input.isRecurring === true,
  );

  const isRecurring =
    normalizedTransactionKind === "recurring-template" ||
    normalizedTransactionKind === "recurring-instance";

  const transactionKind = normalizedTransactionKind;

  const recurrenceType = isRecurring
    ? normalizeTransactionRecurrenceType(input.recurrenceType) ?? "monthly"
    : null;

  const recurrenceStartDate = isRecurring
    ? normalizeTransactionRecurrenceStartDate(
        input.recurrenceStartDate,
        getTodayDateValue(),
      )
    : null;

  const recurrenceDay =
    isRecurring && recurrenceStartDate
      ? normalizeTransactionRecurrenceDay(input.recurrenceDay, recurrenceStartDate)
      : null;

  const recurrenceMode = isRecurring
    ? normalizeTransactionRecurrenceMode(input.recurrenceMode) ?? "indefinite"
    : null;

  const recurrenceEndDate =
    isRecurring && recurrenceMode === "until-date" && recurrenceStartDate
      ? normalizeTransactionRecurrenceEndDate(
          input.recurrenceEndDate,
          recurrenceStartDate,
        )
      : null;

  const recurrenceMonths =
    isRecurring && recurrenceMode === "for-months"
      ? normalizeTransactionRecurrenceMonths(input.recurrenceMonths)
      : null;

  const installmentCount =
    transactionKind === "installment-template"
      ? normalizeInstallmentCount(input.installmentCount)
      : null;

  const installmentStartDate =
    transactionKind === "installment-template"
      ? normalizeInstallmentStartDate(
          input.installmentStartDate,
          getTodayDateValue(),
        )
      : null;

  const transactionDate =
    transactionKind === "single"
      ? input.transactionDate?.trim() || getTodayDateValue()
      : null;

  return {
    title: input.title.trim(),
    amount: Number(input.amount),
    type: input.type,
    category: input.category.trim().toLowerCase(),
    transactionKind,
    isRecurring,
    recurrenceType,
    recurrenceMode,
    recurrenceDay,
    recurrenceStartDate,
    recurrenceEndDate,
    recurrenceMonths,
    installmentCount,
    installmentStartDate,
    transactionDate,
  };
}

function isValidTransactionInput(
  input: ReturnType<typeof normalizeTransactionInput>,
) {
  return (
    Boolean(input.title) &&
    !Number.isNaN(input.amount) &&
    input.amount > 0 &&
    Boolean(input.category) &&
    (input.transactionKind !== "installment-template" ||
      (Boolean(input.installmentCount) && Boolean(input.installmentStartDate))) &&
    (!input.isRecurring ||
      (Boolean(input.recurrenceType) &&
        Boolean(input.recurrenceDay) &&
        Boolean(input.recurrenceStartDate) &&
        (input.recurrenceMode !== "until-date" ||
          Boolean(input.recurrenceEndDate)) &&
        (input.recurrenceMode !== "for-months" ||
          Boolean(input.recurrenceMonths))))
  );
}

function buildPreviewTransaction(
  input: ReturnType<typeof normalizeTransactionInput>,
): Transaction {
  const createdAt = getTransactionCreatedAt(input.transactionDate);

  return {
    id: "preview-transaction",
    title: input.title,
    amount: input.amount,
    type: input.type,
    category: input.category,
    transactionKind: input.transactionKind as TransactionKind,
    sourceId: null,
    occurrenceDate: null,
    installmentIndex: null,
    installmentCount: input.installmentCount,
    installmentStartDate: input.installmentStartDate,
    recurringSourceId: null,
    recurringOccurrenceDate: null,
    isRecurring: input.isRecurring,
    recurrenceType: input.recurrenceType as TransactionRecurrenceType | null,
    recurrenceMode: input.recurrenceMode as TransactionRecurrenceMode | null,
    recurrenceDay: input.recurrenceDay,
    recurrenceStartDate: input.recurrenceStartDate,
    recurrenceEndDate: input.recurrenceEndDate,
    recurrenceMonths: input.recurrenceMonths,
    lastGeneratedAt: null,
    createdAt,
  };
}

function createApiPreviewProfile(
  transactions: Transaction[],
  input: LocalFinanceTransactionInput,
) {
  const normalizedInput = normalizeTransactionInput(input);

  if (!isValidTransactionInput(normalizedInput)) {
    return null;
  }

  const previewTransaction = buildPreviewTransaction(normalizedInput);

  return applyTransactionAutomation({
    initialBalance: 0,
    transactions: sortTransactionsByMostRecent([
      previewTransaction,
      ...transactions,
    ]),
  });
}

export function useImpactSimulation({
  createLocalPreviewProfile,
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

  const simulateImpact = useCallback((input: LocalFinanceTransactionInput) => {
    if (source === "local") {
      const previewProfile = createLocalPreviewProfile(input);
      setPreviewTransactions(previewProfile?.transactions ?? null);
      return;
    }

    const previewProfile = createApiPreviewProfile(transactions, input);
    setPreviewTransactions(previewProfile?.transactions ?? null);
  }, [createLocalPreviewProfile, source, transactions]);

  return {
    clearSimulation,
    isPreviewActive: previewTransactions !== null,
    previewTransactions,
    simulateImpact,
  };
}
