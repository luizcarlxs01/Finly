import type { ApiOccurrence } from "@/types/api-occurrence";

/**
 * Espelha ApiTransaction (types/api-transaction.ts), mas sem `financialProfileId`/
 * `installmentIndex` (irrelevantes no modo local) nem `occurrences` embutidas — as
 * Occurrences reais vivem à parte, em LocalFinanceProfile.occurrences, e são unidas ao
 * contrato sob demanda (ver join em use-local-finance.ts) antes de achatar com
 * flattenApiTransactionToLineItems (utils/flatten-transaction.ts). `type` e
 * `transactionKind` usam o mesmo vocabulário cru do backend ("Income"/"Expense",
 * "Single"/"Installment"/"Recurring") para que a função de achatamento funcione
 * identicamente nos dois modos, sem saber de onde veio o dado.
 */
export type LocalTransactionContract = {
  id: string;
  title: string;
  amount: number;
  type: string;
  category: string;
  transactionDate: string;
  createdAt: string;
  transactionKind: string;
  sourceId: string | null;
  installmentCount: number | null;
  isRecurring: boolean;
  recurrenceStartDate: string | null;
  recurrenceEndDate: string | null;
  recurrenceDay: number | null;
  recurrenceMonths: number | null;
};

export type LocalFinanceProfile = {
  initialBalance: number;
  transactions: LocalTransactionContract[];
  occurrences: ApiOccurrence[];
};
