import type { LocalFinanceProfile } from "@/types/local-finance-profile";
import {
  DEFAULT_TRANSACTION_CATEGORY,
  TRANSACTION_CATEGORIES,
} from "@/types/transaction-category";

const STORAGE_KEY = "finly_local_finance_profile";

const defaultProfile: LocalFinanceProfile = {
  initialBalance: 0,
  transactions: [],
};

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

export function getLocalFinanceProfile(): LocalFinanceProfile {
  if (typeof window === "undefined") {
    return defaultProfile;
  }

  const storedValue = window.localStorage.getItem(STORAGE_KEY);

  if (!storedValue) {
    return defaultProfile;
  }

  try {
    const parsedValue = JSON.parse(storedValue) as LocalFinanceProfile;

    return {
      initialBalance: Number(parsedValue.initialBalance ?? 0),
      transactions: Array.isArray(parsedValue.transactions)
        ? parsedValue.transactions.map((transaction) => ({
            ...transaction,
            category: normalizeTransactionCategory(transaction.category),
          }))
        : [],
    };
  } catch {
    return defaultProfile;
  }
}

export function saveLocalFinanceProfile(
  profile: LocalFinanceProfile,
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}
