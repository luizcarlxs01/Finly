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
import type { ApiTransaction } from "@/types/api-transaction";
import type { DashboardSummary } from "@/types/dashboard";
import type { OccurrenceStatus } from "@/types/occurrence";
import type { Profile } from "@/types/profile";
import type {
  Transaction,
  TransactionKind,
  TransactionRecurrenceMode,
  TransactionType,
} from "@/types/transaction";

type FinanceDataState = {
  apiContractTransactions: ApiTransaction[];
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

function normalizeTransactionType(value: string): TransactionType {
  return value.trim().toLowerCase() === "income" ? "income" : "expense";
}

/**
 * O contrato (ApiTransaction.transactionKind) só assume "Single"/"Installment"/"Recurring"
 * no modelo novo (seção 21 do CLAUDE.md). O check por substring também cobre defensivamente
 * os valores legados depreciados (InstallmentTemplate/Instance, RecurringTemplate/Instance)
 * caso alguma linha antiga ainda exista no banco.
 */
function getDisplayKindForOccurrence(contractKind: string): TransactionKind {
  const normalizedValue = contractKind.trim().toLowerCase();

  if (normalizedValue.includes("installment")) {
    return "installment-instance";
  }

  if (normalizedValue.includes("recurring")) {
    return "recurring-instance";
  }

  return "single";
}

function normalizeOccurrenceStatus(value: string): OccurrenceStatus {
  return value.trim().toLowerCase() === "paid" ? "paid" : "pending";
}

function inferRecurrenceMode(transaction: ApiTransaction): TransactionRecurrenceMode | null {
  if (transaction.recurrenceEndDate) {
    return "until-date";
  }

  if (transaction.recurrenceMonths) {
    return "for-months";
  }

  return transaction.isRecurring ? "indefinite" : null;
}

/**
 * No modelo novo, GET /api/Transactions retorna 1 linha por CONTRATO (Single/Installment/
 * Recurring), cada uma com as Occurrences reais embutidas (seção 21 do CLAUDE.md). A UI,
 * porém, continua precisando de 1 linha por ocorrência (parcela/competência), então cada
 * Transaction vira N linhas de Transaction "achatadas" — uma por Occurrence.
 */
function flattenApiTransactionToLineItems(transaction: ApiTransaction): Transaction[] {
  const displayKind = getDisplayKindForOccurrence(transaction.transactionKind);
  const recurrenceMode = inferRecurrenceMode(transaction);

  return transaction.occurrences.map((occurrence) => ({
    id: occurrence.id,
    title: transaction.title,
    amount: occurrence.amount,
    type: normalizeTransactionType(transaction.type),
    category: transaction.category,
    transactionKind: displayKind,
    sourceId: transaction.id,
    occurrenceDate: occurrence.dueDate,
    installmentIndex: occurrence.installmentIndex,
    installmentCount: transaction.installmentCount,
    installmentStartDate: null,
    recurringSourceId: displayKind === "recurring-instance" ? transaction.id : null,
    recurringOccurrenceDate:
      displayKind === "recurring-instance" ? occurrence.dueDate : null,
    isRecurring: transaction.isRecurring,
    recurrenceType: displayKind === "recurring-instance" ? "monthly" : null,
    recurrenceMode,
    recurrenceDay: transaction.recurrenceDay,
    recurrenceStartDate: transaction.recurrenceStartDate,
    recurrenceEndDate: transaction.recurrenceEndDate,
    recurrenceMonths: transaction.recurrenceMonths,
    lastGeneratedAt: null,
    createdAt: transaction.createdAt,
    occurrenceId: occurrence.id,
    occurrenceStatus: normalizeOccurrenceStatus(occurrence.status),
    isCustomized: occurrence.isCustomized,
  }));
}

export function useFinanceData(
  options: UseFinanceDataOptions,
): FinanceDataState {
  const { source, isLoaded: isSourceLoaded } = useFinanceSource();
  const { session } = useAuthSession();
  const localFinance = options.localFinance;
  const [apiDashboard, setApiDashboard] = useState<DashboardSummary | null>(null);
  const [apiTransactions, setApiTransactions] = useState<Transaction[]>([]);
  const [apiContractTransactions, setApiContractTransactions] = useState<
    ApiTransaction[]
  >([]);
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
      setApiContractTransactions([]);
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
          setApiContractTransactions([]);
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
        setApiContractTransactions(transactions);
        setApiTransactions(transactions.flatMap(flattenApiTransactionToLineItems));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setSelectedProfile(null);
        setApiDashboard(null);
        setApiTransactions([]);
        setApiContractTransactions([]);
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
    () => apiTransactions.filter((transaction) => transaction.occurrenceStatus === "paid"),
    [apiTransactions],
  );

  if (source === "local") {
    return {
      apiContractTransactions: [],
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
    apiContractTransactions,
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
