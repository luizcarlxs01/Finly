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
import type { Profile } from "@/types/profile";
import type { Transaction } from "@/types/transaction";
import { flattenApiTransactionToLineItems } from "@/utils/flatten-transaction";

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
