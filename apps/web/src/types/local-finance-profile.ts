import type { Transaction } from "@/types/transaction";

export type LocalFinanceProfile = {
  initialBalance: number;
  transactions: Transaction[];
};
