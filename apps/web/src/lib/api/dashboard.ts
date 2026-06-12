import { apiFetch } from "@/lib/api/client";
import type { DashboardSummary } from "@/types/dashboard";

export async function getDashboardSummary(
  financialProfileId: string,
  token: string,
): Promise<DashboardSummary> {
  return apiFetch<DashboardSummary>(`/api/Dashboard/${financialProfileId}`, {
    method: "GET",
    token,
  });
}
