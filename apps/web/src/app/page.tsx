"use client";

import { useMemo, useState } from "react";
import {
  AppFloatingHeader,
  type DashboardView,
} from "@/components/layout/app-floating-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardHomeView } from "@/components/dashboard/views/dashboard-home-view";
import { DashboardTransactionsView } from "@/components/dashboard/views/dashboard-transactions-view";
import { DashboardGoalsView } from "@/components/dashboard/views/dashboard-goals-view";
import { DashboardInsightsView } from "@/components/dashboard/views/dashboard-insights-view";
import { GoalProgressModal } from "@/components/dashboard/goal-progress-modal";
import { TransactionEditModal } from "@/components/dashboard/transaction-edit-modal";
import { PageContainer } from "@/components/layout/page-container";
import {
  type LocalFinanceTransactionInput,
  useLocalFinance,
} from "@/hooks/use-local-finance";
import { useLocalGoals } from "@/hooks/use-local-goals";
import type { Transaction, TransactionFilter } from "@/types/finance";
import type { Goal } from "@/types/goal";
import { getTransactionCategoryLabel } from "@/types/transaction-category";
import { getDashboardInsights } from "@/utils/dashboard-insights";
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

function buildStatementTransactions(
  transactions: Transaction[],
  postedTransactions: Transaction[],
) {
  const futureEditableTemplates = transactions.filter((transaction) => {
    if (transaction.transactionKind === "installment-template") {
      return isDateFuture(transaction.installmentStartDate);
    }

    if (transaction.transactionKind === "recurring-template") {
      return isDateFuture(transaction.recurrenceStartDate);
    }

    return false;
  });

  const merged = [...postedTransactions, ...futureEditableTemplates];
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
  const {
    initialBalance,
    currentBalance,
    totalIncome,
    totalExpense,
    transactions,
    postedTransactions,
    getNextRecurringOccurrence,
    updateInitialBalance,
    addTransaction,
    updateTransaction,
    removeTransaction,
    createPreviewProfile,
    isLoaded: isFinanceLoaded,
  } = useLocalFinance();

  const {
    goals,
    isLoaded: isGoalsLoaded,
    totalGoalTarget,
    totalGoalProgress,
    addGoal,
    updateGoalProgress,
    removeGoal,
  } = useLocalGoals();

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
  const [previewTransactions, setPreviewTransactions] =
    useState<Transaction[] | null>(null);

  const statementTransactions = useMemo(() => {
    return buildStatementTransactions(transactions, postedTransactions);
  }, [transactions, postedTransactions]);

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

  const remainingGoalAmount = Math.max(totalGoalTarget - totalGoalProgress, 0);

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
    const previewProfile = createPreviewProfile(input);
    setPreviewTransactions(previewProfile?.transactions ?? null);
  }

  function handleClearPreview() {
    setPreviewTransactions(null);
  }

  function handleUpdateInitialBalance(value: number) {
    updateInitialBalance(value);
    setPreviewTransactions(null);
  }

  function handleAddTransaction(input: LocalFinanceTransactionInput) {
    addTransaction(input);
    setPreviewTransactions(null);
  }

  function handleUpdateTransaction(input: Parameters<typeof updateTransaction>[0]) {
    updateTransaction(input);
    setPreviewTransactions(null);
  }

  function handleRemoveTransaction(id: string) {
    if (!window.confirm("Tem certeza que deseja remover este lançamento?")) {
      return;
    }

    removeTransaction(id);
    setPreviewTransactions(null);
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

  if (!isFinanceLoaded || !isGoalsLoaded) {
    return (
      <PageContainer>
        <div className="flex min-h-[40vh] items-center justify-center rounded-[2rem] border border-border/70 bg-card/60">
          <p className="text-sm text-muted-foreground">Carregando dados...</p>
        </div>
      </PageContainer>
    );
  }

  const homeView = (
    <DashboardHomeView onGoToTransactions={handleGoToTransactionsSection} />
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
      isPreviewActive={previewTransactions !== null}
      onEditTransaction={handleOpenEditModal}
      onRemoveTransaction={handleRemoveTransaction}
      getNextRecurringOccurrence={getNextRecurringOccurrence}
      emptyStateTitle={emptyStateTitle}
      emptyStateDescription={emptyStateDescription}
      forecastTotalIncome={forecast.totalIncome}
      forecastTotalExpense={forecast.totalExpense}
      forecastProjectedBalance={forecast.projectedBalance}
      upcomingMonthGroups={upcomingTransactions}
    />
  );

  const goalsView = (
    <DashboardGoalsView
      goals={goals}
      totalGoalProgress={totalGoalProgress}
      remainingGoalAmount={remainingGoalAmount}
      currencyFormatter={currencyFormatter}
      onAddGoal={addGoal}
      onUpdateProgress={setSelectedGoal}
      onRemoveGoal={removeGoal}
    />
  );

  const insightsView = (
    <DashboardInsightsView
      insights={insights}
      forecastTotalIncome={forecast.totalIncome}
      forecastTotalExpense={forecast.totalExpense}
      forecastProjectedBalance={forecast.projectedBalance}
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
        onSave={handleUpdateTransaction}
      />

      <GoalProgressModal
        key={selectedGoal?.id ?? "goal-progress-modal"}
        goal={selectedGoal}
        open={Boolean(selectedGoal)}
        onOpenChange={handleGoalModalChange}
        onSave={updateGoalProgress}
      />
    </>
  );
}
