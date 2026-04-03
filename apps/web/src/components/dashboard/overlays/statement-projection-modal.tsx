"use client";

import { useState } from "react";
import { BarChart3, ReceiptText, X } from "lucide-react";

import { FinancialForecastCard } from "@/components/dashboard/financial-forecast-card";
import {
  TransactionAdvancedFilters,
  type TransactionSortOption,
} from "@/components/dashboard/transaction-advanced-filters";
import { TransactionFilterTabs } from "@/components/dashboard/transaction-filter-tabs";
import { TransactionList } from "@/components/dashboard/transaction-list";
import { Button } from "@/components/ui/button";
import type { Transaction, TransactionFilter } from "@/types/finance";

type StatementProjectionModalProps = {
  open: boolean;
  onClose: () => void;
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
  onEditTransaction: (transaction: Transaction) => void;
  onRemoveTransaction: (id: string) => void;
  getNextRecurringOccurrence: (transaction: Transaction) => string | null;
  emptyStateTitle: string;
  emptyStateDescription: string;
  forecastTotalIncome: number;
  forecastTotalExpense: number;
  forecastProjectedBalance: number;
};

type StatementProjectionViewMode = "statement" | "projection";

export function StatementProjectionModal({
  open,
  onClose,
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
  onEditTransaction,
  onRemoveTransaction,
  getNextRecurringOccurrence,
  emptyStateTitle,
  emptyStateDescription,
  forecastTotalIncome,
  forecastTotalExpense,
  forecastProjectedBalance,
}: StatementProjectionModalProps) {
  const [activeMode, setActiveMode] =
    useState<StatementProjectionViewMode>("statement");

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 backdrop-blur-sm sm:items-center sm:px-6 sm:py-6 lg:px-8">
      <div className="flex max-h-[min(100dvh-0.5rem,96vh)] w-full flex-col overflow-hidden rounded-t-[1.75rem] border border-border/70 bg-background shadow-2xl sm:max-h-[92vh] sm:max-w-6xl sm:rounded-[1.75rem]">
        <div className="flex flex-col gap-4 border-b border-border/60 px-4 py-4 sm:px-6 sm:py-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Extrato
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Veja seu histórico e acompanhe os próximos movimentos.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <Button
              type="button"
              variant={activeMode === "statement" ? "default" : "outline"}
              className="rounded-2xl"
              onClick={() => setActiveMode("statement")}
            >
              <ReceiptText className="size-4" />
              Histórico
            </Button>

            <Button
              type="button"
              variant={activeMode === "projection" ? "default" : "outline"}
              className="rounded-2xl"
              onClick={() => setActiveMode("projection")}
            >
              <BarChart3 className="size-4" />
              Previsão
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="col-span-2 rounded-2xl sm:col-span-1"
              onClick={onClose}
            >
              <X className="size-4" />
              Fechar
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {activeMode === "statement" ? (
            <div className="space-y-4">
              <div className="rounded-[1.5rem] border border-border/60 bg-card/70 p-4 sm:p-5">
                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-foreground">
                    Histórico
                  </h3>

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

              <div className="rounded-[1.5rem] border border-border/60 bg-background/35 p-3 sm:p-4">
                <TransactionList
                  transactions={filteredTransactions}
                  onEditTransaction={onEditTransaction}
                  onRemoveTransaction={onRemoveTransaction}
                  getNextRecurringOccurrence={getNextRecurringOccurrence}
                  emptyStateTitle={emptyStateTitle}
                  emptyStateDescription={emptyStateDescription}
                />
              </div>
            </div>
          ) : (
            <FinancialForecastCard
              totalIncome={forecastTotalIncome}
              totalExpense={forecastTotalExpense}
              projectedBalance={forecastProjectedBalance}
            />
          )}
        </div>
      </div>
    </div>
  );
}
