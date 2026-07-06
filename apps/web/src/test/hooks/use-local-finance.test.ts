import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/utils/recurring-transactions", async () => {
  const actual =
    await vi.importActual<typeof import("@/utils/recurring-transactions")>(
      "@/utils/recurring-transactions",
    );

  return {
    ...actual,
    getTodayDateValue: () => "2026-04-15",
  };
});

import type { LocalFinanceProfile } from "@/types/local-finance-profile";
import { useLocalFinance } from "@/hooks/use-local-finance";

const LOCAL_STORAGE_KEY = "finly:local-finance";

function createStoredProfile(
  overrides: Partial<LocalFinanceProfile> = {},
): LocalFinanceProfile {
  return {
    initialBalance: 0,
    transactions: [],
    occurrences: [],
    ...overrides,
  };
}

function mockRandomUUIDSequence(ids: string[]) {
  const queue = [...ids];

  return vi.spyOn(globalThis.crypto, "randomUUID").mockImplementation(() => {
    const nextId = queue.shift();

    if (!nextId) {
      throw new Error("UUID sequence exhausted during test");
    }

    return nextId as ReturnType<typeof globalThis.crypto.randomUUID>;
  });
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
        {
          id: "contract-1",
          title: "Salario",
          amount: 1500,
          type: "Income",
          category: "salario",
          transactionDate: "2026-04-01",
          createdAt: "2026-04-01T12:00:00.000Z",
          transactionKind: "Single",
          sourceId: null,
          installmentCount: null,
          isRecurring: false,
          recurrenceStartDate: null,
          recurrenceEndDate: null,
          recurrenceDay: null,
          recurrenceMonths: null,
        },
      ],
      occurrences: [
        {
          id: "occ-1",
          transactionId: "contract-1",
          installmentIndex: null,
          dueDate: "2026-04-01",
          amount: 1500,
          status: "Paid",
          paidAt: "2026-04-01T12:00:00.000Z",
          isCustomized: false,
          createdAt: "2026-04-01T12:00:00.000Z",
        },
      ],
    });

    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(storedProfile));

    const { result } = await renderLoadedHook();

    expect(result.current.initialBalance).toBe(500);
    expect(result.current.transactions).toHaveLength(1);
    expect(result.current.transactions[0]).toMatchObject({
      id: "occ-1",
      title: "Salario",
      amount: 1500,
      type: "income",
      occurrenceStatus: "paid",
    });
    expect(result.current.postedTransactions).toHaveLength(1);
    expect(result.current.totalIncome).toBe(1500);
    expect(result.current.totalExpense).toBe(0);
    expect(result.current.currentBalance).toBe(2000);
  });

  it("deve iniciar com valores padrao quando o storage estiver vazio", async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");

    const { result } = await renderLoadedHook();

    expect(result.current.transactions).toEqual([]);
    expect(result.current.postedTransactions).toEqual([]);
    expect(result.current.totalIncome).toBe(0);
    expect(result.current.totalExpense).toBe(0);
    expect(result.current.currentBalance).toBe(0);

    await waitFor(() => {
      expect(setItemSpy).toHaveBeenCalledWith(
        LOCAL_STORAGE_KEY,
        JSON.stringify({ initialBalance: 0, transactions: [], occurrences: [] }),
      );
    });
  });

  it("deve usar o perfil padrao quando encontrar JSON invalido no storage", async () => {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, "{invalido");

    const { result } = await renderLoadedHook();

    expect(result.current.isLoaded).toBe(true);
    expect(result.current.transactions).toEqual([]);

    await waitFor(() => {
      expect(window.localStorage.getItem(LOCAL_STORAGE_KEY)).toBe(
        JSON.stringify({ initialBalance: 0, transactions: [], occurrences: [] }),
      );
    });
  });

  it("deve criar uma transacao Single gerando 1 occurrence e refletir no saldo", async () => {
    const randomUuidSpy = mockRandomUUIDSequence(["contract-1", "occurrence-1"]);

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

    expect(randomUuidSpy).toHaveBeenCalledTimes(2);
    expect(result.current.transactions[0]).toMatchObject({
      id: "occurrence-1",
      occurrenceId: "occurrence-1",
      sourceId: "contract-1",
      title: "Mercado",
      amount: 250,
      type: "expense",
      category: "lazer",
      transactionKind: "single",
      occurrenceStatus: "paid",
    });
    expect(result.current.totalExpense).toBe(250);
    expect(result.current.currentBalance).toBe(750);
  });

  it("deve criar uma transacao parcelada gerando N occurrences com status correto", async () => {
    mockRandomUUIDSequence([
      "installment-contract",
      "occ-1",
      "occ-2",
      "occ-3",
      "occ-4",
    ]);

    const { result } = await renderLoadedHook();

    act(() => {
      result.current.addTransaction({
        title: "Notebook",
        amount: 250,
        type: "expense",
        category: "compras",
        transactionKind: "installment-template",
        installmentCount: 4,
        installmentStartDate: "2026-02-10",
        isRecurring: false,
        recurrenceType: null,
        recurrenceDay: null,
        recurrenceStartDate: null,
      });
    });

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(4);
    });

    const sorted = [...result.current.transactions].sort(
      (left, right) => (left.installmentIndex ?? 0) - (right.installmentIndex ?? 0),
    );

    expect(sorted.map((t) => t.occurrenceDate)).toEqual([
      "2026-02-10",
      "2026-03-10",
      "2026-04-10",
      "2026-05-10",
    ]);
    expect(sorted.map((t) => t.occurrenceStatus)).toEqual([
      "paid",
      "paid",
      "paid",
      "pending",
    ]);
    expect(result.current.totalExpense).toBe(750);
  });

  it("deve editar uma transacao Single propagando Amount/DueDate para a unica occurrence", async () => {
    mockRandomUUIDSequence(["contract-1", "occurrence-1"]);

    const { result } = await renderLoadedHook();

    act(() => {
      result.current.updateInitialBalance(1000);
    });

    act(() => {
      result.current.addTransaction({
        title: "Freela",
        amount: 400,
        type: "income",
        category: "salario",
        transactionKind: "single",
        transactionDate: "2026-04-05",
        isRecurring: false,
        recurrenceType: null,
        recurrenceDay: null,
        recurrenceStartDate: null,
      });
    });

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(1);
    });

    expect(result.current.currentBalance).toBe(1400);

    act(() => {
      result.current.updateTransaction({
        id: "occurrence-1",
        title: "Freela ajustado",
        amount: 999,
        type: "income",
        category: "salario",
        transactionKind: "single",
        transactionDate: "2026-04-05",
        isRecurring: false,
        recurrenceType: null,
        recurrenceDay: null,
        recurrenceStartDate: null,
      });
    });

    await waitFor(() => {
      expect(result.current.currentBalance).toBe(1999);
    });

    expect(result.current.transactions[0]).toMatchObject({
      title: "Freela ajustado",
      amount: 999,
    });
  });

  it("nao deve alterar as occurrences existentes ao editar o contrato de uma Installment", async () => {
    mockRandomUUIDSequence([
      "installment-contract",
      "occ-1",
      "occ-2",
      "occ-3",
    ]);

    const { result } = await renderLoadedHook();

    act(() => {
      result.current.addTransaction({
        title: "Parcelada",
        amount: 150,
        type: "expense",
        category: "geral",
        transactionKind: "installment-template",
        installmentCount: 3,
        installmentStartDate: "2026-02-10",
        isRecurring: false,
        recurrenceType: null,
        recurrenceDay: null,
        recurrenceStartDate: null,
      });
    });

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(3);
    });

    const firstOccurrenceId = result.current.transactions[0].occurrenceId!;

    act(() => {
      result.current.updateTransaction({
        id: firstOccurrenceId,
        title: "Parcelada renomeada",
        amount: 150,
        type: "expense",
        category: "geral",
        transactionKind: "installment-instance",
        isRecurring: false,
        recurrenceType: null,
        recurrenceDay: null,
        recurrenceStartDate: null,
      });
    });

    await waitFor(() => {
      expect(result.current.transactions.every((t) => t.title === "Parcelada renomeada")).toBe(
        true,
      );
    });

    expect(result.current.transactions.map((t) => t.amount)).toEqual([150, 150, 150]);
  });

  it("deve marcar uma occurrence como paga e refletir no saldo", async () => {
    mockRandomUUIDSequence([
      "installment-contract",
      "occ-1",
      "occ-2",
      "occ-3",
      "occ-4",
    ]);

    const { result } = await renderLoadedHook();

    act(() => {
      result.current.addTransaction({
        title: "Notebook",
        amount: 250,
        type: "expense",
        category: "compras",
        transactionKind: "installment-template",
        installmentCount: 4,
        installmentStartDate: "2026-02-10",
        isRecurring: false,
        recurrenceType: null,
        recurrenceDay: null,
        recurrenceStartDate: null,
      });
    });

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(4);
    });

    expect(result.current.totalExpense).toBe(750);

    const pendingOccurrence = result.current.transactions.find(
      (t) => t.occurrenceStatus === "pending",
    )!;

    act(() => {
      result.current.markOccurrencePaid(pendingOccurrence.occurrenceId!);
    });

    await waitFor(() => {
      expect(result.current.totalExpense).toBe(1000);
    });

    act(() => {
      result.current.markOccurrencePending(pendingOccurrence.occurrenceId!);
    });

    await waitFor(() => {
      expect(result.current.totalExpense).toBe(750);
    });
  });

  it("deve editar data e valor de uma occurrence especifica marcando isCustomized", async () => {
    mockRandomUUIDSequence(["contract-1", "occurrence-1"]);

    const { result } = await renderLoadedHook();

    act(() => {
      result.current.addTransaction({
        title: "Mercado",
        amount: 200,
        type: "expense",
        category: "geral",
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

    act(() => {
      result.current.updateOccurrence({
        id: "occurrence-1",
        dueDate: "2026-04-20",
        amount: 350,
      });
    });

    await waitFor(() => {
      expect(result.current.transactions[0]).toMatchObject({
        amount: 350,
        occurrenceDate: "2026-04-20",
        isCustomized: true,
      });
    });
  });

  it("deve cancelar uma occurrence via soft-delete, removendo-a da lista e do saldo sem apagar as demais", async () => {
    mockRandomUUIDSequence([
      "installment-contract",
      "occ-1",
      "occ-2",
      "occ-3",
      "occ-4",
    ]);

    const { result } = await renderLoadedHook();

    act(() => {
      result.current.addTransaction({
        title: "Notebook",
        amount: 250,
        type: "expense",
        category: "compras",
        transactionKind: "installment-template",
        installmentCount: 4,
        installmentStartDate: "2026-02-10",
        isRecurring: false,
        recurrenceType: null,
        recurrenceDay: null,
        recurrenceStartDate: null,
      });
    });

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(4);
    });

    const paidOccurrence = result.current.transactions.find(
      (t) => t.occurrenceStatus === "paid",
    )!;

    act(() => {
      result.current.cancelOccurrence(paidOccurrence.occurrenceId!);
    });

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(3);
    });

    expect(
      result.current.transactions.some((t) => t.occurrenceId === paidOccurrence.occurrenceId),
    ).toBe(false);

    await waitFor(() => {
      const persistedProfile = JSON.parse(
        window.localStorage.getItem(LOCAL_STORAGE_KEY) ?? "null",
      ) as LocalFinanceProfile;

      expect(persistedProfile.occurrences).toHaveLength(4);
      expect(
        persistedProfile.occurrences.find((o) => o.id === paidOccurrence.occurrenceId)?.status,
      ).toBe("Cancelled");
    });
  });

  it("deve remover o contrato inteiro em cascade com todas as suas occurrences", async () => {
    mockRandomUUIDSequence([
      "installment-contract",
      "occ-1",
      "occ-2",
      "occ-3",
      "occ-4",
    ]);

    const { result } = await renderLoadedHook();

    act(() => {
      result.current.updateInitialBalance(1000);
    });

    act(() => {
      result.current.addTransaction({
        title: "Notebook",
        amount: 250,
        type: "expense",
        category: "compras",
        transactionKind: "installment-template",
        installmentCount: 4,
        installmentStartDate: "2026-02-10",
        isRecurring: false,
        recurrenceType: null,
        recurrenceDay: null,
        recurrenceStartDate: null,
      });
    });

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(4);
    });

    act(() => {
      result.current.removeTransaction("installment-contract");
    });

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(0);
    });

    expect(result.current.currentBalance).toBe(1000);

    await waitFor(() => {
      const persistedProfile = JSON.parse(
        window.localStorage.getItem(LOCAL_STORAGE_KEY) ?? "null",
      ) as LocalFinanceProfile;

      expect(persistedProfile.transactions).toHaveLength(0);
      expect(persistedProfile.occurrences).toHaveLength(0);
    });
  });
});
