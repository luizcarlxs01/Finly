import type { LocalFinanceProfile } from "@/types/local-finance-profile";
import type { Transaction } from "@/types/transaction";
import { normalizeTransaction } from "@/utils/transaction-normalization";

const STORAGE_KEY = "finly_local_finance_profile";

const defaultProfile: LocalFinanceProfile = {
  initialBalance: 0,
  transactions: [],
};

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
        ? parsedValue.transactions.map((transaction) =>
            normalizeTransaction(transaction as Transaction),
          )
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
