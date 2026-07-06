import { describe, expect, it } from "vitest";

import {
  createMonthlyOccurrence,
  formatDateValue,
  getNextMonthlyOccurrenceAfter,
  getNextRecurringOccurrenceDate,
  parseDateValue,
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
});
