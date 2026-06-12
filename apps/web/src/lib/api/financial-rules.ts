import { apiFetch } from "@/lib/api/client";
import type { ApiFinancialRule } from "@/types/api-financial-rule";

export type UpsertApiFinancialRuleRequest = {
  financialProfileId: string;
  title: string;
  amount: number;
  ruleType: string;
  recurrenceMode: string | null;
  dayOfMonth: number;
  startDate: string;
  endDate: string | null;
  totalMonths: number | null;
  isActive: boolean;
};

export const FINANCIAL_RULE_WRITE_COMPLETED_EVENT =
  "finly:financial-rule-write-completed";

export async function getFinancialRules(
  financialProfileId: string,
  token: string,
): Promise<ApiFinancialRule[]> {
  const query = new URLSearchParams({ financialProfileId }).toString();

  return apiFetch<ApiFinancialRule[]>(`/api/FinancialRules?${query}`, {
    method: "GET",
    token,
  });
}

export async function createFinancialRule(
  request: UpsertApiFinancialRuleRequest,
  token: string,
): Promise<ApiFinancialRule> {
  return apiFetch<ApiFinancialRule>("/api/FinancialRules", {
    method: "POST",
    token,
    body: JSON.stringify(request),
  });
}

export async function updateFinancialRule(
  id: string,
  request: UpsertApiFinancialRuleRequest,
  token: string,
): Promise<ApiFinancialRule> {
  return apiFetch<ApiFinancialRule>(`/api/FinancialRules/${id}`, {
    method: "PUT",
    token,
    body: JSON.stringify(request),
  });
}

export async function deleteFinancialRule(
  id: string,
  token: string,
): Promise<void> {
  return apiFetch<void>(`/api/FinancialRules/${id}`, {
    method: "DELETE",
    token,
  });
}
