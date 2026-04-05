import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LocalFinanceProfile, Transaction } from "@/types/finance";
import { useLocalFinance } from "@/hooks/use-local-finance";

const LOCAL_STORAGE_KEY = "finly:local-finance";

function createStoredTransaction(
  overrides: Partial<Transaction> = {},
): Transaction {
  return {
    id: "tx-1",
    title: "Transacao teste",
    amount: 100,
    type: "expense",
    category: "geral",
    transactionKind: "single",
    sourceId: null,
    occurrenceDate: null,
    installmentIndex: null,
    installmentCount: null,
    installmentStartDate: null,
    recurringSourceId: null,
    recurringOccurrenceDate: null,
    isRecurring: false,
    recurrenceType: null,
    recurrenceMode: null,
    recurrenceDay: null,
    recurrenceStartDate: null,
    recurrenceEndDate: null,
    recurrenceMonths: null,
    lastGeneratedAt: null,
    createdAt: "2026-04-01T12:00:00.000Z",
    ...overrides,
  };
}

function createStoredProfile(
  overrides: Partial<LocalFinanceProfile> = {},
): LocalFinanceProfile {
  return {
    initialBalance: 0,
    transactions: [],
    ...overrides,
  };
}

async function renderLoadedHook() {
  const rendered = renderHook(() => useLocalFinance());

  await waitFor(() => {
    expect(rendered.result.current.isLoaded).toBe(true);
  });

  return rendered;
}

describe("useLocalFinance", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("deve hidratar o estado inicial a partir do localStorage", async () => {
    const storedProfile = createStoredProfile({
      initialBalance: 500,
      transactions: [
        createStoredTransaction({
          id: "older-income",
          title: "Salario",
          type: "income",
          amount: 1500,
          createdAt: "2026-04-01T12:00:00.000Z",
        }),
        createStoredTransaction({
          id: "newer-expense",
          title: "Mercado",
          type: "expense",
          amount: 200,
          createdAt: "2026-04-03T12:00:00.000Z",
        }),
      ],
    });

    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(storedProfile));

    const { result } = await renderLoadedHook();

    expect(result.current.initialBalance).toBe(500);
    expect(result.current.transactions).toHaveLength(2);
    expect(result.current.transactions.map((transaction) => transaction.id)).toEqual([
      "newer-expense",
      "older-income",
    ]);
    expect(result.current.postedTransactions).toHaveLength(2);
    expect(result.current.totalIncome).toBe(1500);
    expect(result.current.totalExpense).toBe(200);
    expect(result.current.currentBalance).toBe(1800);
    expect(result.current.profile).toEqual({
      initialBalance: 500,
      transactions: result.current.transactions,
    });
  });

  it("deve iniciar com valores padrao quando o storage estiver vazio", async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");

    const { result } = await renderLoadedHook();

    expect(result.current.profile).toEqual({
      initialBalance: 0,
      transactions: [],
    });
    expect(result.current.transactions).toEqual([]);
    expect(result.current.postedTransactions).toEqual([]);
    expect(result.current.totalIncome).toBe(0);
    expect(result.current.totalExpense).toBe(0);
    expect(result.current.currentBalance).toBe(0);

    await waitFor(() => {
      expect(setItemSpy).toHaveBeenCalledWith(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          initialBalance: 0,
          transactions: [],
        }),
      );
    });
  });

  it("deve usar o perfil padrao quando encontrar JSON invalido no storage", async () => {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, "{invalido");

    const { result } = await renderLoadedHook();

    expect(result.current.profile).toEqual({
      initialBalance: 0,
      transactions: [],
    });
    expect(result.current.isLoaded).toBe(true);

    await waitFor(() => {
      expect(window.localStorage.getItem(LOCAL_STORAGE_KEY)).toBe(
        JSON.stringify({
          initialBalance: 0,
          transactions: [],
        }),
      );
    });
  });

  it("deve persistir criacao, edicao e remocao mantendo os dados retornados consistentes", async () => {
    const randomUuidSpy = vi
      .spyOn(globalThis.crypto, "randomUUID")
      .mockReturnValue("generated-transaction-id");

    const { result } = await renderLoadedHook();

    act(() => {
      result.current.updateInitialBalance(1000);
    });

    act(() => {
      result.current.addTransaction({
        title: "  Mercado  ",
        amount: 250,
        type: "expense",
        category: "  LAZER  ",
        transactionKind: "single",
        transactionDate: "2026-04-10",
        isRecurring: false,
        recurrenceType: null,
        recurrenceDay: null,
        recurrenceStartDate: null,
      });
    });

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(1);
    });

    expect(randomUuidSpy).toHaveBeenCalled();
    expect(result.current.transactions[0]).toMatchObject({
      id: "generated-transaction-id",
      title: "Mercado",
      amount: 250,
      type: "expense",
      category: "lazer",
      transactionKind: "single",
    });
    expect(result.current.postedTransactions).toHaveLength(1);
    expect(result.current.totalIncome).toBe(0);
    expect(result.current.totalExpense).toBe(250);
    expect(result.current.currentBalance).toBe(750);

    act(() => {
      result.current.updateTransaction({
        id: "generated-transaction-id",
        title: "Mercado ajustado",
        amount: 300,
        type: "income",
        category: "SALARIO",
        transactionKind: "single",
        transactionDate: "2026-04-12",
        isRecurring: false,
        recurrenceType: null,
        recurrenceDay: null,
        recurrenceStartDate: null,
      });
    });

    await waitFor(() => {
      expect(result.current.transactions[0]).toMatchObject({
        id: "generated-transaction-id",
        title: "Mercado ajustado",
        amount: 300,
        type: "income",
        category: "salario",
      });
    });

    expect(result.current.totalIncome).toBe(300);
    expect(result.current.totalExpense).toBe(0);
    expect(result.current.currentBalance).toBe(1300);

    await waitFor(() => {
      const persistedProfile = JSON.parse(
        window.localStorage.getItem(LOCAL_STORAGE_KEY) ?? "null",
      ) as LocalFinanceProfile;

      expect(persistedProfile.initialBalance).toBe(1000);
      expect(persistedProfile.transactions).toHaveLength(1);
      expect(persistedProfile.transactions[0]).toMatchObject({
        id: "generated-transaction-id",
        title: "Mercado ajustado",
        amount: 300,
        type: "income",
        category: "salario",
      });
    });

    act(() => {
      result.current.removeTransaction("generated-transaction-id");
    });

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(0);
    });

    expect(result.current.postedTransactions).toEqual([]);
    expect(result.current.totalIncome).toBe(0);
    expect(result.current.totalExpense).toBe(0);
    expect(result.current.currentBalance).toBe(1000);

    await waitFor(() => {
      expect(window.localStorage.getItem(LOCAL_STORAGE_KEY)).toBe(
        JSON.stringify({
          initialBalance: 1000,
          transactions: [],
        }),
      );
    });
  });
});
