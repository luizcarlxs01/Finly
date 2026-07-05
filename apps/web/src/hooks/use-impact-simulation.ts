"use client";

import { useCallback, useEffect, useState } from "react";
import type { FinanceSource } from "@/contexts/finance-source-context";
import type {
  LocalFinanceTransactionInput,
} from "@/hooks/use-local-finance";
import type { LocalFinanceProfile } from "@/types/local-finance-profile";
import type {
  Transaction,
  TransactionKind,
  TransactionRecurrenceMode,
} from "@/types/transaction";
import type { OccurrenceStatus } from "@/types/occurrence";
import {
  createMonthlyOccurrence,
  formatDateValue,
  getTodayDateValue,
  parseDateValue,
} from "@/utils/recurring-transactions";
import {
  normalizeInstallmentCount,
  normalizeInstallmentStartDate,
  normalizeTransactionKind,
  normalizeTransactionRecurrenceDay,
  normalizeTransactionRecurrenceEndDate,
  normalizeTransactionRecurrenceMode,
  normalizeTransactionRecurrenceMonths,
  normalizeTransactionRecurrenceStartDate,
  normalizeTransactionRecurrenceType,
} from "@/utils/transaction-normalization";

type UseImpactSimulationInput = {
  createLocalPreviewProfile: (
    input: LocalFinanceTransactionInput,
  ) => LocalFinanceProfile | null;
  source: FinanceSource;
  transactions: Transaction[];
};

type UseImpactSimulationReturn = {
  clearSimulation: () => void;
  isPreviewActive: boolean;
  previewTransactions: Transaction[] | null;
  simulateImpact: (input: LocalFinanceTransactionInput) => void;
};

