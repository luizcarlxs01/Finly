"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  LocalFinanceProfile,
  Transaction,
  TransactionKind,
  TransactionRecurrenceMode,
  TransactionRecurrenceType,
  TransactionType,
} from "@/types/finance";
import { synchronizeInstallmentTransactions } from "@/utils/installment-transactions";
import {
  getNextRecurringOccurrenceDate,
  getTodayDateValue,
  parseDateValue,
  synchronizeRecurringTransactions,
} from "@/utils/recurring-transactions";
import {
  normalizeInstallmentCount,
  normalizeInstallmentStartDate,
  normalizeTransaction,
  normalizeTransactionKind,
  normalizeTransactionRecurrenceDay,
  normalizeTransactionRecurrenceEndDate,
  normalizeTransactionRecurrenceMode,
  normalizeTransactionRecurrenceMonths,
  normalizeTransactionRecurrenceStartDate,
  normalizeTransactionRecurrenceType,
} from "@/utils/transaction-normalization";

const LOCAL_STORAGE_KEY = "finly:local-finance";

export type LocalFinanceTransactionInput = {
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  transactionKind?: TransactionKind;
  transactionDate?: string | null;
  isRecurring: boolean;
  recurrenceType: TransactionRecurrenceType | null;
  recurrenceMode?: TransactionRecurrenceMode | null;
  recurrenceDay: number | null;
  recurrenceStartDate: string | null;
  recurrenceEndDate?: string | null;
  recurrenceMonths?: number | null;
  installmentCount?: number | null;
  installmentStartDate?: string | null;
};

type UpdateTransactionInput = LocalFinanceTransactionInput & {
  id: string;
};

const defaultProfile: LocalFinanceProfile = {
  initialBalance: 0,
  transactions: [],
};

