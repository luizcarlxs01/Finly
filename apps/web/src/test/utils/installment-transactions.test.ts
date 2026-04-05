import { describe, expect, it, vi } from "vitest";

import { synchronizeInstallmentTransactions } from "@/utils/installment-transactions";
import type { Transaction } from "@/types/transaction";

function createTransaction(
  overrides: Partial<Transaction> = {},
): Transaction {
  return {
    id: "tx-1",
    title: "Transação teste",
    amount: 100,
    type: "expense",
    category: "general",
    createdAt: "2026-04-01T12:00:00.000Z",
    transactionKind: "installment-template",
    installmentCount: 3,
    installmentStartDate: "2026-01-10",
    sourceId: null,
    occurrenceDate: null,
    installmentIndex: null,
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
    ...overrides,
  } as Transaction;
}

describe("installment-transactions", () => {
  it("deve gerar parcelas até a data de referência", () => {
    const randomUuidSpy = vi
      .spyOn(crypto, "randomUUID")
      .mockReturnValueOnce("instance-1")
      .mockReturnValueOnce("instance-2")
      .mockReturnValueOnce("instance-3");

    const transactions: Transaction[] = [
      createTransaction({
        id: "installment-template-1",
        title: "Notebook",
        amount: 300,
        installmentCount: 3,
        installmentStartDate: "2026-01-10",
      }),
    ];

    const result = synchronizeInstallmentTransactions({
      transactions,
      referenceDate: "2026-03-15",
    });

    const generatedInstances = result.transactions.filter(
      (transaction) => transaction.transactionKind === "installment-instance",
    );

    expect(result.generatedCount).toBe(3);
    expect(generatedInstances).toHaveLength(3);
    expect(generatedInstances.map((item) => item.occurrenceDate)).toEqual([
      "2026-01-10",
      "2026-02-10",
      "2026-03-10",
    ]);
    expect(generatedInstances.map((item) => item.installmentIndex)).toEqual([
      1,
      2,
      3,
    ]);

    randomUuidSpy.mockRestore();
  });

  it("não deve gerar parcelas se a série começar no futuro", () => {
    const transactions: Transaction[] = [
      createTransaction({
        id: "future-installment",
        title: "Curso",
        installmentCount: 4,
        installmentStartDate: "2026-06-10",
      }),
    ];

    const result = synchronizeInstallmentTransactions({
      transactions,
      referenceDate: "2026-04-15",
    });

    expect(result.generatedCount).toBe(0);
    expect(
      result.transactions.filter(
        (transaction) => transaction.transactionKind === "installment-instance",
      ),
    ).toHaveLength(0);
  });

  it("não deve gerar além da quantidade de parcelas", () => {
    const randomUuidSpy = vi
      .spyOn(crypto, "randomUUID")
      .mockReturnValueOnce("instance-1")
      .mockReturnValueOnce("instance-2");

    const transactions: Transaction[] = [
      createTransaction({
        id: "limited-installment",
        title: "Celular",
        installmentCount: 2,
        installmentStartDate: "2026-01-05",
      }),
    ];

    const result = synchronizeInstallmentTransactions({
      transactions,
      referenceDate: "2026-06-15",
    });

    const generatedInstances = result.transactions.filter(
      (transaction) => transaction.transactionKind === "installment-instance",
    );

    expect(result.generatedCount).toBe(2);
    expect(generatedInstances).toHaveLength(2);
    expect(generatedInstances.map((item) => item.occurrenceDate)).toEqual([
      "2026-01-05",
      "2026-02-05",
    ]);

    randomUuidSpy.mockRestore();
  });

  it("não deve duplicar instâncias já existentes", () => {
    const randomUuidSpy = vi
      .spyOn(crypto, "randomUUID")
      .mockReturnValueOnce("instance-1")
      .mockReturnValueOnce("instance-2");

    const transactions: Transaction[] = [
      createTransaction({
        id: "installment-template-1",
        title: "Notebook",
        amount: 300,
        installmentCount: 3,
        installmentStartDate: "2026-01-10",
      }),
      createTransaction({
        id: "existing-installment-instance",
        title: "Notebook",
        amount: 300,
        type: "expense",
        transactionKind: "installment-instance",
        sourceId: "installment-template-1",
        occurrenceDate: "2026-02-10",
        installmentIndex: 2,
        installmentCount: 3,
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
      }),
    ];

    const result = synchronizeInstallmentTransactions({
      transactions,
      referenceDate: "2026-03-15",
    });

    const generatedInstances = result.transactions
      .filter((transaction) => transaction.transactionKind === "installment-instance")
      .map((transaction) => transaction.occurrenceDate)
      .sort();

    expect(result.generatedCount).toBe(2);
    expect(generatedInstances).toEqual([
      "2026-01-10",
      "2026-02-10",
      "2026-03-10",
    ]);

    randomUuidSpy.mockRestore();
  });

  it("deve respeitar mês curto ao avançar parcelas", () => {
    const randomUuidSpy = vi
      .spyOn(crypto, "randomUUID")
      .mockReturnValueOnce("instance-1")
      .mockReturnValueOnce("instance-2")
      .mockReturnValueOnce("instance-3");

    const transactions: Transaction[] = [
      createTransaction({
        id: "installment-short-month",
        title: "Compra",
        installmentCount: 3,
        installmentStartDate: "2026-01-31",
      }),
    ];

    const result = synchronizeInstallmentTransactions({
      transactions,
      referenceDate: "2026-03-31",
    });

    const generatedInstances = result.transactions
      .filter((transaction) => transaction.transactionKind === "installment-instance")
      .map((transaction) => transaction.occurrenceDate);

    expect(generatedInstances).toEqual([
      "2026-01-31",
      "2026-02-28",
      "2026-03-31",
    ]);

    randomUuidSpy.mockRestore();
  });

  it("deve preencher installmentIndex e installmentCount corretamente nas instâncias", () => {
    const randomUuidSpy = vi
      .spyOn(crypto, "randomUUID")
      .mockReturnValueOnce("instance-1")
      .mockReturnValueOnce("instance-2")
      .mockReturnValueOnce("instance-3");

    const transactions: Transaction[] = [
      createTransaction({
        id: "installment-template-2",
        title: "Monitor",
        installmentCount: 3,
        installmentStartDate: "2026-01-10",
      }),
    ];

    const result = synchronizeInstallmentTransactions({
      transactions,
      referenceDate: "2026-03-20",
    });

    const generatedInstances = result.transactions.filter(
      (transaction) => transaction.transactionKind === "installment-instance",
    );

    expect(generatedInstances.map((item) => item.installmentIndex)).toEqual([
      1,
      2,
      3,
    ]);
    expect(generatedInstances.every((item) => item.installmentCount === 3)).toBe(
      true,
    );

    randomUuidSpy.mockRestore();
  });
});
