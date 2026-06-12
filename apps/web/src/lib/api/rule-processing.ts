import { apiFetch } from "@/lib/api/client";
import type { ApiRuleProcessingResult } from "@/types/api-rule-processing";

export const RULE_PROCESSING_COMPLETED_EVENT = "finly:rule-processing-completed";

function getReferenceDateValue() {
  return new Date().toISOString().slice(0, 10);
}

export async function processFinancialRules(
  financialProfileId: string,
  token: string,
): Promise<ApiRuleProcessingResult> {
  return apiFetch<ApiRuleProcessingResult>(
    `/api/RuleProcessing/${financialProfileId}`,
    {
      method: "POST",
      token,
      body: JSON.stringify({
        referenceDate: getReferenceDateValue(),
      }),
    },
  );
}