function sortTransactionsByMostRecent(transactions: Transaction[]) {
  return [...transactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function isTemplateTransaction(transaction: Transaction) {
  return (
    transaction.transactionKind === "recurring-template" ||
    transaction.transactionKind === "installment-template"
  );
}

function isGeneratedInstance(transaction: Transaction) {
  return (
    transaction.transactionKind === "recurring-instance" ||
    transaction.transactionKind === "installment-instance"
  );
}

function getTransactionSourceId(transaction: Transaction) {
  if (typeof transaction.sourceId === "string" && transaction.sourceId.trim()) {
    return transaction.sourceId.trim();
  }

  if (
    typeof transaction.recurringSourceId === "string" &&
    transaction.recurringSourceId.trim()
  ) {
    return transaction.recurringSourceId.trim();
  }

  return null;
}

function getTransactionSeriesId(transaction: Transaction) {
  if (
    transaction.transactionKind === "recurring-template" ||
    transaction.transactionKind === "installment-template"
  ) {
    return transaction.id;
  }

  if (typeof transaction.sourceId === "string" && transaction.sourceId.trim()) {
    return transaction.sourceId.trim();
  }

  if (
    typeof transaction.recurringSourceId === "string" &&
    transaction.recurringSourceId.trim()
  ) {
    return transaction.recurringSourceId.trim();
  }

  return null;
}

function removeLinkedGeneratedTransactions(
  transactions: Transaction[],
  sourceId: string,
) {
  return transactions.filter((transaction) => {
    const transactionSourceId = getTransactionSourceId(transaction);

    if (!isGeneratedInstance(transaction)) {
      return true;
    }

    return transactionSourceId !== sourceId;
  });
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
        { minimumDate: getTodayDateValue() },
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

function normalizeProfile(profile: LocalFinanceProfile): LocalFinanceProfile {
  return applyTransactionAutomation({
    initialBalance: profile.initialBalance ?? 0,
    transactions: sortTransactionsByMostRecent(
      (profile.transactions ?? []).map((transaction) =>
        normalizeTransaction(transaction),
      ),
    ),
  });
}

export function useLocalFinance() {
  const [profile, setProfile] = useState<LocalFinanceProfile>(defaultProfile);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const storedValue = window.localStorage.getItem(LOCAL_STORAGE_KEY);

    if (!storedValue) {
      setIsLoaded(true);
      return;
    }

    try {
      const parsedValue = JSON.parse(storedValue) as LocalFinanceProfile;
      setProfile(normalizeProfile(parsedValue));
    } catch {
      setProfile(defaultProfile);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
  }, [profile, isLoaded]);

  const postedTransactions = useMemo(() => {
    return profile.transactions.filter(
      (transaction) =>
        transaction.transactionKind !== "recurring-template" &&
        transaction.transactionKind !== "installment-template",
    );
  }, [profile.transactions]);

  const totalIncome = useMemo(() => {
    return postedTransactions
      .filter((transaction) => transaction.type === "income")
      .reduce((total, transaction) => total + transaction.amount, 0);
  }, [postedTransactions]);

  const totalExpense = useMemo(() => {
    return postedTransactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((total, transaction) => total + transaction.amount, 0);
  }, [postedTransactions]);

  const currentBalance = useMemo(() => {
    return profile.initialBalance + totalIncome - totalExpense;
  }, [profile.initialBalance, totalIncome, totalExpense]);

  function updateInitialBalance(value: number) {
    setProfile((currentProfile) => ({
      ...currentProfile,
      initialBalance: value,
    }));
  }

  function createPreviewProfile(input: LocalFinanceTransactionInput) {
    const normalizedInput = normalizeTransactionInput(input);

    if (!isValidTransactionInput(normalizedInput)) {
      return null;
    }

    const createdAt = getTransactionCreatedAt(normalizedInput.transactionDate);

    const previewTransaction: Transaction = {
      id: "preview-transaction",
      title: normalizedInput.title,
      amount: normalizedInput.amount,
      type: normalizedInput.type,
      category: normalizedInput.category,
      transactionKind: normalizedInput.transactionKind,
      sourceId: null,
      occurrenceDate: null,
      installmentIndex: null,
      installmentCount: normalizedInput.installmentCount,
      installmentStartDate: normalizedInput.installmentStartDate,
      recurringSourceId: null,
      recurringOccurrenceDate: null,
      isRecurring: normalizedInput.isRecurring,
      recurrenceType: normalizedInput.recurrenceType,
      recurrenceMode: normalizedInput.recurrenceMode,
      recurrenceDay: normalizedInput.recurrenceDay,
      recurrenceStartDate: normalizedInput.recurrenceStartDate,
      recurrenceEndDate: normalizedInput.recurrenceEndDate,
      recurrenceMonths: normalizedInput.recurrenceMonths,
      lastGeneratedAt: null,
      createdAt,
    };

    return applyTransactionAutomation({
      ...profile,
      transactions: sortTransactionsByMostRecent([
        previewTransaction,
        ...profile.transactions,
      ]),
    });
  }

  function addTransaction(input: LocalFinanceTransactionInput) {
    const normalizedInput = normalizeTransactionInput(input);

    if (!isValidTransactionInput(normalizedInput)) {
      return;
    }

    const createdAt = getTransactionCreatedAt(normalizedInput.transactionDate);

    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      title: normalizedInput.title,
      amount: normalizedInput.amount,
      type: normalizedInput.type,
      category: normalizedInput.category,
      transactionKind: normalizedInput.transactionKind,
      sourceId: null,
      occurrenceDate: null,
      installmentIndex: null,
      installmentCount: normalizedInput.installmentCount,
      installmentStartDate: normalizedInput.installmentStartDate,
      recurringSourceId: null,
      recurringOccurrenceDate: null,
      isRecurring: normalizedInput.isRecurring,
      recurrenceType: normalizedInput.recurrenceType,
      recurrenceMode: normalizedInput.recurrenceMode,
      recurrenceDay: normalizedInput.recurrenceDay,
      recurrenceStartDate: normalizedInput.recurrenceStartDate,
      recurrenceEndDate: normalizedInput.recurrenceEndDate,
      recurrenceMonths: normalizedInput.recurrenceMonths,
      lastGeneratedAt: null,
      createdAt,
    };

    setProfile((currentProfile) =>
      applyTransactionAutomation({
        ...currentProfile,
        transactions: sortTransactionsByMostRecent([
          newTransaction,
          ...currentProfile.transactions,
        ]),
      }),
    );
  }

  function updateTransaction(input: UpdateTransactionInput) {
    setProfile((currentProfile) => {
      const currentTransaction = currentProfile.transactions.find(
        (transaction) => transaction.id === input.id,
      );

      if (!currentTransaction) {
        return currentProfile;
      }

      const seriesId = getTransactionSeriesId(currentTransaction);

      const transactionToEdit =
        seriesId && isGeneratedInstance(currentTransaction)
          ? currentProfile.transactions.find((transaction) => transaction.id === seriesId) ??
            currentTransaction
          : currentTransaction;

      const resolvedTransactionKind = isGeneratedInstance(currentTransaction)
        ? transactionToEdit.transactionKind
        : input.transactionKind ?? transactionToEdit.transactionKind;

      const normalizedInput = normalizeTransactionInput({
        ...input,
        transactionKind: resolvedTransactionKind,
        installmentCount:
          input.installmentCount ?? transactionToEdit.installmentCount,
        installmentStartDate:
          input.installmentStartDate ?? transactionToEdit.installmentStartDate,
        recurrenceMode: input.recurrenceMode ?? transactionToEdit.recurrenceMode,
        recurrenceEndDate:
          input.recurrenceEndDate ?? transactionToEdit.recurrenceEndDate,
        recurrenceMonths:
          input.recurrenceMonths ?? transactionToEdit.recurrenceMonths,
      });

      if (!isValidTransactionInput(normalizedInput)) {
        return currentProfile;
      }

      const baseTransactions = isTemplateTransaction(transactionToEdit)
        ? removeLinkedGeneratedTransactions(
            currentProfile.transactions,
            transactionToEdit.id,
          )
        : currentProfile.transactions;

      const targetId = transactionToEdit.id;
      const nextTransactionKind = normalizedInput.transactionKind;

      return applyTransactionAutomation({
        ...currentProfile,
        transactions: sortTransactionsByMostRecent(
          baseTransactions.map((transaction) => {
            if (transaction.id !== targetId) {
              return transaction;
            }

            return {
              ...transaction,
              title: normalizedInput.title,
              amount: normalizedInput.amount,
              type: normalizedInput.type,
              category: normalizedInput.category,
              createdAt:
                nextTransactionKind === "single"
                  ? getTransactionCreatedAt(
                      normalizedInput.transactionDate,
                      transaction.createdAt,
                    )
                  : transaction.createdAt,
              transactionKind: nextTransactionKind,
              sourceId: null,
              occurrenceDate: null,
              installmentIndex: null,
              installmentCount:
                nextTransactionKind === "installment-template"
                  ? normalizedInput.installmentCount
                  : null,
              installmentStartDate:
                nextTransactionKind === "installment-template"
                  ? normalizedInput.installmentStartDate
                  : null,
              recurringSourceId: null,
              recurringOccurrenceDate: null,
              isRecurring: nextTransactionKind === "recurring-template",
              recurrenceType:
                nextTransactionKind === "recurring-template"
                  ? normalizedInput.recurrenceType
                  : null,
              recurrenceMode:
                nextTransactionKind === "recurring-template"
                  ? normalizedInput.recurrenceMode
                  : null,
              recurrenceDay:
                nextTransactionKind === "recurring-template"
                  ? normalizedInput.recurrenceDay
                  : null,
              recurrenceStartDate:
                nextTransactionKind === "recurring-template"
                  ? normalizedInput.recurrenceStartDate
                  : null,
              recurrenceEndDate:
                nextTransactionKind === "recurring-template"
                  ? normalizedInput.recurrenceEndDate
                  : null,
              recurrenceMonths:
                nextTransactionKind === "recurring-template"
                  ? normalizedInput.recurrenceMonths
                  : null,
              lastGeneratedAt: null,
            };
          }),
        ),
      });
    });
  }

  function removeTransaction(id: string) {
    setProfile((currentProfile) => {
      const transactionToRemove = currentProfile.transactions.find(
        (transaction) => transaction.id === id,
      );

      if (!transactionToRemove) {
        return currentProfile;
      }

      const seriesId = getTransactionSeriesId(transactionToRemove);
      const targetId =
        seriesId && isGeneratedInstance(transactionToRemove)
          ? seriesId
          : transactionToRemove.id;

      const transactionsWithoutCurrent = currentProfile.transactions.filter(
        (transaction) => transaction.id !== targetId,
      );

      const nextTransactions = seriesId
        ? removeLinkedGeneratedTransactions(transactionsWithoutCurrent, targetId)
        : transactionsWithoutCurrent;

      return {
        ...currentProfile,
        transactions: nextTransactions,
      };
    });
  }

  function getNextRecurringOccurrence(transaction: Transaction) {
    if (transaction.transactionKind === "recurring-template") {
      return getNextRecurringOccurrenceDate(transaction);
    }

    if (
      transaction.transactionKind === "recurring-instance" &&
      transaction.sourceId
    ) {
      const recurringTemplate = profile.transactions.find(
        (item) =>
          item.id === transaction.sourceId &&
          item.transactionKind === "recurring-template",
      );

      if (!recurringTemplate) {
        return null;
      }

      return getNextRecurringOccurrenceDate(recurringTemplate);
    }

    return null;
  }

  return {
    profile,
    transactions: profile.transactions,
    postedTransactions,
    initialBalance: profile.initialBalance,
    totalIncome,
    totalExpense,
    currentBalance,
    isLoaded,
    updateInitialBalance,
    addTransaction,
    updateTransaction,
    removeTransaction,
    getNextRecurringOccurrence,
    createPreviewProfile,
  };
}
