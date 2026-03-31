export type TransactionType = "income" | "expense";

export const TRANSACTION_RECURRENCE_TYPES = ["monthly"] as const;

export type TransactionRecurrenceType =
  (typeof TRANSACTION_RECURRENCE_TYPES)[number];

export const TRANSACTION_RECURRENCE_LABELS: Record<
  TransactionRecurrenceType,
  string
> = {
  monthly: "Mensal",
};

export const TRANSACTION_KINDS = [
  "single",
  "installment-template",
  "installment-instance",
  "recurring-template",
  "recurring-instance",
] as const;

export type TransactionKind = (typeof TRANSACTION_KINDS)[number];

export const TRANSACTION_RECURRENCE_MODES = [
  "indefinite",
  "until-date",
  "for-months",
] as const;

export type TransactionRecurrenceMode =
  (typeof TRANSACTION_RECURRENCE_MODES)[number];

export type Transaction = {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  transactionKind: TransactionKind;
  sourceId: string | null;
  occurrenceDate: string | null;
  installmentIndex: number | null;
  installmentCount: number | null;
  installmentStartDate: string | null;
  recurringSourceId: string | null;
  recurringOccurrenceDate: string | null;
  isRecurring: boolean;
  recurrenceType: TransactionRecurrenceType | null;
  recurrenceMode: TransactionRecurrenceMode | null;
  recurrenceDay: number | null;
  recurrenceStartDate: string | null;
  recurrenceEndDate: string | null;
  recurrenceMonths: number | null;
  lastGeneratedAt: string | null;
  createdAt: string;
};
