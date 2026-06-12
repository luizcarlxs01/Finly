export type ApiTransaction = {
  id: string;
  title: string;
  amount: number;
  type: string;
  category: string;
  transactionDate: string;
  createdAt: string;
  financialProfileId: string;
  transactionKind: string;
  sourceId: string | null;
  installmentIndex: number | null;
  installmentCount: number | null;
  isRecurring: boolean;
  recurrenceStartDate: string | null;
  recurrenceEndDate: string | null;
  recurrenceDay: number | null;
  recurrenceMonths: number | null;
};
