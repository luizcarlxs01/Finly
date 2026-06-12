import { apiFetch } from "@/lib/api/client";
import type { ApiGoal } from "@/types/api-goal";

export type CreateApiGoalRequest = {
  financialProfileId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
};

export type UpdateApiGoalProgressRequest = {
  currentAmount: number;
};

export const GOAL_WRITE_COMPLETED_EVENT = "finly:goal-write-completed";

export async function getGoals(
  financialProfileId: string,
  token: string,
): Promise<ApiGoal[]> {
  const query = new URLSearchParams({ financialProfileId }).toString();

  return apiFetch<ApiGoal[]>(`/api/Goals?${query}`, {
    method: "GET",
    token,
  });
}

export async function createGoal(
  request: CreateApiGoalRequest,
  token: string,
): Promise<ApiGoal> {
  return apiFetch<ApiGoal>("/api/Goals", {
    method: "POST",
    token,
    body: JSON.stringify(request),
  });
}

export async function updateGoalProgress(
  id: string,
  request: UpdateApiGoalProgressRequest,
  token: string,
): Promise<ApiGoal> {
  return apiFetch<ApiGoal>(`/api/Goals/${id}/progress`, {
    method: "PATCH",
    token,
    body: JSON.stringify(request),
  });
}

export async function deleteGoal(id: string, token: string): Promise<void> {
  return apiFetch<void>(`/api/Goals/${id}`, {
    method: "DELETE",
    token,
  });
}
