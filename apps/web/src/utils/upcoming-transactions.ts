import type { Transaction } from "@/types/transaction";

export type UpcomingTransactionItem = {
  id: string;
  title: string;
  amount: number;
  type: Transaction["type"];
  occurrenceDate: string;
  marker: string;
  sourceKind: Transaction["transactionKind"];
};

export type UpcomingTransactionsMonthGroup = {
  id: string;
  monthLabel: string;
  monthDate: string;
  items: UpcomingTransactionItem[];
  totalIncome: number;
  totalExpense: number;
  projectedBalance: number;
  balanceTone: "neutral" | "positive" | "warning";
  balanceSummary: string;
};
