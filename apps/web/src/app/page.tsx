"use client";

import { useMemo, useState } from "react";
import { DashboardInsights } from "@/components/dashboard/dashboard-insights";
import { FinanceSummaryCard } from "@/components/dashboard/finance-summary-card";
import { GoalForm } from "@/components/dashboard/goal-form";
import { GoalList } from "@/components/dashboard/goal-list";
import { GoalProgressModal } from "@/components/dashboard/goal-progress-modal";
import { HeroSection } from "@/components/dashboard/hero-section";
import { OnboardingCard } from "@/components/dashboard/onboarding-card";
import { OnboardingFeatures } from "@/components/dashboard/onboarding-features";
import { OnboardingFuture } from "@/components/dashboard/onboarding-future";
import {
  TransactionAdvancedFilters,
  type TransactionSortOption,
} from "@/components/dashboard/transaction-advanced-filters";
import { TransactionEditModal } from "@/components/dashboard/transaction-edit-modal";
import { TransactionFilterTabs } from "@/components/dashboard/transaction-filter-tabs";
import { TransactionForm } from "@/components/dashboard/transaction-form";
import { TransactionList } from "@/components/dashboard/transaction-list";
import { PageContainer } from "@/components/layout/page-container";
import { useLocalFinance } from "@/hooks/use-local-finance";
import { useLocalGoals } from "@/hooks/use-local-goals";
import type { Transaction, TransactionFilter } from "@/types/finance";
import type { Goal } from "@/types/goal";
import { getTransactionCategoryLabel } from "@/types/transaction-category";
import { getDashboardInsights } from "@/utils/dashboard-insights";

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
    updateInitialBalance,
    addTransaction,
    updateTransaction,
    removeTransaction,
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

  const [transactionFilter, setTransactionFilter] =
    useState<TransactionFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(DEFAULT_CATEGORY_FILTER);
  const [sortOption, setSortOption] =
    useState<TransactionSortOption>(DEFAULT_SORT_OPTION);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  const filteredTransactions = useMemo(() => {
    const normalizedSearchTerm = normalizeSearchValue(searchTerm);

    const filteredItems = transactions.filter((transaction) => {
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
  }, [transactions, transactionFilter, categoryFilter, searchTerm, sortOption]);

  const insights = useMemo(
    () =>
      getDashboardInsights({
        transactions,
        goals,
        totalIncome,
        totalExpense,
        currentBalance,
      }),
    [transactions, goals, totalIncome, totalExpense, currentBalance],
  );

  const hasActiveAdvancedFilters =
    searchTerm.trim().length > 0 ||
    categoryFilter !== DEFAULT_CATEGORY_FILTER ||
    sortOption !== DEFAULT_SORT_OPTION;

  const hasAnyTransaction = transactions.length > 0;
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

  if (!isFinanceLoaded || !isGoalsLoaded) {
    return (
      <PageContainer>
        <div className="flex min-h-[40vh] items-center justify-center rounded-[2rem] border border-border/70 bg-card/60">
          <p className="text-sm text-muted-foreground">Carregando dados...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <>
      <PageContainer>
        <div className="space-y-8 lg:space-y-10">
          <HeroSection />

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_380px]">
            <div className="space-y-6">
              <OnboardingCard />
              <OnboardingFeatures />
            </div>

            <div className="xl:sticky xl:top-6 xl:self-start">
              <OnboardingFuture />
            </div>
          </section>

          <section id="resumo-financeiro">
            <FinanceSummaryCard
              initialBalance={initialBalance}
              totalIncome={totalIncome}
              totalExpense={totalExpense}
              currentBalance={currentBalance}
            />
          </section>

          <DashboardInsights insights={insights} />

          <section className="space-y-6 rounded-[2rem] border border-border/70 bg-card/70 p-5 shadow-sm sm:p-6 lg:p-7">
            <div className="flex flex-col gap-5 border-b border-border/60 pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Metas
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  Planejamento financeiro local
                </h2>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Cadastre objetivos, acompanhe progresso manual e visualize o
                  quanto ainda falta para concluir cada meta.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Metas ativas
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">
                    {goals.length}
                  </p>
                </div>

                <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Acumulado
                  </p>
                  <p className="mt-1 text-xl font-semibold text-foreground">
                    {currencyFormatter.format(totalGoalProgress)}
                  </p>
                </div>

                <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Restante
                  </p>
                  <p className="mt-1 text-xl font-semibold text-foreground">
                    {currencyFormatter.format(remainingGoalAmount)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)] xl:items-start">
              <aside className="xl:sticky xl:top-6">
                <GoalForm onAddGoal={addGoal} />
              </aside>

              <div className="space-y-5">
                <GoalList
                  goals={goals}
                  onUpdateProgress={setSelectedGoal}
                  onRemoveGoal={removeGoal}
                />
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)] xl:items-start">
            <aside id="nova-transacao" className="xl:sticky xl:top-6">
              <TransactionForm
                initialBalance={initialBalance}
                onUpdateInitialBalance={updateInitialBalance}
                onAddTransaction={addTransaction}
              />
            </aside>

            <div className="rounded-[2rem] border border-border/70 bg-card/70 p-5 shadow-sm sm:p-6 lg:p-7">
              <div className="flex flex-col gap-5 border-b border-border/60 pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Extrato
                  </p>
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    Histórico de transações
                  </h2>
                  <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                    Visualize suas movimentações com mais clareza, mantendo foco
                    em leitura rápida, contexto e organização.
                  </p>
                </div>

                <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Itens exibidos
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">
                    {filteredTransactions.length}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-5">
                <TransactionFilterTabs
                  value={transactionFilter}
                  onChange={setTransactionFilter}
                />

                <TransactionAdvancedFilters
                  searchValue={searchTerm}
                  onSearchChange={setSearchTerm}
                  categoryValue={categoryFilter}
                  onCategoryChange={setCategoryFilter}
                  sortValue={sortOption}
                  onSortChange={setSortOption}
                  resultCount={filteredTransactions.length}
                  totalCount={transactions.length}
                  hasActiveFilters={
                    transactionFilter !== "all" || hasActiveAdvancedFilters
                  }
                  onClearFilters={handleClearAdvancedFilters}
                />

                <TransactionList
                  transactions={filteredTransactions}
                  onEditTransaction={handleOpenEditModal}
                  onRemoveTransaction={removeTransaction}
                  emptyStateTitle={emptyStateTitle}
                  emptyStateDescription={emptyStateDescription}
                />
              </div>
            </div>
          </section>
        </div>
      </PageContainer>

      <TransactionEditModal
        transaction={editingTransaction}
        open={Boolean(editingTransaction)}
        onOpenChange={handleEditModalChange}
        onSave={updateTransaction}
      />

      <GoalProgressModal
        goal={selectedGoal}
        open={Boolean(selectedGoal)}
        onOpenChange={handleGoalModalChange}
        onSave={updateGoalProgress}
      />
    </>
  );
}
