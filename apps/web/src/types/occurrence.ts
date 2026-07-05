export type OccurrenceStatus = "pending" | "paid";

export type Occurrence = {
  id: string;
  transactionId: string;
  installmentIndex: number | null;
  dueDate: string;
  amount: number;
  status: OccurrenceStatus;
  paidAt: string | null;
  isCustomized: boolean;
  createdAt: string;
};
