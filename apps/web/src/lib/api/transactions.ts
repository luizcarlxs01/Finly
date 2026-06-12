import { apiFetch } from "@/lib/api/client";
import type { ApiTransaction } from "@/types/api-transaction";

export type CreateApiTransactionRequest = {
  financialProfileId: string;
  title: string;
  amount: number;
  type: string;
  category: string;
  transactionKind: string;
  transactionDate: string;
  sourceId: string | null;
  installmentIndex: number | null;
  installmentCount: number | null;
  isRecurring: boolean;
  recurrenceStartDate: string | null;
  recurrenceEndDate: string | null;
  recurrenceDay: number | null;
  recurrenceMonths: number | null;
};

export type UpdateApiTransactionRequest = CreateApiTransactionRequest;

export const TRANSACTION_WRITE_COMPLETED_EVENT =
  "finly:transaction-write-completed";

export async function getTransactions(
  financialProfileId: string,
  token: string,
): Promise<ApiTransaction[]> {
  const query = new URLSearchParams({ financialProfileId }).toString();

  return apiFetch<ApiTransaction[]>(`/api/Transactions?${query}`, {
    method: "GET",
    token,
  });
}

export async function createTransaction(
  request: CreateApiTransactionRequest,
  token: string,
): Promise<ApiTransaction> {
  return apiFetch<ApiTransaction>("/api/Transactions", {
    method: "POST",
    token,
    body: JSON.stringify(request),
  });
}

export async function updateTransaction(
  id: string,
  request: UpdateApiTransactionRequest,
  token: string,
): Promise<ApiTransaction> {
  return apiFetch<ApiTransaction>(`/api/Transactions/${id}`, {
    method: "PUT",
    token,
    body: JSON.stringify(request),
  });
}

export async function deleteTransaction(
  id: string,
  token: string,
): Promise<void> {
  await apiFetch(`/api/Transactions/${id}`, {
    method: "DELETE",
    token,
  });
}
