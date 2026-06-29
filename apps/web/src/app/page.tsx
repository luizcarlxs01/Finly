"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AppFloatingHeader,
  type DashboardView,
} from "@/components/layout/app-floating-header";
import { AccountAccessCard } from "@/components/auth/account-access-card";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardHomeView } from "@/components/dashboard/views/dashboard-home-view";
import { DashboardTransactionsView } from "@/components/dashboard/views/dashboard-transactions-view";
import { DashboardGoalsView } from "@/components/dashboard/views/dashboard-goals-view";
import { DashboardInsightsView } from "@/components/dashboard/views/dashboard-insights-view";
import { FinancialRulesManager } from "@/components/dashboard/financial-rules-manager";
import { useFinanceSource } from "@/contexts/finance-source-context";
import { useCreateTransaction } from "@/hooks/use-create-transaction";
import { useCreateGoal } from "@/hooks/use-create-goal";
import { useDeleteGoal } from "@/hooks/use-delete-goal";
import { useDeleteTransaction } from "@/hooks/use-delete-transaction";
import { useFinanceData } from "@/hooks/use-finance-data";
import { useFinancialRulesData } from "@/hooks/use-financial-rules-data";
import { useGoalsData } from "@/hooks/use-goals-data";
import { useImpactSimulation } from "@/hooks/use-impact-simulation";
import { useUpdateGoalProgress } from "@/hooks/use-update-goal-progress";
import { useUpdateTransaction } from "@/hooks/use-update-transaction";
import { useUpdateInitialBalance } from "@/hooks/use-update-initial-balance";
import { GoalProgressModal } from "@/components/dashboard/goal-progress-modal";
import { ScheduleModal } from "@/components/dashboard/overlays/schedule-modal";
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
import { getUpcomingTransactionsByMonth } from "@/utils/upcoming-transactions";
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

function isDateFuture(dateValue?: string | null) {
  if (!dateValue) {
    return false;
  }

  const today = new Date();
  const todayValue = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const [year, month, day] = dateValue.split("-").map(Number);
  const targetDate = new Date(year, month - 1, day);

  return targetDate.getTime() > todayValue.getTime();
}

function getTransactionDisplayDateValue(transaction: Transaction) {
  if (transaction.transactionKind === "installment-template") {
    return transaction.installmentStartDate;
  }

  if (transaction.transactionKind === "recurring-template") {
    return transaction.recurrenceStartDate;
  }

  return (
    transaction.occurrenceDate ??
    transaction.recurringOccurrenceDate ??
    transaction.createdAt
  );
}

function buildStatementTransactions(
  transactions: Transaction[],
  postedTransactions: Transaction[],
) {
  const futureTransactions = transactions.filter((transaction) => {
    if (transaction.transactionKind === "installment-template") {
      return false;
    }

    if (transaction.transactionKind === "recurring-template") {
      return false;
    }

    return isDateFuture(getTransactionDisplayDateValue(transaction));
  });

  const futureEditableTemplates = transactions.filter((transaction) => {
    if (transaction.transactionKind === "installment-template") {
      return isDateFuture(transaction.installmentStartDate);
    }

    if (transaction.transactionKind === "recurring-template") {
      return isDateFuture(transaction.recurrenceStartDate);
    }

    return false;
  });

  const merged = [
    ...postedTransactions,
    ...futureTransactions,
    ...futureEditableTemplates,
  ];
  const uniqueById = new Map<string, Transaction>();

  for (const transaction of merged) {
    uniqueById.set(transaction.id, transaction);
  }

  return Array.from(uniqueById.values());
}

