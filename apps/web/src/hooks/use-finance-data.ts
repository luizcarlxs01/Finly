"use client";

import { useEffect, useMemo, useState } from "react";
import { useFinanceSource } from "@/contexts/finance-source-context";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useLocalFinance } from "@/hooks/use-local-finance";
import { getDashboardSummary } from "@/lib/api/dashboard";
import {
  getProfiles,
  PROFILE_UPDATED_EVENT,
} from "@/lib/api/profiles";
import {
  getTransactions,
  TRANSACTION_WRITE_COMPLETED_EVENT,
} from "@/lib/api/transactions";
import { GOAL_WRITE_COMPLETED_EVENT } from "@/lib/api/goals";
import { RULE_PROCESSING_COMPLETED_EVENT } from "@/lib/api/rule-processing";
import type { DashboardSummary } from "@/types/dashboard";
import type { Profile } from "@/types/profile";
import type {
  Transaction,
  TransactionKind,
  TransactionRecurrenceMode,
  TransactionType,
} from "@/types/transaction";

type FinanceDataState = {
  currentBalance: number;
  dashboard: DashboardSummary | null;
  errorMessage: string | null;
  initialBalance: number;
  isLoaded: boolean;
  isLoading: boolean;
  postedTransactions: Transaction[];
  selectedProfile: Profile | null;
  source: "local" | "api";
  totalExpense: number;
  totalIncome: number;
  transactions: Transaction[];
};

type UseFinanceDataOptions = {
  localFinance: ReturnType<typeof useLocalFinance>;
};

const LOCAL_DASHBOARD_PROFILE_ID = "local-profile";
const LOCAL_DASHBOARD_PROFILE_NAME = "Modo local";

function getFriendlyErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Não foi possível carregar os dados financeiros da API agora.";
}

function getSelectedProfile(profiles: Profile[]) {
  return profiles.find((profile) => profile.isPrimary) ?? profiles[0] ?? null;
}

function toKebabCase(value: string) {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/_/g, "-")
    .toLowerCase();
}

function normalizeTransactionType(value: string): TransactionType {
  return value.trim().toLowerCase() === "income" ? "income" : "expense";
}

function normalizeTransactionKind(value: string, isRecurring: boolean): TransactionKind {
  const normalizedValue = toKebabCase(value);

  if (
    normalizedValue === "single" ||
    normalizedValue === "installment-template" ||
    normalizedValue === "installment-instance" ||
    normalizedValue === "recurring-template" ||
    normalizedValue === "recurring-instance"
  ) {
    return normalizedValue;
  }

  return isRecurring ? "recurring-instance" : "single";
}

function normalizeRecurrenceMode(
  value: string | null,
): TransactionRecurrenceMode | null {
  if (!value) {
    return null;
  }

  const normalizedValue = toKebabCase(value);

  if (
    normalizedValue === "indefinite" ||
    normalizedValue === "until-date" ||
    normalizedValue === "for-months"
  ) {
    return normalizedValue;
  }

  return null;
}

function inferRecurrenceMode(transaction: Awaited<ReturnType<typeof getTransactions>>[number]) {
  if (transaction.recurrenceEndDate) {
    return "until-date";
  }

  if (transaction.recurrenceMonths) {
    return "for-months";
  }

  return transaction.isRecurring ? "indefinite" : null;
}

function getTodayDateValue() {
  return new Date().toISOString().slice(0, 10);
}

function isTransactionPosted(transaction: Transaction) {
  const transactionDate =
    transaction.occurrenceDate ??
    transaction.recurrenceStartDate ??
    transaction.installmentStartDate;

  if (!transactionDate) {
    return true;
  }

  return transactionDate <= getTodayDateValue();
}

function mapApiTransactionToTransaction(
  transaction: Awaited<ReturnType<typeof getTransactions>>[number],
): Transaction {
  const transactionKind = normalizeTransactionKind(
    transaction.transactionKind,
    transaction.isRecurring,
  );
  const recurrenceStartDate =
    transaction.recurrenceStartDate ??
    (transactionKind === "recurring-template" ? transaction.transactionDate : null);
  const occurrenceDate = transaction.transactionDate;

  return {
    id: transaction.id,
    title: transaction.title,
    amount: transaction.amount,
    type: normalizeTransactionType(transaction.type),
    category: transaction.category,
    transactionKind,
    sourceId: transaction.sourceId,
    occurrenceDate,
    installmentIndex: transaction.installmentIndex,
    installmentCount: transaction.installmentCount,
    installmentStartDate:
      transactionKind === "installment-template" ? transaction.transactionDate : null,
    recurringSourceId:
      transactionKind === "recurring-instance" ? transaction.sourceId : null,
    recurringOccurrenceDate:
      transactionKind === "recurring-instance" ? occurrenceDate : null,
    isRecurring: transaction.isRecurring,
    recurrenceType: transactionKind === "recurring-template" ? "monthly" : null,
    recurrenceMode: inferRecurrenceMode(transaction),
    recurrenceDay: transaction.recurrenceDay,
    recurrenceStartDate,
    recurrenceEndDate: transaction.recurrenceEndDate,
    recurrenceMonths: transaction.recurrenceMonths,
    lastGeneratedAt: null,
    createdAt: transaction.createdAt,
  };
}

