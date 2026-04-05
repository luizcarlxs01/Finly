import { describe, expect, it, vi } from "vitest";

import {
  createMonthlyOccurrence,
  formatDateValue,
  getNextMonthlyOccurrenceAfter,
  getNextRecurringOccurrenceDate,
  parseDateValue,
  synchronizeRecurringTransactions,
} from "@/utils/recurring-transactions";
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
    transactionKind: "recurring-template",
    isRecurring: true,
    recurrenceType: "monthly",
    recurrenceMode: "indefinite",
    recurrenceDay: 10,
    recurrenceStartDate: "2026-01-10",
    recurrenceEndDate: null,
    recurrenceMonths: null,
    lastGeneratedAt: null,
    sourceId: null,
    occurrenceDate: null,
    recurringSourceId: null,
    recurringOccurrenceDate: null,
    installmentIndex: null,
    installmentCount: null,
    installmentStartDate: null,
    ...overrides,
  } as Transaction;
}

describe("recurring-transactions", () => {
  describe("parseDateValue", () => {
    it("deve converter uma data YYYY-MM-DD corretamente", () => {
      const date = parseDateValue("2026-04-10");

      expect(date).not.toBeNull();
      expect(formatDateValue(date!)).toBe("2026-04-10");
    });

    it("deve retornar null para valor inválido", () => {
      expect(parseDateValue("data-invalida")).toBeNull();
      expect(parseDateValue("")).toBeNull();
      expect(parseDateValue(undefined)).toBeNull();
    });
  });

  describe("createMonthlyOccurrence", () => {
    it("deve ajustar o dia para o último dia do mês quando necessário", () => {
      const occurrence = createMonthlyOccurrence(2026, 1, 31); // fevereiro/2026

      expect(formatDateValue(occurrence)).toBe("2026-02-28");
    });

    it("deve preservar o dia quando ele existir no mês", () => {
      const occurrence = createMonthlyOccurrence(2026, 3, 15); // abril/2026

      expect(formatDateValue(occurrence)).toBe("2026-04-15");
    });
  });

  describe("getNextMonthlyOccurrenceAfter", () => {
    it("deve avançar corretamente para o mês seguinte", () => {
      const current = new Date(2026, 0, 31, 12); // 31/01/2026
      const next = getNextMonthlyOccurrenceAfter(current, 31);

      expect(formatDateValue(next)).toBe("2026-02-28");
    });

    it("deve continuar respeitando mês curto em sequência", () => {
      const january = new Date(2026, 0, 31, 12);
      const february = getNextMonthlyOccurrenceAfter(january, 31);
      const march = getNextMonthlyOccurrenceAfter(february, 31);

      expect(formatDateValue(february)).toBe("2026-02-28");
      expect(formatDateValue(march)).toBe("2026-03-31");
    });
  });

  describe("getNextRecurringOccurrenceDate", () => {
    it("deve retornar a próxima ocorrência válida", () => {
      const transaction = createTransaction({
        recurrenceDay: 10,
        recurrenceStartDate: "2026-01-10",
        lastGeneratedAt: "2026-03-10T12:00:00.000Z",
      });

      const result = getNextRecurringOccurrenceDate(transaction, "2026-04-05");

      expect(result).toBe("2026-04-10");
    });

    it("deve retornar null quando a recorrência por meses já terminou", () => {
      const transaction = createTransaction({
        recurrenceMode: "for-months",
        recurrenceMonths: 3,
        recurrenceStartDate: "2026-01-10",
        recurrenceDay: 10,
        lastGeneratedAt: "2026-03-10T12:00:00.000Z",
      });

      const result = getNextRecurringOccurrenceDate(transaction, "2026-04-15");

      expect(result).toBeNull();
    });

    it("deve retornar null quando a recorrência até data já terminou", () => {
      const transaction = createTransaction({
        recurrenceMode: "until-date",
        recurrenceEndDate: "2026-03-10",
        recurrenceStartDate: "2026-01-10",
        recurrenceDay: 10,
        lastGeneratedAt: "2026-03-10T12:00:00.000Z",
      });

      const result = getNextRecurringOccurrenceDate(transaction, "2026-04-15");

      expect(result).toBeNull();
    });
  });

  describe("synchronizeRecurringTransactions", () => {
    it("deve gerar instâncias até a data de referência", () => {
      const randomUuidSpy = vi
        .spyOn(crypto, "randomUUID")
        .mockReturnValueOnce("instance-1")
        .mockReturnValueOnce("instance-2")
        .mockReturnValueOnce("instance-3")
        .mockReturnValueOnce("instance-4");

      const transactions: Transaction[] = [
        createTransaction({
          id: "rec-template-1",
          title: "Academia",
          amount: 120,
          recurrenceDay: 10,
          recurrenceStartDate: "2026-01-10",
        }),
      ];

      const result = synchronizeRecurringTransactions({
        transactions,
        referenceDate: "2026-04-15",
      });

      const generatedInstances = result.transactions.filter(
        (transaction) => transaction.transactionKind === "recurring-instance",
      );

      expect(result.generatedCount).toBe(4);
      expect(generatedInstances).toHaveLength(4);
      expect(generatedInstances.map((item) => item.occurrenceDate)).toEqual([
        "2026-01-10",
        "2026-02-10",
        "2026-03-10",
        "2026-04-10",
      ]);

      randomUuidSpy.mockRestore();
    });

    it("não deve duplicar instâncias já existentes", () => {
      const randomUuidSpy = vi
        .spyOn(crypto, "randomUUID")
        .mockReturnValue("instance-new");

      const transactions: Transaction[] = [
        createTransaction({
          id: "rec-template-1",
          title: "Internet",
          amount: 100,
          recurrenceDay: 10,
          recurrenceStartDate: "2026-01-10",
        }),
        createTransaction({
          id: "rec-instance-existing",
          title: "Internet",
          amount: 100,
          type: "expense",
          transactionKind: "recurring-instance",
          isRecurring: false,
          recurrenceType: null,
          recurrenceMode: null,
          recurrenceDay: null,
          recurrenceStartDate: null,
          recurrenceEndDate: null,
          recurrenceMonths: null,
          sourceId: "rec-template-1",
          occurrenceDate: "2026-03-10",
          recurringSourceId: "rec-template-1",
          recurringOccurrenceDate: "2026-03-10",
          lastGeneratedAt: null,
        }),
      ];

      const result = synchronizeRecurringTransactions({
        transactions,
        referenceDate: "2026-03-15",
      });

      const generatedInstances = result.transactions.filter(
        (transaction) => transaction.transactionKind === "recurring-instance",
      );

      const sortedDates = generatedInstances
        .map((item) => item.occurrenceDate)
        .sort();

      expect(result.generatedCount).toBe(2);
      expect(generatedInstances).toHaveLength(3);
      expect(sortedDates).toEqual([
        "2026-01-10",
        "2026-02-10",
        "2026-03-10",
      ]);

      randomUuidSpy.mockRestore();
    });

    it("não deve gerar instâncias quando a recorrência começa no futuro", () => {
      const transactions: Transaction[] = [
        createTransaction({
          id: "future-template",
          title: "Assinatura futura",
          recurrenceStartDate: "2026-06-10",
          recurrenceDay: 10,
        }),
      ];

      const result = synchronizeRecurringTransactions({
        transactions,
        referenceDate: "2026-04-15",
      });

      expect(result.generatedCount).toBe(0);
      expect(
        result.transactions.filter(
          (transaction) => transaction.transactionKind === "recurring-instance",
        ),
      ).toHaveLength(0);
    });

    it("deve respeitar recorrência com until-date", () => {
      const randomUuidSpy = vi
        .spyOn(crypto, "randomUUID")
        .mockReturnValueOnce("instance-1")
        .mockReturnValueOnce("instance-2")
        .mockReturnValueOnce("instance-3");

      const transactions: Transaction[] = [
        createTransaction({
          id: "until-date-template",
          title: "Curso",
          recurrenceStartDate: "2026-01-10",
          recurrenceDay: 10,
          recurrenceMode: "until-date",
          recurrenceEndDate: "2026-03-10",
        }),
      ];

      const result = synchronizeRecurringTransactions({
        transactions,
        referenceDate: "2026-05-15",
      });

      const generatedInstances = result.transactions
        .filter((transaction) => transaction.transactionKind === "recurring-instance")
        .map((transaction) => transaction.occurrenceDate);

      expect(result.generatedCount).toBe(3);
      expect(generatedInstances).toEqual([
        "2026-01-10",
        "2026-02-10",
        "2026-03-10",
      ]);

      randomUuidSpy.mockRestore();
    });

    it("deve respeitar recorrência com for-months", () => {
      const randomUuidSpy = vi
        .spyOn(crypto, "randomUUID")
        .mockReturnValueOnce("instance-1")
        .mockReturnValueOnce("instance-2")
        .mockReturnValueOnce("instance-3");

      const transactions: Transaction[] = [
        createTransaction({
          id: "for-months-template",
          title: "Reserva",
          recurrenceStartDate: "2026-01-10",
          recurrenceDay: 10,
          recurrenceMode: "for-months",
          recurrenceMonths: 3,
        }),
      ];

      const result = synchronizeRecurringTransactions({
        transactions,
        referenceDate: "2026-05-15",
      });

      const generatedInstances = result.transactions
        .filter((transaction) => transaction.transactionKind === "recurring-instance")
        .map((transaction) => transaction.occurrenceDate);

      expect(result.generatedCount).toBe(3);
      expect(generatedInstances).toEqual([
        "2026-01-10",
        "2026-02-10",
        "2026-03-10",
      ]);

      randomUuidSpy.mockRestore();
    });
  });
});