function getPostedTransactions(transactions: Transaction[]) {
  return transactions.filter(
    (transaction) =>
      transaction.transactionKind !== "recurring-template" &&
      transaction.transactionKind !== "installment-template",
  );
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
    createPreviewProfile,
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
  const [writeModeMessage, setWriteModeMessage] = useState<string | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isStatementProjectionModalOpen, setIsStatementProjectionModalOpen] = useState(false);

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
    createLocalPreviewProfile: createPreviewProfile,
    source,
    transactions,
  });

  const statementTransactions = useMemo(() => {
    if (isApiMode) {
      return transactions;
    }

    return buildStatementTransactions(transactions, postedTransactions);
  }, [isApiMode, transactions, postedTransactions]);

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
    isApiMode,
    postedTransactions,
    previewTransactions,
    totalExpense,
    totalIncome,
  ]);

  const upcomingTransactions = useMemo(() => {
    return getUpcomingTransactionsByMonth({
      transactions: projectionTransactions,
      monthsAhead: 3,
      referenceDate: new Date(),
      baseBalance: projectionSnapshot.currentBalance,
    });
  }, [projectionSnapshot.currentBalance, projectionTransactions]);

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
    if (!isApiMode) {
      return;
    }

    clearSimulation();
    setEditingTransaction(null);
    setSelectedGoal(null);
    setPendingRemovalTransactionId(null);
  }, [clearSimulation, isApiMode]);

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
      await deleteTransactionUnified(pendingRemovalTransactionId);
      setWriteModeMessage(null);
      clearSimulation();
      setPendingRemovalTransactionId(null);
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
      onOpenSchedule={() => setIsScheduleModalOpen(true)}
      onOpenStatementProjection={() => setIsStatementProjectionModalOpen(true)}
    />
  );

  const transactionsView = (
    <DashboardTransactionsView
      initialBalance={initialBalance}
      totalIncome={totalIncome}
      totalExpense={totalExpense}
      currentBalance={currentBalance}
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
      onUpdateInitialBalance={handleUpdateInitialBalance}
      onAddTransaction={handleAddTransaction}
      onPreviewTransaction={handlePreviewTransaction}
      onClearPreview={handleClearPreview}
      isSubmitting={
        isCreatingTransaction ||
        isUpdatingInitialBalance ||
        isUpdatingTransaction ||
        isDeletingTransaction
      }
      isPreviewActive={isPreviewActive}
      onEditTransaction={handleOpenEditModal}
      onRemoveTransaction={handleRemoveTransaction}
      getNextRecurringOccurrence={getNextRecurringOccurrence}
      emptyStateTitle={emptyStateTitle}
      emptyStateDescription={emptyStateDescription}
      forecastTotalIncome={forecast.totalIncome}
      forecastTotalExpense={forecast.totalExpense}
      forecastProjectedBalance={forecast.projectedBalance}
      upcomingMonthGroups={upcomingTransactions}
      onOpenSchedule={() => setIsScheduleModalOpen(true)}
      onOpenStatementProjection={() => setIsStatementProjectionModalOpen(true)}
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

  return (
    <>
      <PageContainer>
        <div className="space-y-8 2xl:space-y-10">
          <AppFloatingHeader
            activeView={activeView}
            onChangeView={setActiveView}
          />

          <section className="px-4">
            <div className="mx-auto max-w-6xl">
              <AccountAccessCard />
            </div>
          </section>

          <section className="px-4">
            <div className="mx-auto max-w-6xl space-y-3">
              <div className="rounded-2xl border border-border/70 bg-card/70 px-4 py-3 text-sm text-muted-foreground">
                {isApiMode
                  ? "Modo com conta — dados sincronizados com sua conta"
                  : "Modo sem conta — dados salvos neste navegador"}
              </div>

              {writeModeMessage ? (
                <div className="rounded-2xl border border-border/70 bg-card/70 px-4 py-3 text-sm text-muted-foreground">
                  {writeModeMessage}
                </div>
              ) : null}
            </div>
          </section>
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

      <TransactionEditModal
        key={editingTransaction?.id ?? "transaction-edit-modal"}
        transaction={editingTransaction}
        open={Boolean(editingTransaction)}
        onOpenChange={handleEditModalChange}
        isSubmitting={isUpdatingTransaction}
        onSave={handleUpdateTransaction}
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
        title="Remover item"
        description="Tem certeza que deseja remover este item? Essa ação não pode ser desfeita."
        cancelLabel="Cancelar"
        confirmLabel="Remover"
        onConfirm={handleConfirmRemoveTransaction}
        onOpenChange={(open) => {
          if (!open) {
            setPendingRemovalTransactionId(null);
          }
        }}
      />

      <ScheduleModal
        open={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        monthGroups={upcomingTransactions}
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
