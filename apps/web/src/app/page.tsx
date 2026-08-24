"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpDown, Plus, Target, X } from "lucide-react";
import {
  AppFloatingHeader,
  type DashboardView,
} from "@/components/layout/app-floating-header";
import { AccountAccessCard } from "@/components/auth/account-access-card";
import { TransactionForm } from "@/components/dashboard/transaction-form";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardHomeView } from "@/components/dashboard/views/dashboard-home-view";
import { DashboardTransactionsView } from "@/components/dashboard/views/dashboard-transactions-view";
import { DashboardGoalsView } from "@/components/dashboard/views/dashboard-goals-view";
import { DashboardInsightsView } from "@/components/dashboard/views/dashboard-insights-view";
import { FinancialRulesManager } from "@/components/dashboard/financial-rules-manager";
import { useFinanceSource } from "@/contexts/finance-source-context";
import { useCreateTransaction } from "@/hooks/use-create-transaction";
import { useCreateGoal } from "@/hooks/use-create-goal";
import { useCancelOccurrence } from "@/hooks/use-cancel-occurrence";
import { useDeleteGoal } from "@/hooks/use-delete-goal";
import { useDeleteTransaction } from "@/hooks/use-delete-transaction";
import { useFinanceData } from "@/hooks/use-finance-data";
import { useFinancialRulesData } from "@/hooks/use-financial-rules-data";
import { useGoalsData } from "@/hooks/use-goals-data";
import { useImpactSimulation } from "@/hooks/use-impact-simulation";
import { useMarkOccurrencePaid } from "@/hooks/use-mark-occurrence-paid";
import { useMarkOccurrencePending } from "@/hooks/use-mark-occurrence-pending";
import { useUpdateGoalProgress } from "@/hooks/use-update-goal-progress";
import { useUpdateOccurrence } from "@/hooks/use-update-occurrence";
import { useUpdateTransaction } from "@/hooks/use-update-transaction";
import { useUpdateInitialBalance } from "@/hooks/use-update-initial-balance";
import { GoalForm } from "@/components/dashboard/goal-form";
import { GoalProgressModal } from "@/components/dashboard/goal-progress-modal";
import { FinancialCalendarModal } from "@/components/dashboard/overlays/financial-calendar-modal";
import { StatementProjectionModal } from "@/components/dashboard/overlays/statement-projection-modal";
import { TransactionEditModal } from "@/components/dashboard/transaction-edit-modal";
import { PageContainer } from "@/components/layout/page-container";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import {
  type LocalFinanceTransactionInput,
  useLocalFinance,
} from "@/hooks/use-local-finance";
import { useLocalGoals } from "@/hooks/use-local-goals";
import type { Transaction, TransactionFilter } from "@/types/finance";
import type { Goal } from "@/types/goal";
import { getTransactionCategoryLabel } from "@/types/transaction-category";
import { getDashboardInsights } from "@/utils/dashboard-insights";
import { getNextRecurringOccurrenceDate } from "@/utils/recurring-transactions";
import { getNextMonthLabel } from "@/utils/financial-calendar";
import type { TransactionSortOption } from "@/components/dashboard/transaction-advanced-filters";

const DEFAULT_CATEGORY_FILTER = "all";
const DEFAULT_SORT_OPTION: TransactionSortOption = "newest";

function normalizeSearchValue(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR");
}

function sortTransactions<
  T extends { title: string; amount: number; createdAt: string },
>(items: T[], sortOption: TransactionSortOption) {
  return [...items].sort((left, right) => {
    switch (sortOption) {
      case "oldest":
        return (
          new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
        );
      case "highest":
        return right.amount - left.amount;
      case "lowest":
        return left.amount - right.amount;
      case "title-asc":
        return left.title.localeCompare(right.title, "pt-BR");
      case "title-desc":
        return right.title.localeCompare(left.title, "pt-BR");
      case "newest":
      default:
        return (
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
        );
    }
  });
}

function getPostedTransactions(transactions: Transaction[]) {
  return transactions.filter((transaction) => transaction.occurrenceStatus === "paid");
}

