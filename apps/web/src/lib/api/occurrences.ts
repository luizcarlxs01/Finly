import { apiFetch } from "@/lib/api/client";
import type { ApiOccurrence } from "@/types/api-occurrence";

export type UpdateApiOccurrenceRequest = {
  dueDate: string;
  amount: number;
};

export async function getOccurrence(
  id: string,
  token: string,
): Promise<ApiOccurrence> {
  return apiFetch<ApiOccurrence>(`/api/Occurrences/${id}`, {
    method: "GET",
    token,
  });
}

export async function updateOccurrence(
  id: string,
  request: UpdateApiOccurrenceRequest,
  token: string,
): Promise<ApiOccurrence> {
  return apiFetch<ApiOccurrence>(`/api/Occurrences/${id}`, {
    method: "PUT",
    token,
    body: JSON.stringify(request),
  });
}

export async function markAsPaid(
  id: string,
  token: string,
): Promise<ApiOccurrence> {
  return apiFetch<ApiOccurrence>(`/api/Occurrences/${id}/mark-paid`, {
    method: "PATCH",
    token,
  });
}

export async function markAsPending(
  id: string,
  token: string,
): Promise<ApiOccurrence> {
  return apiFetch<ApiOccurrence>(`/api/Occurrences/${id}/mark-pending`, {
    method: "PATCH",
    token,
  });
}

export async function cancelOccurrence(
  id: string,
  token: string,
): Promise<ApiOccurrence> {
  return apiFetch<ApiOccurrence>(`/api/Occurrences/${id}`, {
    method: "DELETE",
    token,
  });
}
