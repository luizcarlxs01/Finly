"use client";

import { useState } from "react";
import { CalendarDays, FileText } from "lucide-react";

import { FinanceSummaryCard } from "@/components/dashboard/finance-summary-card";
import { ScheduleModal } from "@/components/dashboard/overlays/schedule-modal";
import { StatementProjectionModal } from "@/components/dashboard/overlays/statement-projection-modal";
import { TransactionAdvancedFilters } from "@/components/dashboard/transaction-advanced-filters";
import { TransactionFilterTabs } from "@/components/dashboard/transaction-filter-tabs";
import { TransactionForm } from "@/components/dashboard/transaction-form";
import { TransactionList } from "@/components/dashboard/transaction-list";
import { Button } from "@/components/ui/button";
import type { TransactionSortOption } from "@/components/dashboard/transaction-advanced-filters";
import type { LocalFinanceTransactionInput } from "@/hooks/use-local-finance";
import type { Transaction, TransactionFilter } from "@/types/finance";
import type { UpcomingTransactionsMonthGroup } from "@/utils/upcoming-transactions";

type DashboardTransactionsViewProps = {
  isSubmitting?: boolean;
  initialBalance: number;
  totalIncome: number;
  totalExpense: number;
  currentBalance: number;
  transactionFilter: TransactionFilter;
  onTransactionFilterChange: (filter: TransactionFilter) => void;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  sortOption: TransactionSortOption;
  onSortOptionChange: (value: TransactionSortOption) => void;
  filteredTransactions: Transaction[];
  statementTransactions: Transaction[];
  hasActiveAdvancedFilters: boolean;
  onClearAdvancedFilters: () => void;
  onUpdateInitialBalance: (value: number) => void;
  onAddTransaction: (input: LocalFinanceTransactionInput) => void;
  onPreviewTransaction: (input: LocalFinanceTransactionInput) => void;
  onClearPreview: () => void;
  isPreviewActive: boolean;
  onEditTransaction: (transaction: Transaction) => void;
  onRemoveTransaction: (id: string) => void;
  getNextRecurringOccurrence: (transaction: Transaction) => string | null;
  emptyStateTitle: string;
  emptyStateDescription: string;
  forecastTotalIncome: number;
  forecastTotalExpense: number;
  forecastProjectedBalance: number;
  upcomingMonthGroups: UpcomingTransactionsMonthGroup[];
};

const WHATSAPP_SUPPORT_NUMBER = "5519999999999";