function getProjectionSnapshot(
  initialBalance: number,
  transactions: Transaction[],
) {
  const postedTransactions = getPostedTransactions(transactions);
  const totalIncome = postedTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + transaction.amount, 0);
  const totalExpense = postedTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amount, 0);

  return {
    postedTransactions,
    totalIncome,
    totalExpense,
    currentBalance: initialBalance + totalIncome - totalExpense,
  };
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function HomePage() {
  const [hasMounted, setHasMounted] = useState(false);
  const { source } = useFinanceSource();
  const localFinance = useLocalFinance();
  const localGoals = useLocalGoals();
  const financeData = useFinanceData({ localFinance });
  const goalsData = useGoalsData({ localGoals });
  const {
    updateInitialBalance,
    addTransaction,
    updateTransaction,
    removeTransaction,
    updateOccurrence: updateLocalOccurrence,
    markOccurrencePaid: markLocalOccurrencePaid,
    markOccurrencePending: markLocalOccurrencePending,
    cancelOccurrence: cancelLocalOccurrence,
  } = localFinance;

  const {
    addGoal,
    updateGoalProgress,
    removeGoal,
  } = localGoals;

  const [activeView, setActiveView] = useState<DashboardView>("home");
  const [transactionFilter, setTransactionFilter] =
    useState<TransactionFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(DEFAULT_CATEGORY_FILTER);
  const [sortOption, setSortOption] =
    useState<TransactionSortOption>(DEFAULT_SORT_OPTION);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [pendingRemovalTransactionId, setPendingRemovalTransactionId] =
    useState<string | null>(null);
  const [pendingContractDeletionId, setPendingContractDeletionId] =
    useState<string | null>(null);
  const [writeModeMessage, setWriteModeMessage] = useState<string | null>(null);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isStatementProjectionModalOpen, setIsStatementProjectionModalOpen] = useState(false);
  const [isAccountCardOpen, setIsAccountCardOpen] = useState(false);
  const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false);
  const [isFabTransactionOpen, setIsFabTransactionOpen] = useState(false);
  const [isFabGoalOpen, setIsFabGoalOpen] = useState(false);

  const isApiMode = source === "api";
  const {
    currentBalance,
    initialBalance,
    postedTransactions,
    totalExpense,
    totalIncome,
    transactions,
  } = financeData;
  const {
    goals,
    remainingGoalAmount,
    totalGoalProgress,
  } = goalsData;
  const {
    deleteGoal: deleteGoalUnified,
    errorMessage: deleteGoalErrorMessage,
    isSubmitting: isDeletingGoal,
  } = useDeleteGoal({
    removeLocalGoal: removeGoal,
  });
  const {
    createGoal,
    errorMessage: createGoalErrorMessage,
    isSubmitting: isCreatingGoal,
  } = useCreateGoal({
    addLocalGoal: addGoal,
    selectedProfile: financeData.selectedProfile,
  });
  const {
    errorMessage: updateGoalProgressErrorMessage,
    isSubmitting: isUpdatingGoalProgress,
    updateGoalProgress: updateGoalProgressUnified,
  } = useUpdateGoalProgress({
    updateLocalGoalProgress: updateGoalProgress,
  });
  const {
    createTransaction,
    errorMessage: createTransactionErrorMessage,
    isSubmitting: isCreatingTransaction,
  } = useCreateTransaction({
    addLocalTransaction: addTransaction,
    selectedProfile: financeData.selectedProfile,
  });
  const {
    errorMessage: updateInitialBalanceErrorMessage,
    isSubmitting: isUpdatingInitialBalance,
    updateInitialBalance: updateInitialBalanceUnified,
  } = useUpdateInitialBalance({
    updateLocalInitialBalance: updateInitialBalance,
    selectedProfile: financeData.selectedProfile,
  });
  const {
    errorMessage: updateTransactionErrorMessage,
    isSubmitting: isUpdatingTransaction,
    updateTransaction: updateTransactionUnified,
  } = useUpdateTransaction({
    apiContractTransactions: financeData.apiContractTransactions,
    updateLocalTransaction: updateTransaction,
    selectedProfile: financeData.selectedProfile,
    transactions,
  });
  const {
    deleteTransaction: deleteTransactionUnified,
    errorMessage: deleteTransactionErrorMessage,
    isSubmitting: isDeletingTransaction,
  } = useDeleteTransaction({
    removeLocalTransaction: removeTransaction,
  });
  const {
    updateOccurrence,
    errorMessage: updateOccurrenceErrorMessage,
    isSubmitting: isUpdatingOccurrence,
  } = useUpdateOccurrence({ updateLocalOccurrence });
  const {
    markAsPaid: markOccurrenceAsPaid,
    errorMessage: markOccurrencePaidErrorMessage,
    isSubmitting: isMarkingOccurrencePaid,
  } = useMarkOccurrencePaid({ markLocalOccurrencePaid });
  const {
    markAsPending: markOccurrenceAsPending,
    errorMessage: markOccurrencePendingErrorMessage,
    isSubmitting: isMarkingOccurrencePending,
  } = useMarkOccurrencePending({ markLocalOccurrencePending });
  const {
    cancelOccurrence,
    errorMessage: cancelOccurrenceErrorMessage,
    isSubmitting: isCancellingOccurrence,
  } = useCancelOccurrence({ cancelLocalOccurrence });
  const {
    createRule,
    deleteRule,
    errorMessage: financialRulesErrorMessage,
    isLoading: isFinancialRulesLoading,
    isProcessing: isProcessingRules,
    isSubmitting: isSubmittingFinancialRule,
    processErrorMessage,
    processResult,
    processRules,
    rules,
    updateRule,
  } = useFinancialRulesData({
    selectedProfileId: financeData.selectedProfile?.id ?? null,
  });
  const {
    clearSimulation,
    isPreviewActive,
    previewTransactions,
    simulateImpact,
  } = useImpactSimulation({
    source,
    transactions,
  });

  const statementTransactions = transactions;

  const filteredTransactions = useMemo(() => {
    const normalizedSearchTerm = normalizeSearchValue(searchTerm);

    const filteredItems = statementTransactions.filter((transaction) => {
      const matchesType =
        transactionFilter === "all" || transaction.type === transactionFilter;
      const matchesCategory =
        categoryFilter === DEFAULT_CATEGORY_FILTER ||
        transaction.category === categoryFilter;

      if (!matchesType || !matchesCategory) {
        return false;
      }

      if (!normalizedSearchTerm) {
        return true;
      }

      const searchableContent = [
        transaction.title,
        getTransactionCategoryLabel(transaction.category),
        transaction.amount.toString(),
      ]
        .join(" ")
        .toLocaleLowerCase("pt-BR");

      return searchableContent.includes(normalizedSearchTerm);
    });

    return sortTransactions(filteredItems, sortOption);
  }, [
    statementTransactions,
    transactionFilter,
    categoryFilter,
    searchTerm,
    sortOption,
  ]);

  const insights = useMemo(
    () =>
      getDashboardInsights({
        transactions: postedTransactions,
        goals,
        totalIncome,
        totalExpense,
        currentBalance,
      }),
    [postedTransactions, goals, totalIncome, totalExpense, currentBalance],
  );

  const projectionTransactions = previewTransactions ?? transactions;
  const projectionSnapshot = useMemo(() => {
    if (previewTransactions === null) {
      return {
        postedTransactions,
        totalIncome,
        totalExpense,
        currentBalance,
      };
    }

    return getProjectionSnapshot(initialBalance, previewTransactions);
  }, [
    currentBalance,
    initialBalance,
    postedTransactions,
    previewTransactions,
    totalExpense,
    totalIncome,
  ]);

  const nextUpcomingMonthLabel = useMemo(() => getNextMonthLabel(), []);

  const forecast = useMemo(() => {
    return {
      totalIncome: projectionSnapshot.totalIncome,
      totalExpense: projectionSnapshot.totalExpense,
      projectedBalance: projectionSnapshot.currentBalance,
    };
  }, [projectionSnapshot]);

  const getNextRecurringOccurrence = useCallback(
    (transaction: Transaction): string | null => {
      if (transaction.transactionKind === "recurring-template") {
        return getNextRecurringOccurrenceDate(transaction);
      }
      if (transaction.transactionKind === "recurring-instance" && transaction.sourceId) {
        const template = transactions.find(
          (t) => t.id === transaction.sourceId && t.transactionKind === "recurring-template",
        );
        return template ? getNextRecurringOccurrenceDate(template) : null;
      }
      return null;
    },
    [transactions],
  );

  const hasActiveAdvancedFilters =
    searchTerm.trim().length > 0 ||
    categoryFilter !== DEFAULT_CATEGORY_FILTER ||
    sortOption !== DEFAULT_SORT_OPTION;

  const hasAnyTransaction = statementTransactions.length > 0;
  const emptyStateTitle = hasAnyTransaction
    ? "Nenhum resultado para os filtros aplicados"
    : "Nenhuma transação cadastrada";
  const emptyStateDescription = hasAnyTransaction
    ? "Ajuste a busca, categoria, tipo ou ordenação para encontrar outras movimentações."
    : "Assim que você registrar movimentações, elas aparecerão organizadas aqui.";

  useEffect(() => {
    clearSimulation();
    setEditingTransaction(null);
    setSelectedGoal(null);
    setPendingRemovalTransactionId(null);
    setPendingContractDeletionId(null);
  }, [clearSimulation, source]);

  useEffect(() => {
    if (!createTransactionErrorMessage) {
      return;
    }

    setWriteModeMessage(createTransactionErrorMessage);
  }, [createTransactionErrorMessage]);

  useEffect(() => {
    if (!createGoalErrorMessage) {
      return;
    }

    setWriteModeMessage(createGoalErrorMessage);
  }, [createGoalErrorMessage]);

  useEffect(() => {
    if (!updateGoalProgressErrorMessage) {
      return;
    }

    setWriteModeMessage(updateGoalProgressErrorMessage);
  }, [updateGoalProgressErrorMessage]);

  useEffect(() => {
    if (!deleteGoalErrorMessage) {
      return;
    }

    setWriteModeMessage(deleteGoalErrorMessage);
  }, [deleteGoalErrorMessage]);

  useEffect(() => {
    if (!updateInitialBalanceErrorMessage) {
      return;
    }

    setWriteModeMessage(updateInitialBalanceErrorMessage);
  }, [updateInitialBalanceErrorMessage]);

  useEffect(() => {
    if (!updateTransactionErrorMessage) {
      return;
    }

    setWriteModeMessage(updateTransactionErrorMessage);
  }, [updateTransactionErrorMessage]);

  useEffect(() => {
    if (!deleteTransactionErrorMessage) {
      return;
    }

    setWriteModeMessage(deleteTransactionErrorMessage);
  }, [deleteTransactionErrorMessage]);

  useEffect(() => {
    if (!updateOccurrenceErrorMessage) {
      return;
    }

    setWriteModeMessage(updateOccurrenceErrorMessage);
  }, [updateOccurrenceErrorMessage]);

  useEffect(() => {
    if (!markOccurrencePaidErrorMessage) {
      return;
    }

    setWriteModeMessage(markOccurrencePaidErrorMessage);
  }, [markOccurrencePaidErrorMessage]);

  useEffect(() => {
    if (!markOccurrencePendingErrorMessage) {
      return;
    }

    setWriteModeMessage(markOccurrencePendingErrorMessage);
  }, [markOccurrencePendingErrorMessage]);

  useEffect(() => {
    if (!cancelOccurrenceErrorMessage) {
      return;
    }

    setWriteModeMessage(cancelOccurrenceErrorMessage);
  }, [cancelOccurrenceErrorMessage]);

  function handleClearAdvancedFilters() {
    setSearchTerm("");
    setCategoryFilter(DEFAULT_CATEGORY_FILTER);
    setSortOption(DEFAULT_SORT_OPTION);
    setTransactionFilter("all");
  }

  function handleOpenEditModal(transaction: Transaction) {
    setEditingTransaction(transaction);
  }

  function handlePreviewTransaction(input: LocalFinanceTransactionInput) {
    simulateImpact(input);
  }

  function handleClearPreview() {
    clearSimulation();
  }

  async function handleUpdateInitialBalance(value: number) {
    await updateInitialBalanceUnified(value);
    setWriteModeMessage(null);
    clearSimulation();
  }

  async function handleAddTransaction(input: LocalFinanceTransactionInput) {
    await createTransaction(input);
    setWriteModeMessage(null);
    clearSimulation();
  }

  async function handleUpdateTransaction(
    input: Parameters<typeof updateTransaction>[0],
  ) {
    await updateTransactionUnified(input);
    setWriteModeMessage(null);
    clearSimulation();
  }

  function handleRemoveTransaction(id: string) {
    setPendingRemovalTransactionId(id);
  }

  async function handleConfirmRemoveTransaction() {
    if (!pendingRemovalTransactionId) {
      return;
    }

    try {
      await cancelOccurrence(pendingRemovalTransactionId);
      setWriteModeMessage(null);
      clearSimulation();
      setPendingRemovalTransactionId(null);
    } catch {
      // A mensagem de erro é tratada na página principal.
    }
  }

  async function handleSaveOccurrence(input: { id: string; dueDate: string; amount: number }) {
    await updateOccurrence(input);
    setWriteModeMessage(null);
    clearSimulation();
  }

  async function handleMarkOccurrencePaid(occurrenceId: string) {
    await markOccurrenceAsPaid(occurrenceId);
    setWriteModeMessage(null);
    clearSimulation();
  }

  async function handleMarkOccurrencePending(occurrenceId: string) {
    await markOccurrenceAsPending(occurrenceId);
    setWriteModeMessage(null);
    clearSimulation();
  }

  function handleRequestDeleteContract(contractId: string) {
    setEditingTransaction(null);
    setPendingContractDeletionId(contractId);
  }

  async function handleConfirmDeleteContract() {
    if (!pendingContractDeletionId) {
      return;
    }

    try {
      await deleteTransactionUnified(pendingContractDeletionId);
      setWriteModeMessage(null);
      clearSimulation();
      setPendingContractDeletionId(null);
    } catch {
      // A mensagem de erro é tratada na página principal.
    }
  }

  function handleEditModalChange(open: boolean) {
    if (!open) {
      setEditingTransaction(null);
    }
  }

  function handleGoalModalChange(open: boolean) {
    if (!open) {
      setSelectedGoal(null);
    }
  }

  function handleGoToTransactionsSection() {
    setActiveView("transactions");
  }

  async function handleAddGoal(input: Parameters<typeof addGoal>[0]) {
    await createGoal(input);
    setWriteModeMessage(null);
  }

  function handleOpenGoalProgress(goal: Goal) {
    setSelectedGoal(goal);
  }

  async function handleSaveGoalProgress(input: { id: string; currentAmount: number }) {
    await updateGoalProgressUnified(input);
    setWriteModeMessage(null);
  }

  async function handleRemoveGoal(id: string) {
    try {
      await deleteGoalUnified(id);
      setWriteModeMessage(null);
    } catch {
      // A mensagem de erro e tratada na pagina principal.
    }
  }

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return (
      <PageContainer>
        <div className="flex min-h-[40vh] items-center justify-center rounded-[2rem] border border-border/70 bg-card/60">
          <p className="text-sm text-muted-foreground">Carregando dados...</p>
        </div>
      </PageContainer>
    );
  }

  if (!financeData.isLoaded || !goalsData.isLoaded) {
    return (
      <PageContainer>
        <div className="flex min-h-[40vh] items-center justify-center rounded-[2rem] border border-border/70 bg-card/60">
          <p className="text-sm text-muted-foreground">Carregando dados...</p>
        </div>
      </PageContainer>
    );
  }

  const homeView = (
    <DashboardHomeView
      onGoToTransactions={handleGoToTransactionsSection}
      onOpenCalendar={() => setIsCalendarModalOpen(true)}
      onOpenStatementProjection={() => setIsStatementProjectionModalOpen(true)}
    />
  );

  const transactionsView = (
    <DashboardTransactionsView
      transactionFilter={transactionFilter}
      onTransactionFilterChange={setTransactionFilter}
      searchTerm={searchTerm}
      onSearchTermChange={setSearchTerm}
      categoryFilter={categoryFilter}
      onCategoryFilterChange={setCategoryFilter}
      sortOption={sortOption}
      onSortOptionChange={setSortOption}
      filteredTransactions={filteredTransactions}
      statementTransactions={statementTransactions}
      hasActiveAdvancedFilters={hasActiveAdvancedFilters}
      onClearAdvancedFilters={handleClearAdvancedFilters}
      onAddTransaction={handleAddTransaction}
      onPreviewTransaction={handlePreviewTransaction}
      onClearPreview={handleClearPreview}
      isSubmitting={
        isCreatingTransaction ||
        isUpdatingInitialBalance ||
        isUpdatingTransaction ||
        isDeletingTransaction ||
        isCancellingOccurrence
      }
      isPreviewActive={isPreviewActive}
      onEditTransaction={handleOpenEditModal}
      onRemoveTransaction={handleRemoveTransaction}
      getNextRecurringOccurrence={getNextRecurringOccurrence}
      emptyStateTitle={emptyStateTitle}
      emptyStateDescription={emptyStateDescription}
      onOpenCalendar={() => setIsCalendarModalOpen(true)}
      onOpenStatementProjection={() => setIsStatementProjectionModalOpen(true)}
      initialBalance={initialBalance}
      totalIncome={totalIncome}
      totalExpense={totalExpense}
      currentBalance={currentBalance}
      forecastTotalIncome={forecast.totalIncome}
      forecastTotalExpense={forecast.totalExpense}
      forecastProjectedBalance={forecast.projectedBalance}
      onUpdateInitialBalance={handleUpdateInitialBalance}
      nextUpcomingMonthLabel={nextUpcomingMonthLabel}
    />
  );

  const goalsView = (
    <DashboardGoalsView
      isSubmitting={isCreatingGoal}
      areActionsDisabled={isCreatingGoal || isUpdatingGoalProgress || isDeletingGoal}
      goals={goals}
      totalGoalProgress={totalGoalProgress}
      remainingGoalAmount={remainingGoalAmount}
      currencyFormatter={currencyFormatter}
      onAddGoal={handleAddGoal}
      onUpdateProgress={handleOpenGoalProgress}
      onRemoveGoal={handleRemoveGoal}
    />
  );

  const insightsView = (
    <DashboardInsightsView
      insights={insights}
      forecastTotalIncome={forecast.totalIncome}
      forecastTotalExpense={forecast.totalExpense}
      forecastProjectedBalance={forecast.projectedBalance}
      accountAutomationView={
        isApiMode && financeData.selectedProfile ? (
          <FinancialRulesManager
            financialProfileId={financeData.selectedProfile.id}
            isLoading={isFinancialRulesLoading}
            isProcessing={isProcessingRules}
            isSubmitting={isSubmittingFinancialRule}
            errorMessage={financialRulesErrorMessage}
            processErrorMessage={processErrorMessage}
            processResult={processResult}
            rules={rules}
            onCreateRule={createRule}
            onDeleteRule={deleteRule}
            onProcessRules={processRules}
            onUpdateRule={updateRule}
          />
        ) : null
      }
    />
  );

  const isLandingHome = activeView === "home";

  return (
    <>
      <PageContainer variant={isLandingHome ? "landing" : "default"}>
        <div className={isLandingHome ? "space-y-6" : "space-y-8 2xl:space-y-10"}>
          <AppFloatingHeader
            activeView={activeView}
            onChangeView={setActiveView}
            isAccountCardOpen={isAccountCardOpen}
            onToggleAccountCard={() => setIsAccountCardOpen((prev) => !prev)}
            variant={isLandingHome ? "landing" : "default"}
          />

          {isAccountCardOpen ? (
            <section className="px-4">
              <div className="mx-auto max-w-6xl">
                <AccountAccessCard />
              </div>
            </section>
          ) : null}

          {writeModeMessage ? (
            <section
              className={
                isLandingHome
                  ? "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"
                  : "px-4"
              }
            >
              <div
                className={
                  isLandingHome
                    ? "flex max-w-6xl flex-wrap gap-3"
                    : "mx-auto max-w-6xl space-y-3"
                }
              >
                <div
                  className={
                    isLandingHome
                      ? "w-fit max-w-full rounded-full border border-white/80 bg-white/58 px-5 py-2.5 text-sm text-muted-foreground shadow-[0_14px_42px_-30px_rgba(3,21,51,0.32)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0b275e]/58"
                      : "rounded-2xl border border-border/70 bg-card/70 px-4 py-3 text-sm text-muted-foreground"
                  }
                >
                  {writeModeMessage}
                </div>
              </div>
            </section>
          ) : null}
          {/* TODO: remover gateways técnicos após concluir a migração total para os hooks unificados. */}

          <DashboardShell
            activeView={activeView}
            homeView={homeView}
            transactionsView={transactionsView}
            goalsView={goalsView}
            insightsView={insightsView}
          />
        </div>
      </PageContainer>

      {activeView !== "home" ? (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col-reverse items-end gap-3">
          <button
            type="button"
            onClick={() => setIsSpeedDialOpen((prev) => !prev)}
            aria-label={isSpeedDialOpen ? "Fechar menu" : "Novo lançamento"}
            className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95"
          >
            <Plus
              className={`size-6 transition-transform duration-200 ${isSpeedDialOpen ? "rotate-45" : ""}`}
            />
          </button>

          <div
            className={`flex flex-col-reverse items-end gap-3 transition-all duration-200 ${
              isSpeedDialOpen
                ? "pointer-events-auto translate-y-0 opacity-100"
                : "pointer-events-none translate-y-2 opacity-0"
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setIsSpeedDialOpen(false);
                setIsFabTransactionOpen(true);
              }}
              className="flex items-center gap-3"
            >
              <span className="rounded-2xl border border-border/70 bg-card px-3 py-1.5 text-sm font-medium text-foreground shadow">
                Nova transação
              </span>
              <span className="flex size-11 items-center justify-center rounded-full border border-border/70 bg-card text-foreground shadow">
                <ArrowUpDown className="size-4" />
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsSpeedDialOpen(false);
                setIsFabGoalOpen(true);
              }}
              className="flex items-center gap-3"
            >
              <span className="rounded-2xl border border-border/70 bg-card px-3 py-1.5 text-sm font-medium text-foreground shadow">
                Nova meta
              </span>
              <span className="flex size-11 items-center justify-center rounded-full border border-border/70 bg-card text-foreground shadow">
                <Target className="size-4" />
              </span>
            </button>
          </div>
        </div>
      ) : null}

      {isFabTransactionOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 backdrop-blur-sm sm:items-center sm:px-4 sm:py-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsFabTransactionOpen(false);
          }}
        >
          <div className="flex max-h-[min(100dvh-0.5rem,96vh)] w-full flex-col overflow-hidden rounded-t-[1.75rem] border border-border/70 bg-card shadow-2xl sm:max-w-xl sm:rounded-[1.75rem]">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4 sm:px-6">
              <p className="text-base font-semibold text-foreground">
                Nova transação
              </p>
              <button
                type="button"
                onClick={() => setIsFabTransactionOpen(false)}
                aria-label="Fechar"
                className="flex size-8 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-accent hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="overflow-y-auto p-5 sm:p-6">
              <TransactionForm
                onAddTransaction={async (input) => {
                  await handleAddTransaction(input);
                  setIsFabTransactionOpen(false);
                }}
                onPreviewTransaction={handlePreviewTransaction}
                onClearPreview={handleClearPreview}
                isPreviewActive={isPreviewActive}
                showPreviewNotice={false}
                isSubmitting={
                  isCreatingTransaction ||
                  isUpdatingInitialBalance ||
                  isUpdatingTransaction ||
                  isDeletingTransaction ||
                  isCancellingOccurrence
                }
              />
            </div>
          </div>
        </div>
      ) : null}

      {isFabGoalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 backdrop-blur-sm sm:items-center sm:px-4 sm:py-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsFabGoalOpen(false);
          }}
        >
          <div className="flex max-h-[min(100dvh-0.5rem,96vh)] w-full flex-col overflow-hidden rounded-t-[1.75rem] border border-border/70 bg-card shadow-2xl sm:max-w-xl sm:rounded-[1.75rem]">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4 sm:px-6">
              <p className="text-base font-semibold text-foreground">
                Nova meta
              </p>
              <button
                type="button"
                onClick={() => setIsFabGoalOpen(false)}
                aria-label="Fechar"
                className="flex size-8 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-accent hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="overflow-y-auto p-5 sm:p-6">
              <GoalForm
                onAddGoal={async (input) => {
                  await handleAddGoal(input);
                  setIsFabGoalOpen(false);
                }}
                isSubmitting={isCreatingGoal}
              />
            </div>
          </div>
        </div>
      ) : null}

      <TransactionEditModal
        key={editingTransaction?.id ?? "transaction-edit-modal"}
        transaction={editingTransaction}
        open={Boolean(editingTransaction)}
        onOpenChange={handleEditModalChange}
        isSubmitting={isUpdatingTransaction}
        onSave={handleUpdateTransaction}
        onSaveOccurrence={handleSaveOccurrence}
        onMarkOccurrencePaid={handleMarkOccurrencePaid}
        onMarkOccurrencePending={handleMarkOccurrencePending}
        isSubmittingOccurrence={
          isUpdatingOccurrence || isMarkingOccurrencePaid || isMarkingOccurrencePending
        }
        onRequestDeleteContract={handleRequestDeleteContract}
      />

      <GoalProgressModal
        key={selectedGoal?.id ?? "goal-progress-modal"}
        goal={selectedGoal}
        open={Boolean(selectedGoal)}
        onOpenChange={handleGoalModalChange}
        isSubmitting={isUpdatingGoalProgress}
        onSave={handleSaveGoalProgress}
      />

      <ConfirmationModal
        open={Boolean(pendingRemovalTransactionId)}
        title="Cancelar ocorrência"
        description="Tem certeza que deseja cancelar esta ocorrência? Essa ação não pode ser desfeita."
        cancelLabel="Cancelar"
        confirmLabel="Cancelar ocorrência"
        onConfirm={handleConfirmRemoveTransaction}
        onOpenChange={(open) => {
          if (!open) {
            setPendingRemovalTransactionId(null);
          }
        }}
      />

      <ConfirmationModal
        open={Boolean(pendingContractDeletionId)}
        title="Excluir toda a série"
        description="Isso remove o lançamento inteiro e todas as suas parcelas ou competências, incluindo as já pagas. Essa ação não pode ser desfeita."
        cancelLabel="Cancelar"
        confirmLabel="Excluir toda a série"
        onConfirm={handleConfirmDeleteContract}
        onOpenChange={(open) => {
          if (!open) {
            setPendingContractDeletionId(null);
          }
        }}
      />

      <FinancialCalendarModal
        open={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        transactions={projectionTransactions}
        currentBalance={currentBalance}
        onEditTransaction={(transaction) => {
          setIsCalendarModalOpen(false);
          handleOpenEditModal(transaction);
        }}
      />

      <StatementProjectionModal
        open={isStatementProjectionModalOpen}
        onClose={() => setIsStatementProjectionModalOpen(false)}
        transactionFilter={transactionFilter}
        onTransactionFilterChange={setTransactionFilter}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        sortOption={sortOption}
        onSortOptionChange={setSortOption}
        filteredTransactions={filteredTransactions}
        statementTransactions={statementTransactions}
        hasActiveAdvancedFilters={hasActiveAdvancedFilters}
        onClearAdvancedFilters={handleClearAdvancedFilters}
        onEditTransaction={handleOpenEditModal}
        onRemoveTransaction={handleRemoveTransaction}
        getNextRecurringOccurrence={getNextRecurringOccurrence}
        emptyStateTitle={emptyStateTitle}
        emptyStateDescription={emptyStateDescription}
        forecastTotalIncome={forecast.totalIncome}
        forecastTotalExpense={forecast.totalExpense}
        forecastProjectedBalance={forecast.projectedBalance}
      />
    </>
  );
}
