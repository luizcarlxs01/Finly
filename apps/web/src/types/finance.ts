import type { LocalFinanceProfile } from "@/types/local-finance-profile";
import type { Transaction, TransactionType } from "@/types/transaction";

export type TransactionFilter = "all" | TransactionType;

export type { LocalFinanceProfile, Transaction, TransactionType };