export function DashboardTransactionsView({
  isSubmitting = false,
  initialBalance,
  totalIncome,
  totalExpense,
  currentBalance,
  transactionFilter,
  onTransactionFilterChange,
  searchTerm,
  onSearchTermChange,
  categoryFilter,
  onCategoryFilterChange,
  sortOption,
  onSortOptionChange,
  filteredTransactions,
  statementTransactions,
  hasActiveAdvancedFilters,
  onClearAdvancedFilters,
  onUpdateInitialBalance,
  onAddTransaction,
  onPreviewTransaction,
  onClearPreview,
  isPreviewActive,
  onEditTransaction,
  onRemoveTransaction,
  getNextRecurringOccurrence,
  emptyStateTitle,
  emptyStateDescription,
  forecastTotalIncome,
  forecastTotalExpense,
  forecastProjectedBalance,
  upcomingMonthGroups,
}: DashboardTransactionsViewProps) {
  const [isStatementProjectionModalOpen, setIsStatementProjectionModalOpen] =
    useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const nextUpcomingMonth = upcomingMonthGroups[0];

  return (
    <>
      <div className="space-y-8 2xl:space-y-10">
        <section className="rounded-[2rem] border border-border/70 bg-card/95 p-6 shadow-sm sm:p-7">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Lançamentos
            </h1>
            <p className="text-sm text-muted-foreground">
              Cadastre e acompanhe suas movimentações.
            </p>
          </div>
        </section>

        <section id="nova-transacao">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)] xl:items-start">
            <div className="min-w-0 space-y-6">
              <TransactionForm
                onAddTransaction={onAddTransaction}
                onPreviewTransaction={onPreviewTransaction}
                onClearPreview={onClearPreview}
                isPreviewActive={isPreviewActive}
                showPreviewNotice={false}
                isSubmitting={isSubmitting}
              />

              <section className="space-y-4">
                <div className="rounded-[1.75rem] border border-border/70 bg-card/95 p-5 shadow-sm sm:p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold tracking-tight text-foreground">
                        Lista de lançamentos
                      </h3>
                    </div>

                    <TransactionFilterTabs
                      value={transactionFilter}
                      onChange={onTransactionFilterChange}
                    />

                    <TransactionAdvancedFilters
                      searchValue={searchTerm}
                      onSearchChange={onSearchTermChange}
                      categoryValue={categoryFilter}
                      onCategoryChange={onCategoryFilterChange}
                      sortValue={sortOption}
                      onSortChange={onSortOptionChange}
                      resultCount={filteredTransactions.length}
                      totalCount={statementTransactions.length}
                      hasActiveFilters={
                        transactionFilter !== "all" || hasActiveAdvancedFilters
                      }
                      onClearFilters={onClearAdvancedFilters}
                    />
                  </div>
                </div>

                <TransactionList
                  transactions={filteredTransactions}
                  onEditTransaction={onEditTransaction}
                  onRemoveTransaction={onRemoveTransaction}
                  getNextRecurringOccurrence={getNextRecurringOccurrence}
                  emptyStateTitle={emptyStateTitle}
                  emptyStateDescription={emptyStateDescription}
                />
              </section>
            </div>

            <aside className="min-w-0 space-y-4 xl:sticky xl:top-6">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <Button
                  type="button"
                  className="h-11 justify-start rounded-2xl"
                  onClick={() => setIsScheduleModalOpen(true)}
                >
                  <CalendarDays className="size-4" />
                  Agenda
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="h-11 justify-start rounded-2xl"
                  onClick={() => setIsStatementProjectionModalOpen(true)}
                >
                  <FileText className="size-4" />
                  Extrato
                </Button>
              </div>

              <FinanceSummaryCard
                initialBalance={initialBalance}
                totalIncome={totalIncome}
                totalExpense={totalExpense}
                currentBalance={currentBalance}
                forecastTotalIncome={forecastTotalIncome}
                forecastTotalExpense={forecastTotalExpense}
                forecastProjectedBalance={forecastProjectedBalance}
                isPreviewActive={isPreviewActive}
                onClearPreview={onClearPreview}
                onUpdateInitialBalance={onUpdateInitialBalance}
                nextUpcomingMonthLabel={nextUpcomingMonth?.monthLabel}
              />

              <a
                href={`https://wa.me/${WHATSAPP_SUPPORT_NUMBER}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-dashed border-border/70 bg-background/60 px-4 text-sm font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
              >
                🐞 Reportar problema
              </a>
            </aside>
          </div>
        </section>
      </div>

      <StatementProjectionModal
        open={isStatementProjectionModalOpen}
        onClose={() => setIsStatementProjectionModalOpen(false)}
        transactionFilter={transactionFilter}
        onTransactionFilterChange={onTransactionFilterChange}
        searchTerm={searchTerm}
        onSearchTermChange={onSearchTermChange}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={onCategoryFilterChange}
        sortOption={sortOption}
        onSortOptionChange={onSortOptionChange}
        filteredTransactions={filteredTransactions}
        statementTransactions={statementTransactions}
        hasActiveAdvancedFilters={hasActiveAdvancedFilters}
        onClearAdvancedFilters={onClearAdvancedFilters}
        onEditTransaction={onEditTransaction}
        onRemoveTransaction={onRemoveTransaction}
        getNextRecurringOccurrence={getNextRecurringOccurrence}
        emptyStateTitle={emptyStateTitle}
        emptyStateDescription={emptyStateDescription}
        forecastTotalIncome={forecastTotalIncome}
        forecastTotalExpense={forecastTotalExpense}
        forecastProjectedBalance={forecastProjectedBalance}
      />

      <ScheduleModal
        open={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        monthGroups={upcomingMonthGroups}
      />
    </>
  );
}
