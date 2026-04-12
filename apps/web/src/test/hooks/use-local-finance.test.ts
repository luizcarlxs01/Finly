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

import type {
  LocalFinanceProfile,
  Transaction,
  TransactionRecurrenceMode,
} from "@/types/finance";
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

function createRecurringTemplateTransaction(
  overrides: Partial<Transaction> = {},
): Transaction {
  return createStoredTransaction({
    id: "recurring-template-1",
    title: "Academia",
    amount: 90,
    category: "saude",
    transactionKind: "recurring-template",
    isRecurring: true,
    recurrenceType: "monthly",
    recurrenceMode: "indefinite",
    recurrenceDay: 5,
    recurrenceStartDate: "2026-02-05",
    createdAt: "2026-04-15T12:00:00.000Z",
    ...overrides,
  });
}

function mockRandomUUIDSequence(ids: string[]) {
  const queue = [...ids];

  return vi.spyOn(globalThis.crypto, "randomUUID").mockImplementation(() => {
    const nextId = queue.shift();

    if (!nextId) {
      throw new Error("UUID sequence exhausted during test");
    }

    return nextId;
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

  it("deve criar preview com automacao aplicada sem mutar o estado persistido", async () => {
    const randomUuidSpy = mockRandomUUIDSequence([
      "preview-instance-1",
      "preview-instance-2",
      "preview-instance-3",
    ]);

    const { result } = await renderLoadedHook();

    act(() => {
      result.current.updateInitialBalance(1000);
    });

    await waitFor(() => {
      expect(window.localStorage.getItem(LOCAL_STORAGE_KEY)).toBe(
        JSON.stringify({
          initialBalance: 1000,
          transactions: [],
        }),
      );
    });

    const previewProfile = result.current.createPreviewProfile({
      title: "  Assinatura streaming  ",
      amount: 80,
      type: "expense",
      category: "  LAZER  ",
      transactionKind: "recurring-template",
      isRecurring: true,
      recurrenceType: "monthly",
      recurrenceMode: "indefinite",
      recurrenceDay: 10,
      recurrenceStartDate: "2026-02-10",
    });

    expect(randomUuidSpy).toHaveBeenCalledTimes(3);
    expect(previewProfile).not.toBeNull();
    expect(previewProfile).toMatchObject({
      initialBalance: 1000,
    });
    expect(previewProfile?.transactions).toHaveLength(4);
    expect(
      previewProfile?.transactions.find((transaction) => transaction.id === "preview-transaction"),
    ).toMatchObject({
      title: "Assinatura streaming",
      amount: 80,
      category: "lazer",
      transactionKind: "recurring-template",
    });

    const previewInstances =
      previewProfile?.transactions.filter(
        (transaction) => transaction.transactionKind === "recurring-instance",
      ) ?? [];

    expect(previewInstances).toHaveLength(3);
    expect(previewInstances.map((transaction) => transaction.occurrenceDate)).toEqual([
      "2026-04-10",
      "2026-03-10",
      "2026-02-10",
    ]);
    expect(previewInstances.every((transaction) => transaction.sourceId === "preview-transaction")).toBe(
      true,
    );

    expect(result.current.transactions).toEqual([]);
    expect(result.current.postedTransactions).toEqual([]);
    expect(result.current.currentBalance).toBe(1000);
    expect(window.localStorage.getItem(LOCAL_STORAGE_KEY)).toBe(
      JSON.stringify({
        initialBalance: 1000,
        transactions: [],
      }),
    );
  });

  it("deve retornar null no preview quando os dados forem invalidos", async () => {
    const randomUuidSpy = vi.spyOn(globalThis.crypto, "randomUUID");
    const { result } = await renderLoadedHook();

    const previewProfile = result.current.createPreviewProfile({
      title: "   ",
      amount: 0,
      type: "expense",
      category: "geral",
      transactionKind: "single",
      transactionDate: "2026-04-15",
      isRecurring: false,
      recurrenceType: null,
      recurrenceDay: null,
      recurrenceStartDate: null,
    });

    expect(previewProfile).toBeNull();
    expect(randomUuidSpy).not.toHaveBeenCalled();
    expect(result.current.transactions).toEqual([]);
  });

  it("deve gerar recorrencias, expor a proxima ocorrencia e manter postedTransactions sem o template", async () => {
    const randomUuidSpy = mockRandomUUIDSequence([
      "recurring-template-id",
      "recurring-instance-1",
      "recurring-instance-2",
      "recurring-instance-3",
    ]);

    const { result } = await renderLoadedHook();

    act(() => {
      result.current.updateInitialBalance(500);
    });

    act(() => {
      result.current.addTransaction({
        title: "Academia",
        amount: 90,
        type: "expense",
        category: "saude",
        transactionKind: "recurring-template",
        isRecurring: true,
        recurrenceType: "monthly",
        recurrenceMode: "indefinite",
        recurrenceDay: 5,
        recurrenceStartDate: "2026-02-05",
      });
    });

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(4);
    });

    expect(randomUuidSpy).toHaveBeenCalledTimes(4);

    const recurringTemplate = result.current.transactions.find(
      (transaction) => transaction.id === "recurring-template-id",
    );

    const recurringInstances = result.current.transactions.filter(
      (transaction) => transaction.transactionKind === "recurring-instance",
    );

    expect(recurringTemplate).toMatchObject({
      title: "Academia",
      transactionKind: "recurring-template",
      recurrenceDay: 5,
      recurrenceStartDate: "2026-02-05",
    });
    expect(recurringInstances).toHaveLength(3);
    expect(recurringInstances.map((transaction) => transaction.occurrenceDate)).toEqual([
      "2026-04-05",
      "2026-03-05",
      "2026-02-05",
    ]);
    expect(recurringInstances.every((transaction) => transaction.sourceId === "recurring-template-id")).toBe(
      true,
    );
    expect(result.current.postedTransactions).toHaveLength(3);
    expect(result.current.totalExpense).toBe(270);
    expect(result.current.currentBalance).toBe(230);
    expect(result.current.getNextRecurringOccurrence(recurringTemplate!)).toBe(
      "2026-05-05",
    );
    expect(
      result.current.getNextRecurringOccurrence(recurringInstances[0]),
    ).toBe("2026-05-05");
    expect(
      result.current.getNextRecurringOccurrence(createStoredTransaction()),
    ).toBeNull();
  });

  it("deve editar uma serie recorrente a partir de uma instancia gerada e regenerar os itens relacionados", async () => {
    const randomUuidSpy = mockRandomUUIDSequence([
      "recurring-template-id",
      "recurring-instance-1",
      "recurring-instance-2",
      "recurring-instance-3",
      "regenerated-instance-1",
      "regenerated-instance-2",
      "regenerated-instance-3",
    ]);

    const { result } = await renderLoadedHook();

    act(() => {
      result.current.addTransaction({
        title: "Academia",
        amount: 90,
        type: "expense",
        category: "saude",
        transactionKind: "recurring-template",
        isRecurring: true,
        recurrenceType: "monthly",
        recurrenceMode: "indefinite",
        recurrenceDay: 5,
        recurrenceStartDate: "2026-02-05",
      });
    });

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(4);
    });

    const generatedInstance = result.current.transactions.find(
      (transaction) =>
        transaction.transactionKind === "recurring-instance" &&
        transaction.occurrenceDate === "2026-03-05",
    );

    expect(generatedInstance).toBeDefined();

    act(() => {
      result.current.updateTransaction({
        id: generatedInstance!.id,
        title: "  Academia premium  ",
        amount: 120,
        type: "expense",
        category: "  SERVICOS  ",
        transactionKind: "single",
        isRecurring: false,
        recurrenceType: null,
        recurrenceMode: "indefinite" satisfies TransactionRecurrenceMode,
        recurrenceDay: 5,
        recurrenceStartDate: "2026-02-05",
      });
    });

    await waitFor(() => {
      const template = result.current.transactions.find(
        (transaction) => transaction.id === "recurring-template-id",
      );

      expect(template).toMatchObject({
        title: "Academia premium",
        amount: 120,
        category: "servicos",
        transactionKind: "recurring-template",
      });
    });

    expect(randomUuidSpy).toHaveBeenCalledTimes(7);
    expect(result.current.transactions).toHaveLength(4);
    expect(
      result.current.transactions.some(
        (transaction) =>
          transaction.id === "recurring-instance-1" ||
          transaction.id === "recurring-instance-2" ||
          transaction.id === "recurring-instance-3",
      ),
    ).toBe(false);

    const regeneratedInstances = result.current.transactions.filter(
      (transaction) => transaction.transactionKind === "recurring-instance",
    );

    expect(regeneratedInstances.map((transaction) => transaction.id)).toEqual([
      "regenerated-instance-3",
      "regenerated-instance-2",
      "regenerated-instance-1",
    ]);
    expect(regeneratedInstances.every((transaction) => transaction.title === "Academia premium")).toBe(
      true,
    );
    expect(regeneratedInstances.every((transaction) => transaction.amount === 120)).toBe(
      true,
    );
    expect(regeneratedInstances.every((transaction) => transaction.category === "servicos")).toBe(
      true,
    );
    expect(result.current.totalExpense).toBe(360);
    expect(
      result.current.getNextRecurringOccurrence(regeneratedInstances[0]),
    ).toBe("2026-05-05");
  });

  it("deve gerar parcelamentos e remover a serie inteira ao excluir uma instancia gerada", async () => {
    const randomUuidSpy = mockRandomUUIDSequence([
      "installment-template-id",
      "installment-instance-1",
      "installment-instance-2",
      "installment-instance-3",
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

    expect(randomUuidSpy).toHaveBeenCalledTimes(4);

    const installmentInstances = result.current.transactions.filter(
      (transaction) => transaction.transactionKind === "installment-instance",
    );

    expect(installmentInstances).toHaveLength(3);
    expect(installmentInstances.map((transaction) => transaction.occurrenceDate)).toEqual([
      "2026-04-10",
      "2026-03-10",
      "2026-02-10",
    ]);
    expect(installmentInstances.map((transaction) => transaction.installmentIndex)).toEqual([
      3,
      2,
      1,
    ]);
    expect(result.current.totalExpense).toBe(750);
    expect(result.current.currentBalance).toBe(250);

    act(() => {
      result.current.removeTransaction("installment-instance-2");
    });

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(0);
    });

    expect(
      result.current.transactions.find(
        (transaction) => transaction.id === "installment-template-id",
      ),
    ).toBeUndefined();
    expect(result.current.postedTransactions).toEqual([]);
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

  it("deve resolver a proxima recorrencia a partir de uma instancia legada com sourceId", async () => {
    const storedProfile = createStoredProfile({
      transactions: [
        createRecurringTemplateTransaction({
          id: "legacy-template",
          recurrenceDay: 12,
          recurrenceStartDate: "2026-03-12",
          lastGeneratedAt: "2026-04-12T12:00:00.000Z",
        }),
        createStoredTransaction({
          id: "legacy-instance",
          title: "Academia",
          amount: 90,
          category: "saude",
          transactionKind: "recurring-instance",
          sourceId: "legacy-template",
          occurrenceDate: "2026-04-12",
          recurringSourceId: "legacy-template",
          recurringOccurrenceDate: "2026-04-12",
          createdAt: "2026-04-12T12:00:00.000Z",
        }),
      ],
    });

    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(storedProfile));

    const { result } = await renderLoadedHook();

    const legacyInstance = result.current.transactions.find(
      (transaction) => transaction.id === "legacy-instance",
    );

    expect(result.current.getNextRecurringOccurrence(legacyInstance!)).toBe(
      "2026-05-12",
    );
  });
});
