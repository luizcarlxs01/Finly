"use client";

import { useMemo, useState } from "react";
import { DashboardEntryHeader } from "@/components/dashboard/dashboard-entry-header";
import { DashboardInsights } from "@/components/dashboard/dashboard-insights";
import { FinanceSummaryCard } from "@/components/dashboard/finance-summary-card";
import { FinancialForecastCard } from "@/components/dashboard/financial-forecast-card";
import { GoalForm } from "@/components/dashboard/goal-form";
import { GoalList } from "@/components/dashboard/goal-list";
import { GoalProgressModal } from "@/components/dashboard/goal-progress-modal";
import { UpcomingTransactions } from "@/components/dashboard/upcoming-transactions";
import {
  TransactionAdvancedFilters,
  type TransactionSortOption,
} from "@/components/dashboard/transaction-advanced-filters";
import { TransactionEditModal } from "@/components/dashboard/transaction-edit-modal";
import { TransactionFilterTabs } from "@/components/dashboard/transaction-filter-tabs";
import { TransactionForm } from "@/components/dashboard/transaction-form";
import { TransactionList } from "@/components/dashboard/transaction-list";
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

  const upcomingTransactions = useMemo(() => {
    return getUpcomingTransactionsByMonth({
      transactions: projectionTransactions,
      monthsAhead: 3,
      referenceDate: new Date(),
    });
  }, [projectionTransactions]);

  const forecast = useMemo(() => {
    const nextMonthGroup = upcomingTransactions[0];

    return {
      totalIncome: nextMonthGroup?.totalIncome ?? 0,
      totalExpense: nextMonthGroup?.totalExpense ?? 0,
      projectedBalance: currentBalance + (nextMonthGroup?.projectedBalance ?? 0),
    };
  }, [currentBalance, upcomingTransactions]);

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
        <div className="space-y-10 2xl:space-y-12">
          <DashboardEntryHeader />

          <section id="resumo-financeiro" className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Área operacional
              </p>
              <div className="space-y-2">
                <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  Seu panorama financeiro em uma leitura mais clara
                </h2>
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Veja seu saldo atual, acompanhe o que vem pela frente e gerencie
                  seu extrato sem misturar previsão com histórico.
                </p>
              </div>
            </div>

            <FinanceSummaryCard
              initialBalance={initialBalance}
              totalIncome={totalIncome}
              totalExpense={totalExpense}
              currentBalance={currentBalance}
            />
          </section>

          <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="min-w-0">
              <DashboardInsights insights={insights} />
            </div>

            <div className="min-w-0">
              <FinancialForecastCard
                totalIncome={forecast.totalIncome}
                totalExpense={forecast.totalExpense}
                projectedBalance={forecast.projectedBalance}
              />
            </div>
          </section>

          <section className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Agenda financeira
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Acompanhe um mês por vez, com mais foco
              </h2>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                Navegue pelos próximos meses para entender parcelas, recorrências
                e saldo previsto sem precisar percorrer uma tela extensa.
              </p>
            </div>

            <UpcomingTransactions monthGroups={upcomingTransactions} />
          </section>

          <section className="grid gap-6 2xl:grid-cols-[minmax(320px,360px)_minmax(0,1fr)] 2xl:items-start">
            <aside id="nova-transacao" className="min-w-0 2xl:sticky 2xl:top-6">
              <TransactionForm
                initialBalance={initialBalance}
                onUpdateInitialBalance={handleUpdateInitialBalance}
                onAddTransaction={handleAddTransaction}
                onPreviewTransaction={handlePreviewTransaction}
                onClearPreview={handleClearPreview}
                isPreviewActive={previewTransactions !== null}
              />
            </aside>

            <div className="min-w-0 rounded-[2rem] border border-border/70 bg-card/70 p-5 shadow-sm sm:p-6 lg:p-7">
              <div className="space-y-6 border-b border-border/60 pb-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                  <div className="min-w-0 space-y-2">
                    <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      Extrato
                    </p>
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                      Histórico de transações
                    </h2>
                    <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                      Consulte o que já aconteceu, filtre com rapidez e mantenha a
                      leitura do seu histórico separada da agenda futura.
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

                <div className="grid gap-3 xl:grid-cols-3">
                  <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Papel do extrato
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      Mostrar o histórico real das suas movimentações
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Leitura
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      Filtre por tipo, categoria, texto e ordenação
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Separação
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      A agenda mostra previsão; o extrato mostra histórico
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-5">
                <div className="rounded-[1.5rem] border border-border/70 bg-background/50 p-4 sm:p-5">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Controles do extrato
                      </p>
                      <h3 className="text-lg font-semibold text-foreground">
                        Refine sua visualização antes de analisar a lista
                      </h3>
                    </div>

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
                      totalCount={statementTransactions.length}
                      hasActiveFilters={
                        transactionFilter !== "all" || hasActiveAdvancedFilters
                      }
                      onClearFilters={handleClearAdvancedFilters}
                    />
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-border/70 bg-background/35 p-3 sm:p-4">
                  <TransactionList
                    transactions={filteredTransactions}
                    onEditTransaction={handleOpenEditModal}
                    onRemoveTransaction={handleRemoveTransaction}
                    getNextRecurringOccurrence={getNextRecurringOccurrence}
                    emptyStateTitle={emptyStateTitle}
                    emptyStateDescription={emptyStateDescription}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-border/70 bg-card/70 p-5 shadow-sm sm:p-6 lg:p-7">
            <div className="space-y-6">
              <div className="flex flex-col gap-5 border-b border-border/60 pb-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Metas
                  </p>
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    Planejamento financeiro local
                  </h2>
                  <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                    Cadastre objetivos, acompanhe o progresso manualmente e visualize
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

              <div className="grid gap-6 2xl:grid-cols-[minmax(320px,360px)_minmax(0,1fr)] 2xl:items-start">
                <aside className="min-w-0 2xl:sticky 2xl:top-6">
                  <GoalForm onAddGoal={addGoal} />
                </aside>

                <div className="min-w-0 space-y-5">
                  <GoalList
                    goals={goals}
                    onUpdateProgress={setSelectedGoal}
                    onRemoveGoal={removeGoal}
                  />
                </div>
              </div>
            </div>
          </section>
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