export function useFinanceData(
  options: UseFinanceDataOptions,
): FinanceDataState {
  const { source, isLoaded: isSourceLoaded } = useFinanceSource();
  const { session } = useAuthSession();
  const localFinance = options.localFinance;
  const [apiDashboard, setApiDashboard] = useState<DashboardSummary | null>(null);
  const [apiTransactions, setApiTransactions] = useState<Transaction[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const token = session?.token ?? null;

  useEffect(() => {
    function handleRulesProcessed() {
      setReloadKey((current) => current + 1);
    }

    function handleTransactionWritten() {
      setReloadKey((current) => current + 1);
    }

    function handleProfileUpdated() {
      setReloadKey((current) => current + 1);
    }

    function handleGoalWritten() {
      setReloadKey((current) => current + 1);
    }

    window.addEventListener(RULE_PROCESSING_COMPLETED_EVENT, handleRulesProcessed);
    window.addEventListener(
      TRANSACTION_WRITE_COMPLETED_EVENT,
      handleTransactionWritten,
    );
    window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
    window.addEventListener(GOAL_WRITE_COMPLETED_EVENT, handleGoalWritten);

    return () => {
      window.removeEventListener(
        RULE_PROCESSING_COMPLETED_EVENT,
        handleRulesProcessed,
      );
      window.removeEventListener(
        TRANSACTION_WRITE_COMPLETED_EVENT,
        handleTransactionWritten,
      );
      window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
      window.removeEventListener(GOAL_WRITE_COMPLETED_EVENT, handleGoalWritten);
    };
  }, []);

  useEffect(() => {
    if (!isSourceLoaded || source !== "api" || !token) {
      setApiDashboard(null);
      setApiTransactions([]);
      setSelectedProfile(null);
      setErrorMessage(null);
      setIsApiLoading(false);
      return;
    }

    const authToken = token;
    let isMounted = true;

    async function loadApiFinanceData() {
      setIsApiLoading(true);
      setErrorMessage(null);

      try {
        const profiles = await getProfiles(authToken);
        const nextSelectedProfile = getSelectedProfile(profiles);

        if (!isMounted) {
          return;
        }

        if (!nextSelectedProfile) {
          setSelectedProfile(null);
          setApiDashboard(null);
          setApiTransactions([]);
          return;
        }

        setSelectedProfile(nextSelectedProfile);

        const [dashboard, transactions] = await Promise.all([
          getDashboardSummary(nextSelectedProfile.id, authToken),
          getTransactions(nextSelectedProfile.id, authToken),
        ]);

        if (!isMounted) {
          return;
        }

        setApiDashboard(dashboard);
        setApiTransactions(transactions.map(mapApiTransactionToTransaction));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setSelectedProfile(null);
        setApiDashboard(null);
        setApiTransactions([]);
        setErrorMessage(getFriendlyErrorMessage(error));
      } finally {
        if (isMounted) {
          setIsApiLoading(false);
        }
      }
    }

    loadApiFinanceData();

    return () => {
      isMounted = false;
    };
  }, [isSourceLoaded, reloadKey, source, token]);

  const localDashboard = useMemo<DashboardSummary>(
    () => ({
      financialProfileId: LOCAL_DASHBOARD_PROFILE_ID,
      profileName: LOCAL_DASHBOARD_PROFILE_NAME,
      initialBalance: localFinance.initialBalance,
      totalIncome: localFinance.totalIncome,
      totalExpense: localFinance.totalExpense,
      currentBalance: localFinance.currentBalance,
      transactionCount: localFinance.postedTransactions.length,
      goalCount: 0,
      completedGoalCount: 0,
    }),
    [
      localFinance.currentBalance,
      localFinance.initialBalance,
      localFinance.postedTransactions.length,
      localFinance.totalExpense,
      localFinance.totalIncome,
    ],
  );

  const apiPostedTransactions = useMemo(
    () =>
      apiTransactions.filter(
        (transaction) =>
          transaction.transactionKind !== "recurring-template" &&
          transaction.transactionKind !== "installment-template" &&
          isTransactionPosted(transaction),
      ),
    [apiTransactions],
  );

  if (source === "local") {
    return {
      currentBalance: localFinance.currentBalance,
      source,
      initialBalance: localFinance.initialBalance,
      isLoaded: isSourceLoaded && localFinance.isLoaded,
      isLoading: !isSourceLoaded || !localFinance.isLoaded,
      errorMessage: null,
      postedTransactions: localFinance.postedTransactions,
      selectedProfile: null,
      dashboard: localDashboard,
      totalExpense: localFinance.totalExpense,
      totalIncome: localFinance.totalIncome,
      transactions: localFinance.transactions,
    };
  }

  return {
    currentBalance: apiDashboard?.currentBalance ?? 0,
    source,
    initialBalance: apiDashboard?.initialBalance ?? 0,
    isLoaded: isSourceLoaded && !isApiLoading,
    isLoading: !isSourceLoaded || isApiLoading,
    errorMessage,
    postedTransactions: apiPostedTransactions,
    selectedProfile,
    dashboard: apiDashboard,
    totalExpense: apiDashboard?.totalExpense ?? 0,
    totalIncome: apiDashboard?.totalIncome ?? 0,
    transactions: apiTransactions,
  };
}
