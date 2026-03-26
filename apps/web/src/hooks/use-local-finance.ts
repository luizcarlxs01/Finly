"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  LocalFinanceProfile,
  Transaction,
  TransactionType,
} from "@/types/finance";
import {
  DEFAULT_TRANSACTION_CATEGORY,
  TRANSACTION_CATEGORIES,
} from "@/types/transaction-category";

const LOCAL_STORAGE_KEY = "finly:local-finance";

type TransactionInput = {
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
};

type UpdateTransactionInput = TransactionInput & {
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

function normalizeTransactionCategory(category: unknown) {
  if (typeof category !== "string") {
    return DEFAULT_TRANSACTION_CATEGORY;
  }

  const normalizedCategory = category.trim().toLowerCase();

  if (!normalizedCategory) {
    return DEFAULT_TRANSACTION_CATEGORY;
  }

  return TRANSACTION_CATEGORIES.includes(
    normalizedCategory as (typeof TRANSACTION_CATEGORIES)[number],
  )
    ? normalizedCategory
    : DEFAULT_TRANSACTION_CATEGORY;
}

function normalizeTransactionInput(input: TransactionInput) {
  return {
    title: input.title.trim(),
    amount: Number(input.amount),
    type: input.type,
    category: normalizeTransactionCategory(input.category),
  };
}

function isValidTransactionInput(input: ReturnType<typeof normalizeTransactionInput>) {
  return (
    Boolean(input.title) &&
    !Number.isNaN(input.amount) &&
    input.amount > 0 &&
    Boolean(input.category)
  );
}

function normalizeTransaction(transaction: Transaction): Transaction {
  return {
    ...transaction,
    category: normalizeTransactionCategory(transaction.category),
  };
}

function normalizeProfile(profile: LocalFinanceProfile): LocalFinanceProfile {
  return {
    initialBalance: profile.initialBalance ?? 0,
    transactions: sortTransactionsByMostRecent(
      (profile.transactions ?? []).map((transaction) =>
        normalizeTransaction(transaction),
      ),
    ),
  };
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

  const totalIncome = useMemo(() => {
    return profile.transactions
      .filter((transaction) => transaction.type === "income")
      .reduce((total, transaction) => total + transaction.amount, 0);
  }, [profile.transactions]);

  const totalExpense = useMemo(() => {
    return profile.transactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((total, transaction) => total + transaction.amount, 0);
  }, [profile.transactions]);

  const currentBalance = useMemo(() => {
    return profile.initialBalance + totalIncome - totalExpense;
  }, [profile.initialBalance, totalIncome, totalExpense]);

  function updateInitialBalance(value: number) {
    setProfile((currentProfile) => ({
      ...currentProfile,
      initialBalance: value,
    }));
  }

  function addTransaction(input: TransactionInput) {
    const normalizedInput = normalizeTransactionInput(input);

    if (!isValidTransactionInput(normalizedInput)) {
      return;
    }

    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      title: normalizedInput.title,
      amount: normalizedInput.amount,
      type: normalizedInput.type,
      category: normalizedInput.category,
      createdAt: new Date().toISOString(),
    };

    setProfile((currentProfile) => ({
      ...currentProfile,
      transactions: sortTransactionsByMostRecent([
        newTransaction,
        ...currentProfile.transactions,
      ]),
    }));
  }

  function updateTransaction(input: UpdateTransactionInput) {
    const normalizedInput = normalizeTransactionInput(input);

    if (!isValidTransactionInput(normalizedInput)) {
      return;
    }

    setProfile((currentProfile) => ({
      ...currentProfile,
      transactions: sortTransactionsByMostRecent(
        currentProfile.transactions.map((transaction) =>
          transaction.id === input.id
            ? {
                ...transaction,
                title: normalizedInput.title,
                amount: normalizedInput.amount,
                type: normalizedInput.type,
                category: normalizedInput.category,
              }
            : transaction,
        ),
      ),
    }));
  }

  function removeTransaction(id: string) {
    setProfile((currentProfile) => ({
      ...currentProfile,
      transactions: currentProfile.transactions.filter(
        (transaction) => transaction.id !== id,
      ),
    }));
  }

  return {
    profile,
    transactions: profile.transactions,
    initialBalance: profile.initialBalance,
    totalIncome,
    totalExpense,
    currentBalance,
    isLoaded,
    updateInitialBalance,
    addTransaction,
    updateTransaction,
    removeTransaction,
  };
}
