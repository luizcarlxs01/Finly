"use client";

import { useEffect, useState } from "react";
import { useFinanceSource } from "@/contexts/finance-source-context";
import { useAuthSession } from "@/hooks/use-auth-session";
import type { ApiFinancialRule } from "@/types/api-financial-rule";
import type { ApiRuleProcessingResult } from "@/types/api-rule-processing";
import {
  createFinancialRule,
  deleteFinancialRule,
  FINANCIAL_RULE_WRITE_COMPLETED_EVENT,
  getFinancialRules,
  type UpsertApiFinancialRuleRequest,
  updateFinancialRule,
} from "@/lib/api/financial-rules";
import {
  processFinancialRules,
  RULE_PROCESSING_COMPLETED_EVENT,
} from "@/lib/api/rule-processing";

type UseFinancialRulesDataOptions = {
  selectedProfileId: string | null;
};

type UseFinancialRulesDataReturn = {
  createRule: (input: UpsertApiFinancialRuleRequest) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
  errorMessage: string | null;
  isLoaded: boolean;
  isLoading: boolean;
  isProcessing: boolean;
  isSubmitting: boolean;
  processErrorMessage: string | null;
  processResult: ApiRuleProcessingResult | null;
  processRules: () => Promise<void>;
  rules: ApiFinancialRule[];
  updateRule: (id: string, input: UpsertApiFinancialRuleRequest) => Promise<void>;
};

function getFriendlyLoadErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Nao foi possivel carregar as regras financeiras agora.";
}

function getFriendlyWriteErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Nao foi possivel salvar a regra financeira agora.";
}

function getFriendlyProcessErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Nao foi possivel processar as regras financeiras agora.";
}

export function useFinancialRulesData({
  selectedProfileId,
}: UseFinancialRulesDataOptions): UseFinancialRulesDataReturn {
  const { source, isLoaded: isSourceLoaded } = useFinanceSource();
  const { session } = useAuthSession();
  const [rules, setRules] = useState<ApiFinancialRule[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [processErrorMessage, setProcessErrorMessage] = useState<string | null>(null);
  const [processResult, setProcessResult] = useState<ApiRuleProcessingResult | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const token = session?.token ?? null;
  const isApiMode = source === "api";

  useEffect(() => {
    function handleReload() {
      setReloadKey((current) => current + 1);
    }

    window.addEventListener(
      FINANCIAL_RULE_WRITE_COMPLETED_EVENT,
      handleReload,
    );
    window.addEventListener(RULE_PROCESSING_COMPLETED_EVENT, handleReload);

    return () => {
      window.removeEventListener(
        FINANCIAL_RULE_WRITE_COMPLETED_EVENT,
        handleReload,
      );
      window.removeEventListener(RULE_PROCESSING_COMPLETED_EVENT, handleReload);
    };
  }, []);

  useEffect(() => {
    if (!isSourceLoaded || !isApiMode || !token || !selectedProfileId) {
      setRules([]);
      setErrorMessage(null);
      setProcessErrorMessage(null);
      setProcessResult(null);
      setIsLoading(false);
      return;
    }

    const authToken = token;
    const profileId = selectedProfileId;
    let isMounted = true;

    async function loadRules() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const nextRules = await getFinancialRules(profileId, authToken);

        if (!isMounted) {
          return;
        }

        setRules(nextRules);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setRules([]);
        setErrorMessage(getFriendlyLoadErrorMessage(error));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadRules();

    return () => {
      isMounted = false;
    };
  }, [isApiMode, isSourceLoaded, reloadKey, selectedProfileId, token]);

  async function createRule(input: UpsertApiFinancialRuleRequest) {
    if (!token) {
      throw new Error("Sua sessao de conta nao esta disponivel.");
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await createFinancialRule(input, token);
      window.dispatchEvent(new Event(FINANCIAL_RULE_WRITE_COMPLETED_EVENT));
    } catch (error) {
      const nextErrorMessage = getFriendlyWriteErrorMessage(error);
      setErrorMessage(nextErrorMessage);
      throw new Error(nextErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function updateRule(id: string, input: UpsertApiFinancialRuleRequest) {
    if (!token) {
      throw new Error("Sua sessao de conta nao esta disponivel.");
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await updateFinancialRule(id, input, token);
      window.dispatchEvent(new Event(FINANCIAL_RULE_WRITE_COMPLETED_EVENT));
    } catch (error) {
      const nextErrorMessage = getFriendlyWriteErrorMessage(error);
      setErrorMessage(nextErrorMessage);
      throw new Error(nextErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deleteRule(id: string) {
    if (!token) {
      throw new Error("Sua sessao de conta nao esta disponivel.");
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await deleteFinancialRule(id, token);
      window.dispatchEvent(new Event(FINANCIAL_RULE_WRITE_COMPLETED_EVENT));
    } catch (error) {
      const nextErrorMessage = getFriendlyWriteErrorMessage(error);
      setErrorMessage(nextErrorMessage);
      throw new Error(nextErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function processRules() {
    if (!token || !selectedProfileId) {
      throw new Error("Nao foi possivel identificar o perfil da conta.");
    }

    setIsProcessing(true);
    setProcessErrorMessage(null);

    try {
      const nextResult = await processFinancialRules(selectedProfileId, token);
      setProcessResult(nextResult);
      window.dispatchEvent(new Event(RULE_PROCESSING_COMPLETED_EVENT));
    } catch (error) {
      const nextErrorMessage = getFriendlyProcessErrorMessage(error);
      setProcessErrorMessage(nextErrorMessage);
      setProcessResult(null);
      throw new Error(nextErrorMessage);
    } finally {
      setIsProcessing(false);
    }
  }

  return {
    createRule,
    deleteRule,
    errorMessage,
    isLoaded: !isApiMode || (isSourceLoaded && !isLoading),
    isLoading,
    isProcessing,
    isSubmitting,
    processErrorMessage,
    processResult,
    processRules,
    rules,
    updateRule,
  };
}
