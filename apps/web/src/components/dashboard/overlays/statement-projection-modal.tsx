"use client";

import { FinancialForecastCard } from "@/components/dashboard/financial-forecast-card";
import { FinancialDialog } from "@/components/dashboard/overlays/financial-dialog";
import type { TransactionSortOption } from "@/components/dashboard/transaction-advanced-filters";
import type { Transaction, TransactionFilter } from "@/types/finance";
import styles from "./statement-projection-dialog.module.css";

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

export function StatementProjectionModal({
  open,
  onClose,
  forecastTotalIncome,
  forecastTotalExpense,
  forecastProjectedBalance,
}: StatementProjectionModalProps) {
  return open ? (
    <FinancialDialog
      title="Previsão"
      header={
        <div className={styles.heading}>
          <h2>Previsão</h2>
        </div>
      }
      onClose={onClose}
      smooth
      className={styles.dialog}
    >
      <FinancialForecastCard
        minimal
        totalIncome={forecastTotalIncome}
        totalExpense={forecastTotalExpense}
        projectedBalance={forecastProjectedBalance}
      />
    </FinancialDialog>
  ) : null;
}