function sortTransactionsByMostRecent(transactions: Transaction[]) {
  return [...transactions].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

function getTransactionCreatedAt(
  transactionDate: string | null | undefined,
  fallbackDate?: string,
) {
  const normalizedDate =
    parseDateValue(transactionDate) ??
    parseDateValue(fallbackDate) ??
    parseDateValue(getTodayDateValue());

  return normalizedDate ? normalizedDate.toISOString() : new Date().toISOString();
}

function normalizeTransactionInput(input: LocalFinanceTransactionInput) {
  const normalizedTransactionKind = normalizeTransactionKind(
    input.transactionKind,
    input.isRecurring === true,
  );

  const isRecurring =
    normalizedTransactionKind === "recurring-template" ||
    normalizedTransactionKind === "recurring-instance";

  const transactionKind = normalizedTransactionKind;

  const recurrenceType = isRecurring
    ? normalizeTransactionRecurrenceType(input.recurrenceType) ?? "monthly"
    : null;

  const recurrenceStartDate = isRecurring
    ? normalizeTransactionRecurrenceStartDate(
        input.recurrenceStartDate,
        getTodayDateValue(),
      )
    : null;

  const recurrenceDay =
    isRecurring && recurrenceStartDate
      ? normalizeTransactionRecurrenceDay(input.recurrenceDay, recurrenceStartDate)
      : null;

  const recurrenceMode = isRecurring
    ? normalizeTransactionRecurrenceMode(input.recurrenceMode) ?? "indefinite"
    : null;

  const recurrenceEndDate =
    isRecurring && recurrenceMode === "until-date" && recurrenceStartDate
      ? normalizeTransactionRecurrenceEndDate(
          input.recurrenceEndDate,
          recurrenceStartDate,
        )
      : null;

  const recurrenceMonths =
    isRecurring && recurrenceMode === "for-months"
      ? normalizeTransactionRecurrenceMonths(input.recurrenceMonths)
      : null;

  const installmentCount =
    transactionKind === "installment-template"
      ? normalizeInstallmentCount(input.installmentCount)
      : null;

  const installmentStartDate =
    transactionKind === "installment-template"
      ? normalizeInstallmentStartDate(
          input.installmentStartDate,
          getTodayDateValue(),
        )
      : null;

  const transactionDate =
    transactionKind === "single"
      ? input.transactionDate?.trim() || getTodayDateValue()
      : null;

  return {
    title: input.title.trim(),
    amount: Number(input.amount),
    type: input.type,
    category: input.category.trim().toLowerCase(),
    transactionKind,
    isRecurring,
    recurrenceType,
    recurrenceMode,
    recurrenceDay,
    recurrenceStartDate,
    recurrenceEndDate,
    recurrenceMonths,
    installmentCount,
    installmentStartDate,
    transactionDate,
  };
}

function isValidTransactionInput(
  input: ReturnType<typeof normalizeTransactionInput>,
) {
  return (
    Boolean(input.title) &&
    !Number.isNaN(input.amount) &&
    input.amount > 0 &&
    Boolean(input.category) &&
    (input.transactionKind !== "installment-template" ||
      (Boolean(input.installmentCount) && Boolean(input.installmentStartDate))) &&
    (!input.isRecurring ||
      (Boolean(input.recurrenceType) &&
        Boolean(input.recurrenceDay) &&
        Boolean(input.recurrenceStartDate) &&
        (input.recurrenceMode !== "until-date" ||
          Boolean(input.recurrenceEndDate)) &&
        (input.recurrenceMode !== "for-months" ||
          Boolean(input.recurrenceMonths))))
  );
}

type PreviewOccurrence = {
  dueDate: string;
  amount: number;
  installmentIndex: number | null;
  status: OccurrenceStatus;
};

function addMonthsToDate(date: Date, monthOffset: number) {
  const totalMonths = date.getMonth() + monthOffset;
  const year = date.getFullYear() + Math.floor(totalMonths / 12);
  const monthIndex = ((totalMonths % 12) + 12) % 12;

  return { year, monthIndex };
}

function buildOccurrenceDate(anchorDate: Date, dayOfMonth: number, monthOffset: number) {
  const { year, monthIndex } = addMonthsToDate(anchorDate, monthOffset);

  return createMonthlyOccurrence(year, monthIndex, dayOfMonth);
}

/**
 * Replica em memória, só para o preview, as mesmas regras do backend
 * (Finly.Application/Services/OccurrenceGenerationService.cs) — Single gera 1 occurrence,
 * Installment gera N mensais a partir da data informada, Recurring gera até a condição de
 * parada (until-date/for-months/12 meses se indefinido). Status Paid/Pending é decidido do
 * mesmo jeito: DueDate <= hoje. Isso é dívida técnica conhecida — duplica a regra do backend
 * só para fins de simulação, já que o preview nunca é persistido.
 */
function generatePreviewOccurrences(
  input: ReturnType<typeof normalizeTransactionInput>,
): PreviewOccurrence[] {
  const today = parseDateValue(getTodayDateValue())!;

  function buildOccurrence(dueDate: Date, installmentIndex: number | null): PreviewOccurrence {
    return {
      dueDate: formatDateValue(dueDate),
      amount: input.amount,
      installmentIndex,
      status: dueDate <= today ? "paid" : "pending",
    };
  }

  if (input.transactionKind === "installment-template") {
    const startDate = parseDateValue(input.installmentStartDate);

    if (!startDate || !input.installmentCount) {
      return [];
    }

    const dayOfMonth = startDate.getDate();
    const occurrences: PreviewOccurrence[] = [];

    for (let index = 0; index < input.installmentCount; index += 1) {
      const dueDate = buildOccurrenceDate(startDate, dayOfMonth, index);
      occurrences.push(buildOccurrence(dueDate, index + 1));
    }

    return occurrences;
  }

  if (input.transactionKind === "recurring-template") {
    const startDate = parseDateValue(input.recurrenceStartDate);

    if (!startDate) {
      return [];
    }

    const dayOfMonth = input.recurrenceDay ?? startDate.getDate();
    const mode = input.recurrenceMode ?? "indefinite";
    const endDate = parseDateValue(input.recurrenceEndDate);
    const occurrences: PreviewOccurrence[] = [];
    let monthOffset = 0;

    while (true) {
      const dueDate = buildOccurrenceDate(startDate, dayOfMonth, monthOffset);

      if (mode === "until-date") {
        if (endDate && dueDate > endDate) {
          break;
        }
      } else if (mode === "for-months") {
        if (monthOffset >= (input.recurrenceMonths ?? 0)) {
          break;
        }
      } else if (monthOffset >= 12) {
        break;
      }

      occurrences.push(buildOccurrence(dueDate, monthOffset + 1));
      monthOffset += 1;
    }

    return occurrences;
  }

  const transactionDate = parseDateValue(input.transactionDate) ?? today;

  return [buildOccurrence(transactionDate, null)];
}

function buildPreviewLineItems(
  input: ReturnType<typeof normalizeTransactionInput>,
): Transaction[] {
  const previewOccurrences = generatePreviewOccurrences(input);
  const displayKind: TransactionKind =
    input.transactionKind === "installment-template"
      ? "installment-instance"
      : input.transactionKind === "recurring-template"
        ? "recurring-instance"
        : "single";
  const createdAt = getTransactionCreatedAt(
    input.transactionDate ?? input.installmentStartDate ?? input.recurrenceStartDate,
  );

  return previewOccurrences.map((occurrence, index) => ({
    id: `preview-occurrence-${index}`,
    title: input.title,
    amount: occurrence.amount,
    type: input.type,
    category: input.category,
    transactionKind: displayKind,
    sourceId: "preview-transaction",
    occurrenceDate: occurrence.dueDate,
    installmentIndex: occurrence.installmentIndex,
    installmentCount: input.installmentCount,
    installmentStartDate: null,
    recurringSourceId: displayKind === "recurring-instance" ? "preview-transaction" : null,
    recurringOccurrenceDate:
      displayKind === "recurring-instance" ? occurrence.dueDate : null,
    isRecurring: input.isRecurring,
    recurrenceType: displayKind === "recurring-instance" ? "monthly" : null,
    recurrenceMode: input.recurrenceMode as TransactionRecurrenceMode | null,
    recurrenceDay: input.recurrenceDay,
    recurrenceStartDate: input.recurrenceStartDate,
    recurrenceEndDate: input.recurrenceEndDate,
    recurrenceMonths: input.recurrenceMonths,
    lastGeneratedAt: null,
    createdAt,
    occurrenceId: `preview-occurrence-${index}`,
    occurrenceStatus: occurrence.status,
    isCustomized: false,
  }));
}

function createApiPreviewProfile(
  transactions: Transaction[],
  input: LocalFinanceTransactionInput,
) {
  const normalizedInput = normalizeTransactionInput(input);

  if (!isValidTransactionInput(normalizedInput)) {
    return null;
  }

  const previewLineItems = buildPreviewLineItems(normalizedInput);

  return {
    initialBalance: 0,
    transactions: sortTransactionsByMostRecent([...previewLineItems, ...transactions]),
  };
}

export function useImpactSimulation({
  createLocalPreviewProfile,
  source,
  transactions,
}: UseImpactSimulationInput): UseImpactSimulationReturn {
  const [previewTransactions, setPreviewTransactions] =
    useState<Transaction[] | null>(null);

  useEffect(() => {
    setPreviewTransactions(null);
  }, [source]);

  const clearSimulation = useCallback(() => {
    setPreviewTransactions(null);
  }, []);

  const simulateImpact = useCallback((input: LocalFinanceTransactionInput) => {
    if (source === "local") {
      const previewProfile = createLocalPreviewProfile(input);
      setPreviewTransactions(previewProfile?.transactions ?? null);
      return;
    }

    const previewProfile = createApiPreviewProfile(transactions, input);
    setPreviewTransactions(previewProfile?.transactions ?? null);
  }, [createLocalPreviewProfile, source, transactions]);

  return {
    clearSimulation,
    isPreviewActive: previewTransactions !== null,
    previewTransactions,
    simulateImpact,
  };
}
