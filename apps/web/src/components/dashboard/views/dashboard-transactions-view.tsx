"use client";

import { useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  FileText,
  Sparkles,
  Wallet,
} from "lucide-react";

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

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

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

  const nextUpcomingMonth = upcomingMonthGroups[0];

  return (
    <>
      <div className="space-y-8 2xl:space-y-10">
        <section className="space-y-5">
          <div className="rounded-[2rem] border border-border/70 bg-card/95 p-6 shadow-sm sm:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  Lançamentos
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Registre entradas e saídas e acompanhe sua movimentação.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  className="rounded-2xl"
                  onClick={() => setIsStatementProjectionModalOpen(true)}
                >
                  <FileText className="size-4" />
                  Extrato
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="rounded-2xl"
                  onClick={() => setIsScheduleModalOpen(true)}
                >
                  <CalendarDays className="size-4" />
                  Agenda
                </Button>
              </div>
            </div>
          </div>

          <div id="resumo-financeiro">
            <FinanceSummaryCard
              initialBalance={initialBalance}
              totalIncome={totalIncome}
              totalExpense={totalExpense}
              currentBalance={currentBalance}
            />
          </div>
        </section>

        <section id="nova-transacao">
          <div className="rounded-[2rem] border border-border/70 bg-card/95 p-5 shadow-sm sm:p-6 lg:p-7">
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles className="size-5" />
                </span>

                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    Novo lançamento
                  </h2>
                  <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                    Adicione uma entrada ou saída do jeito que fizer mais sentido
                    para você.
                  </p>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)] xl:items-start">
                <div className="min-w-0">
                  <TransactionForm
                    initialBalance={initialBalance}
                    onUpdateInitialBalance={onUpdateInitialBalance}
                    onAddTransaction={onAddTransaction}
                    onPreviewTransaction={onPreviewTransaction}
                    onClearPreview={onClearPreview}
                    isPreviewActive={isPreviewActive}
                    showPreviewNotice={false}
                  />
                </div>

                <aside className="min-w-0 xl:sticky xl:top-6">
                  <div className="rounded-[1.5rem] border border-border/60 bg-background/55 p-4">
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-foreground">
                        Resumo rápido
                      </h3>
                      <p className="text-sm leading-6 text-muted-foreground">
                        Confira o impacto antes de salvar.
                      </p>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div
                        className={`rounded-[1.25rem] border px-4 py-3 ${
                          isPreviewActive
                            ? "border-amber-200 bg-amber-50/70"
                            : "border-border/60 bg-card/70"
                        }`}
                      >
                        <p className="text-sm font-medium text-foreground">
                          {isPreviewActive
                            ? "Simulação ativa"
                            : "Simule antes de salvar"}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {isPreviewActive
                            ? "Os valores abaixo já mostram esse impacto."
                            : 'Use "Simular impacto" para ver como esse lançamento pode ficar.'}
                        </p>
                        {isPreviewActive ? (
                          <Button
                            type="button"
                            variant="ghost"
                            className="mt-2 h-9 rounded-xl px-0"
                            onClick={onClearPreview}
                          >
                            Limpar simulação
                          </Button>
                        ) : null}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                        <div className="rounded-[1.25rem] border border-border/60 bg-card/70 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Saldo previsto
                              </p>
                              <p className="mt-1 text-lg font-semibold text-foreground">
                                {currencyFormatter.format(forecastProjectedBalance)}
                              </p>
                            </div>
                            <span className="flex size-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                              <Wallet className="size-4.5" />
                            </span>
                          </div>
                        </div>

                        <div className="rounded-[1.25rem] border border-border/60 bg-card/70 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Entradas
                              </p>
                              <p className="mt-1 text-lg font-semibold text-green-700">
                                {currencyFormatter.format(forecastTotalIncome)}
                              </p>
                            </div>
                            <span className="flex size-9 items-center justify-center rounded-2xl bg-green-100 text-green-800">
                              <ArrowUpRight className="size-4.5" />
                            </span>
                          </div>
                        </div>

                        <div className="rounded-[1.25rem] border border-border/60 bg-card/70 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Saídas
                              </p>
                              <p className="mt-1 text-lg font-semibold text-red-700">
                                {currencyFormatter.format(forecastTotalExpense)}
                              </p>
                            </div>
                            <span className="flex size-9 items-center justify-center rounded-2xl bg-red-100 text-red-800">
                              <ArrowDownRight className="size-4.5" />
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[1.25rem] border border-border/60 bg-muted/35 px-4 py-3">
                        <p className="text-xs text-muted-foreground">
                          Próximo período
                        </p>
                        <p className="mt-1 text-sm font-medium text-foreground">
                          {nextUpcomingMonth?.monthLabel ??
                            "Sem lançamentos previstos"}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {nextUpcomingMonth
                            ? "Abra o Extrato ou a Agenda se quiser ver mais detalhes."
                            : "Quando houver parcelas ou recorrências, elas aparecem aqui."}
                        </p>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[1.75rem] border border-border/70 bg-card/95 p-5 shadow-sm sm:p-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                Extrato
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                Veja seu histórico e acompanhe sua movimentação.
              </p>

              <Button
                type="button"
                className="rounded-2xl"
                onClick={() => setIsStatementProjectionModalOpen(true)}
              >
                <FileText className="size-4" />
                Abrir extrato
              </Button>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-border/70 bg-card/95 p-5 shadow-sm sm:p-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                Agenda
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                Acompanhe o que está previsto para os próximos meses.
              </p>

              <Button
                type="button"
                variant="outline"
                className="rounded-2xl"
                onClick={() => setIsScheduleModalOpen(true)}
              >
                <CalendarDays className="size-4" />
                Abrir agenda
              </Button>
            </div>
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
