"use client";

import { useState } from "react";
import { CalendarDays, FileText, Sparkles } from "lucide-react";

import { FinanceSummaryCard } from "@/components/dashboard/finance-summary-card";
import { ScheduleModal } from "@/components/dashboard/overlays/schedule-modal";
import { StatementProjectionModal } from "@/components/dashboard/overlays/statement-projection-modal";
import { TransactionForm } from "@/components/dashboard/transaction-form";
import { Button } from "@/components/ui/button";
import type { LocalFinanceTransactionInput } from "@/hooks/use-local-finance";
import type { Transaction, TransactionFilter } from "@/types/finance";
import type { UpcomingTransactionsMonthGroup } from "@/utils/upcoming-transactions";
import type { TransactionSortOption } from "@/components/dashboard/transaction-advanced-filters";

type DashboardTransactionsViewProps = {
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

export function DashboardTransactionsView({
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

  return (
    <>
      <div className="space-y-8 2xl:space-y-10">
        <section id="resumo-financeiro" className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Lançamentos
            </p>
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Panorama, base financeira e novo lançamento
              </h2>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                Esta área concentra o panorama financeiro atual e o fluxo principal
                de criação de transações.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <FinanceSummaryCard
              initialBalance={initialBalance}
              totalIncome={totalIncome}
              totalExpense={totalExpense}
              currentBalance={currentBalance}
            />

            <div className="rounded-[1.5rem] border border-border/70 bg-card/70 p-4 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Visualizações auxiliares
                  </p>
                  <h3 className="text-lg font-semibold text-foreground">
                    Abra a agenda, o extrato e a projeção em painéis dedicados
                  </h3>
                  <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                    Mantemos a tela de lançamentos mais limpa e deixamos as
                    leituras complementares disponíveis sob demanda.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    className="rounded-2xl"
                    onClick={() => setIsStatementProjectionModalOpen(true)}
                  >
                    <FileText className="size-4" />
                    Abrir Extrato / Projeção
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-2xl"
                    onClick={() => setIsScheduleModalOpen(true)}
                  >
                    <CalendarDays className="size-4" />
                    Abrir Agenda
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="nova-transacao" className="space-y-5">
          <div className="rounded-[1.5rem] border border-border/70 bg-card/70 p-5 shadow-sm sm:p-6 lg:p-7">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="size-5" />
              </span>

              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Área de operação principal
                </p>
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                  Aqui você mantém a base financeira atualizada e cria novos
                  lançamentos. O extrato, a projeção e a agenda ficam disponíveis
                  em popups para reduzir a poluição visual da tela principal.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Panorama
              </p>
              <p className="mt-2 text-sm text-foreground">
                Continua mostrando apenas a leitura financeira atual.
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Novo fluxo
              </p>
              <p className="mt-2 text-sm text-foreground">
                Extrato, projeção e agenda são acessados sob demanda por botões
                dedicados.
              </p>
            </div>
          </div>

          <div className="w-full">
            <TransactionForm
              initialBalance={initialBalance}
              onUpdateInitialBalance={onUpdateInitialBalance}
              onAddTransaction={onAddTransaction}
              onPreviewTransaction={onPreviewTransaction}
              onClearPreview={onClearPreview}
              isPreviewActive={isPreviewActive}
            />
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
