export type ApiOccurrenceStatus = "Pending" | "Paid" | "Cancelled";

export type ApiOccurrence = {
  id: string;
  transactionId: string;
  installmentIndex: number | null;
  dueDate: string;
  amount: number;
  status: ApiOccurrenceStatus;
  paidAt: string | null;
  isCustomized: boolean;
  createdAt: string;
};
