"use client";

import { useEffect, useMemo, useState } from "react";
import type { ApiOccurrence } from "@/types/api-occurrence";
import type {
  LocalFinanceProfile,
  LocalTransactionContract,
} from "@/types/local-finance-profile";
import type {
  Transaction,
  TransactionKind,
  TransactionRecurrenceMode,
  TransactionRecurrenceType,
  TransactionType,
} from "@/types/transaction";
import { flattenApiTransactionToLineItems } from "@/utils/flatten-transaction";
import { generateOccurrences } from "@/utils/occurrence-generation";
import { getTodayDateValue, parseDateValue } from "@/utils/recurring-transactions";
import {
  getBackendTransactionKind,
  inferContractRecurrenceMode,
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

const LOCAL_STORAGE_KEY = "finly:local-finance";

export type LocalFinanceTransactionInput = {
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  transactionKind?: TransactionKind;
  transactionDate?: string | null;
  isRecurring: boolean;
  recurrenceType: TransactionRecurrenceType | null;
  recurrenceMode?: TransactionRecurrenceMode | null;
  recurrenceDay: number | null;
  recurrenceStartDate: string | null;
  recurrenceEndDate?: string | null;
  recurrenceMonths?: number | null;
  installmentCount?: number | null;
  installmentStartDate?: string | null;
};

type UpdateTransactionInput = LocalFinanceTransactionInput & {
  id: string;
};

type UpdateOccurrenceInput = {
  id: string;
  dueDate: string;
  amount: number;
};

const defaultProfile: LocalFinanceProfile = {
  initialBalance: 0,
  transactions: [],
  occurrences: [],
};

export function normalizeTransactionInput(input: LocalFinanceTransactionInput) {
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

export function isValidTransactionInput(
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

function getContractAnchorDate(input: ReturnType<typeof normalizeTransactionInput>) {
  return (
    input.installmentStartDate ??
    input.recurrenceStartDate ??
    input.transactionDate ??
    getTodayDateValue()
  );
}

function getTransactionCreatedAt(transactionDate: string | null | undefined) {
  const normalizedDate =
    parseDateValue(transactionDate) ?? parseDateValue(getTodayDateValue());

  return normalizedDate ? normalizedDate.toISOString() : new Date().toISOString();
}

function buildContract(
  contractId: string,
  input: ReturnType<typeof normalizeTransactionInput>,
  createdAt: string,
): LocalTransactionContract {
  return {
    id: contractId,
    title: input.title,
    amount: input.amount,
    type: input.type === "income" ? "Income" : "Expense",
    category: input.category,
    transactionDate: getContractAnchorDate(input),
    createdAt,
    transactionKind: getBackendTransactionKind(input.transactionKind),
    sourceId: null,
    installmentCount: input.installmentCount,
    isRecurring: input.isRecurring,
    recurrenceStartDate: input.recurrenceStartDate,
    recurrenceEndDate: input.recurrenceEndDate,
    recurrenceDay: input.recurrenceDay,
    recurrenceMonths: input.recurrenceMonths,
  };
}

/**
 * Gera as Occurrences reais de um contrato usando generateOccurrences
 * (utils/occurrence-generation.ts) — a mesma função usada para o preview de simulação,
 * réplica das regras de Finly.Application/Services/OccurrenceGenerationService.cs. No modo
 * local isso persiste de verdade no localStorage, não é só preview.
 */
function buildOccurrences(
  contractId: string,
  input: ReturnType<typeof normalizeTransactionInput>,
): ApiOccurrence[] {
  const generated = generateOccurrences(input);
  const nowIso = new Date().toISOString();

  return generated.map((occurrence) => ({
    id: crypto.randomUUID(),
    transactionId: contractId,
    installmentIndex: occurrence.installmentIndex,
    dueDate: occurrence.dueDate,
    amount: occurrence.amount,
    status: occurrence.status === "paid" ? "Paid" : "Pending",
    paidAt: occurrence.status === "paid" ? nowIso : null,
    isCustomized: false,
    createdAt: nowIso,
  }));
}

/**
 * Achata contratos + Occurrences em linhas de UI reutilizando flattenApiTransactionToLineItems
 * (utils/flatten-transaction.ts) — a mesma função usada pelo modo API. Occurrences Cancelled
 * são excluídas aqui, espelhando o filtro que o backend aplica em TransactionService.MapToResponse
 * (seção 21 do CLAUDE.md) — nenhum consumidor da UI precisa se lembrar de filtrar.
 */
function flattenLocalProfile(profile: LocalFinanceProfile): Transaction[] {
  const flattened = profile.transactions.flatMap((contract) =>
    flattenApiTransactionToLineItems({
      ...contract,
      financialProfileId: "",
      installmentIndex: null,
      occurrences: profile.occurrences.filter(
        (occurrence) =>
          occurrence.transactionId === contract.id && occurrence.status !== "Cancelled",
      ),
    }),
  );

  return [...flattened].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

function normalizeStoredProfile(profile: LocalFinanceProfile): LocalFinanceProfile {
  return {
    initialBalance: profile.initialBalance ?? 0,
    transactions: profile.transactions ?? [],
    occurrences: profile.occurrences ?? [],
  };
}

export function useLocalFinance() {
  const [profile, setProfile] = useState<LocalFinanceProfile>(defaultProfile);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const storedValue = window.localStorage.getItem(LOCAL_STORAGE_KEY);

    if (!storedValue) {
      setIsLoaded(true);
      return;
    }

    try {
      const parsedValue = JSON.parse(storedValue) as LocalFinanceProfile;
      setProfile(normalizeStoredProfile(parsedValue));
    } catch {
      setProfile(defaultProfile);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
  }, [profile, isLoaded]);

  const transactions = useMemo(() => flattenLocalProfile(profile), [profile]);

  const postedTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.occurrenceStatus === "paid"),
    [transactions],
  );

  const totalIncome = useMemo(() => {
    return postedTransactions
      .filter((transaction) => transaction.type === "income")
      .reduce((total, transaction) => total + transaction.amount, 0);
  }, [postedTransactions]);

  const totalExpense = useMemo(() => {
    return postedTransactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((total, transaction) => total + transaction.amount, 0);
  }, [postedTransactions]);

  const currentBalance = useMemo(() => {
    return profile.initialBalance + totalIncome - totalExpense;
  }, [profile.initialBalance, totalIncome, totalExpense]);

  function updateInitialBalance(value: number) {
    setProfile((currentProfile) => ({
      ...currentProfile,
      initialBalance: value,
    }));
  }

  function addTransaction(input: LocalFinanceTransactionInput) {
    const normalizedInput = normalizeTransactionInput(input);

    if (!isValidTransactionInput(normalizedInput)) {
      return;
    }

    const contractId = crypto.randomUUID();
    const createdAt = getTransactionCreatedAt(getContractAnchorDate(normalizedInput));
    const contract = buildContract(contractId, normalizedInput, createdAt);
    const newOccurrences = buildOccurrences(contractId, normalizedInput);

    setProfile((currentProfile) => ({
      ...currentProfile,
      transactions: [contract, ...currentProfile.transactions],
      occurrences: [...currentProfile.occurrences, ...newOccurrences],
    }));
  }

  /**
   * Espelha TransactionService.UpdateAsync (apps/api): edita os campos do contrato e, quando
   * o kind resolvido é Single, propaga Amount/DueDate para a única Occurrence associada — a
   * mesma correção de "Bug 1" da Fase C (contrato e ocorrência são a mesma coisa para Single).
   * Para Installment/Recurring, as Occurrences existentes permanecem intocadas.
   */
  function updateTransaction(input: UpdateTransactionInput) {
    setProfile((currentProfile) => {
      const occurrence = currentProfile.occurrences.find(
        (candidate) => candidate.id === input.id,
      );

      if (!occurrence) {
        return currentProfile;
      }

      const contract = currentProfile.transactions.find(
        (candidate) => candidate.id === occurrence.transactionId,
      );

      if (!contract) {
        return currentProfile;
      }

      const backendKind = input.transactionKind
        ? getBackendTransactionKind(input.transactionKind)
        : contract.transactionKind;

      const transactionDate =
        input.installmentStartDate ??
        input.recurrenceStartDate ??
        input.transactionDate ??
        contract.transactionDate;

      const recurrenceMode = input.recurrenceMode ?? inferContractRecurrenceMode(contract);

      const updatedContract: LocalTransactionContract = {
        ...contract,
        title: input.title.trim(),
        amount: input.amount,
        type: input.type === "income" ? "Income" : "Expense",
        category: input.category.trim().toLowerCase(),
        transactionKind: backendKind,
        transactionDate,
        installmentCount:
          backendKind === "Installment"
            ? input.installmentCount ?? contract.installmentCount
            : null,
        isRecurring: backendKind === "Recurring",
        recurrenceStartDate:
          backendKind === "Recurring"
            ? input.recurrenceStartDate ?? contract.recurrenceStartDate
            : null,
        recurrenceEndDate:
          backendKind === "Recurring" && recurrenceMode === "until-date"
            ? input.recurrenceEndDate ?? contract.recurrenceEndDate
            : null,
        recurrenceDay:
          backendKind === "Recurring" ? input.recurrenceDay ?? contract.recurrenceDay : null,
        recurrenceMonths:
          backendKind === "Recurring" && recurrenceMode === "for-months"
            ? input.recurrenceMonths ?? contract.recurrenceMonths
            : null,
      };

      const updatedOccurrences =
        backendKind === "Single"
          ? currentProfile.occurrences.map((candidate) =>
              candidate.transactionId === contract.id
                ? { ...candidate, amount: input.amount, dueDate: transactionDate }
                : candidate,
            )
          : currentProfile.occurrences;

      return {
        ...currentProfile,
        transactions: currentProfile.transactions.map((candidate) =>
          candidate.id === contract.id ? updatedContract : candidate,
        ),
        occurrences: updatedOccurrences,
      };
    });
  }

  /** Exclusão do contrato inteiro — cascade nas suas Occurrences, espelhando DeleteAsync. */
  function removeTransaction(id: string) {
    setProfile((currentProfile) => ({
      ...currentProfile,
      transactions: currentProfile.transactions.filter((transaction) => transaction.id !== id),
      occurrences: currentProfile.occurrences.filter(
        (occurrence) => occurrence.transactionId !== id,
      ),
    }));
  }

  function updateOccurrence(input: UpdateOccurrenceInput) {
    setProfile((currentProfile) => ({
      ...currentProfile,
      occurrences: currentProfile.occurrences.map((occurrence) =>
        occurrence.id === input.id
          ? { ...occurrence, amount: input.amount, dueDate: input.dueDate, isCustomized: true }
          : occurrence,
      ),
    }));
  }

  function markOccurrencePaid(id: string) {
    setProfile((currentProfile) => ({
      ...currentProfile,
      occurrences: currentProfile.occurrences.map((occurrence) =>
        occurrence.id === id
          ? { ...occurrence, status: "Paid", paidAt: new Date().toISOString() }
          : occurrence,
      ),
    }));
  }

  function markOccurrencePending(id: string) {
    setProfile((currentProfile) => ({
      ...currentProfile,
      occurrences: currentProfile.occurrences.map((occurrence) =>
        occurrence.id === id ? { ...occurrence, status: "Pending", paidAt: null } : occurrence,
      ),
    }));
  }

  /** Soft-delete — igual ao backend, não remove a linha, só marca Status = Cancelled. */
  function cancelOccurrence(id: string) {
    setProfile((currentProfile) => ({
      ...currentProfile,
      occurrences: currentProfile.occurrences.map((occurrence) =>
        occurrence.id === id ? { ...occurrence, status: "Cancelled" } : occurrence,
      ),
    }));
  }

  return {
    profile,
    transactions,
    postedTransactions,
    initialBalance: profile.initialBalance,
    totalIncome,
    totalExpense,
    currentBalance,
    isLoaded,
    updateInitialBalance,
    addTransaction,
    updateTransaction,
    removeTransaction,
    updateOccurrence,
    markOccurrencePaid,
    markOccurrencePending,
    cancelOccurrence,
  };
}
