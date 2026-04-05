import { describe, expect, it } from "vitest";

import {
  normalizeInstallmentCount,
  normalizeInstallmentIndex,
  normalizeOccurrenceDate,
  normalizeSourceId,
  normalizeTransaction,
  normalizeTransactionCategory,
  normalizeTransactionKind,
  normalizeTransactionRecurrenceDay,
  normalizeTransactionRecurrenceMode,
  normalizeTransactionRecurrenceMonths,
  normalizeTransactionRecurrenceType,
} from "@/utils/transaction-normalization";
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
    ...overrides,
  } as Transaction;
}

describe("transaction-normalization", () => {
  describe("normalizadores básicos", () => {
    it("normalizeTransactionCategory deve retornar a categoria padrão quando inválida", () => {
      expect(normalizeTransactionCategory(undefined)).toBe("geral");
      expect(normalizeTransactionCategory("")).toBe("geral");
      expect(normalizeTransactionCategory("categoria-inexistente")).toBe("geral");
    });

    it("normalizeTransactionCategory deve normalizar categoria válida", () => {
      expect(normalizeTransactionCategory(" GERAL ")).toBe("geral");
    });

    it("normalizeTransactionRecurrenceType deve aceitar apenas tipos válidos", () => {
      expect(normalizeTransactionRecurrenceType("monthly")).toBe("monthly");
      expect(normalizeTransactionRecurrenceType("WEEKLY")).toBeNull();
      expect(normalizeTransactionRecurrenceType(undefined)).toBeNull();
    });

    it("normalizeTransactionRecurrenceMode deve aceitar apenas modos válidos", () => {
      expect(normalizeTransactionRecurrenceMode("indefinite")).toBe("indefinite");
      expect(normalizeTransactionRecurrenceMode("until-date")).toBe("until-date");
      expect(normalizeTransactionRecurrenceMode("modo-invalido")).toBeNull();
    });

    it("normalizeTransactionKind deve usar recurring-template quando isRecurring for true e o kind for inválido", () => {
      expect(normalizeTransactionKind("kind-invalido", true)).toBe("recurring-template");
      expect(normalizeTransactionKind("kind-invalido", false)).toBe("single");
      expect(normalizeTransactionKind("installment-template", false)).toBe(
        "installment-template",
      );
    });

    it("normalizeTransactionRecurrenceDay deve usar o valor válido informado", () => {
      expect(normalizeTransactionRecurrenceDay(15, "2026-04-10")).toBe(15);
      expect(normalizeTransactionRecurrenceDay("20", "2026-04-10")).toBe(20);
    });

    it("normalizeTransactionRecurrenceDay deve usar a data de referência como fallback", () => {
      expect(normalizeTransactionRecurrenceDay(undefined, "2026-04-10")).toBe(10);
      expect(normalizeTransactionRecurrenceDay("valor-invalido", "2026-04-21")).toBe(21);
    });

    it("normalizeSourceId deve priorizar sourceId e depois legado", () => {
      expect(normalizeSourceId(" source-1 ", "legacy-1")).toBe("source-1");
      expect(normalizeSourceId(undefined, " legacy-1 ")).toBe("legacy-1");
      expect(normalizeSourceId(undefined, undefined)).toBeNull();
    });

    it("normalizeOccurrenceDate deve normalizar data atual ou legado", () => {
      expect(normalizeOccurrenceDate("2026-04-10")).toBe("2026-04-10");
      expect(normalizeOccurrenceDate(undefined, "2026-05-12")).toBe("2026-05-12");
      expect(normalizeOccurrenceDate(undefined, undefined)).toBeNull();
    });

    it("normalizeInstallmentCount deve aceitar apenas inteiros >= 1", () => {
      expect(normalizeInstallmentCount(3)).toBe(3);
      expect(normalizeInstallmentCount("5")).toBe(5);
      expect(normalizeInstallmentCount(0)).toBeNull();
      expect(normalizeInstallmentCount("abc")).toBeNull();
    });

    it("normalizeInstallmentIndex deve respeitar installmentCount", () => {
      expect(normalizeInstallmentIndex(2, 3)).toBe(2);
      expect(normalizeInstallmentIndex("3", 3)).toBe(3);
      expect(normalizeInstallmentIndex(4, 3)).toBeNull();
      expect(normalizeInstallmentIndex(0, 3)).toBeNull();
    });

    it("normalizeTransactionRecurrenceMonths deve aceitar apenas inteiros >= 1", () => {
      expect(normalizeTransactionRecurrenceMonths(3)).toBe(3);
      expect(normalizeTransactionRecurrenceMonths("6")).toBe(6);
      expect(normalizeTransactionRecurrenceMonths(0)).toBeNull();
      expect(normalizeTransactionRecurrenceMonths("x")).toBeNull();
    });
  });

  describe("normalizeTransaction", () => {
    it("deve normalizar transação single limpando campos que não fazem sentido", () => {
      const transaction = createTransaction({
        transactionKind: "single",
        isRecurring: true,
        recurrenceType: "monthly",
        recurrenceMode: "indefinite",
        recurrenceDay: 10,
        recurrenceStartDate: "2026-01-10",
        recurrenceEndDate: "2026-03-10",
        recurrenceMonths: 3,
        sourceId: "source-1",
        occurrenceDate: "2026-04-10",
      });

      const result = normalizeTransaction(transaction);

      expect(result.transactionKind).toBe("single");
      expect(result.isRecurring).toBe(false);
      expect(result.recurrenceType).toBeNull();
      expect(result.recurrenceMode).toBeNull();
      expect(result.recurrenceDay).toBeNull();
      expect(result.recurrenceStartDate).toBeNull();
      expect(result.recurrenceEndDate).toBeNull();
      expect(result.recurrenceMonths).toBeNull();
      expect(result.sourceId).toBeNull();
      expect(result.occurrenceDate).toBeNull();
    });

    it("deve normalizar recurring-template com defaults corretos", () => {
      const transaction = createTransaction({
        transactionKind: "recurring-template",
        isRecurring: true,
        recurrenceType: null,
        recurrenceMode: null,
        recurrenceDay: null,
        recurrenceStartDate: null,
        createdAt: "2026-04-15T12:00:00.000Z",
      });

      const result = normalizeTransaction(transaction);

      expect(result.transactionKind).toBe("recurring-template");
      expect(result.isRecurring).toBe(true);
      expect(result.recurrenceType).toBe("monthly");
      expect(result.recurrenceMode).toBe("indefinite");
      expect(result.recurrenceDay).toBe(15);
      expect(result.recurrenceStartDate).toBe("2026-04-15");
    });

    it("deve normalizar recurring-template com until-date apenas se tiver data final válida", () => {
      const transaction = createTransaction({
        transactionKind: "recurring-template",
        isRecurring: true,
        recurrenceMode: "until-date",
        recurrenceStartDate: "2026-04-10",
        recurrenceEndDate: "2026-06-10",
        recurrenceDay: 10,
      });

      const result = normalizeTransaction(transaction);

      expect(result.recurrenceMode).toBe("until-date");
      expect(result.recurrenceEndDate).toBe("2026-06-10");
      expect(result.recurrenceMonths).toBeNull();
    });

    it("deve cair para indefinite quando for-months estiver sem recurrenceMonths válido", () => {
      const transaction = createTransaction({
        transactionKind: "recurring-template",
        isRecurring: true,
        recurrenceMode: "for-months",
        recurrenceMonths: null,
        recurrenceStartDate: "2026-04-10",
        recurrenceDay: 10,
      });

      const result = normalizeTransaction(transaction);

      expect(result.recurrenceMode).toBe("indefinite");
      expect(result.recurrenceMonths).toBeNull();
    });

    it("deve normalizar recurring-instance usando sourceId e occurrenceDate legados", () => {
      const transaction = createTransaction({
        transactionKind: "recurring-instance",
        sourceId: null,
        occurrenceDate: null,
        recurringSourceId: "legacy-rec-1",
        recurringOccurrenceDate: "2026-05-10",
        isRecurring: true,
        recurrenceType: "monthly",
        recurrenceMode: "indefinite",
      });

      const result = normalizeTransaction(transaction);

      expect(result.transactionKind).toBe("recurring-instance");
      expect(result.sourceId).toBe("legacy-rec-1");
      expect(result.occurrenceDate).toBe("2026-05-10");
      expect(result.recurringSourceId).toBe("legacy-rec-1");
      expect(result.recurringOccurrenceDate).toBe("2026-05-10");
      expect(result.isRecurring).toBe(false);
      expect(result.recurrenceType).toBeNull();
    });

    it("deve normalizar installment-template com contagem e data inicial", () => {
      const transaction = createTransaction({
        transactionKind: "installment-template",
        installmentCount: "3" as unknown as number,
        installmentStartDate: "2026-04-10",
      });

      const result = normalizeTransaction(transaction);

      expect(result.transactionKind).toBe("installment-template");
      expect(result.installmentCount).toBe(3);
      expect(result.installmentStartDate).toBe("2026-04-10");
      expect(result.isRecurring).toBe(false);
    });

    it("deve normalizar installment-instance respeitando installmentIndex <= installmentCount", () => {
      const transaction = createTransaction({
        transactionKind: "installment-instance",
        sourceId: "installment-source-1",
        occurrenceDate: "2026-06-10",
        installmentIndex: 5,
        installmentCount: 3,
      });

      const result = normalizeTransaction(transaction);

      expect(result.transactionKind).toBe("installment-instance");
      expect(result.sourceId).toBe("installment-source-1");
      expect(result.occurrenceDate).toBe("2026-06-10");
      expect(result.installmentCount).toBe(3);
      expect(result.installmentIndex).toBeNull();
    });

    it("deve normalizar categoria inválida para geral em qualquer tipo", () => {
      const transaction = createTransaction({
        transactionKind: "recurring-template",
        isRecurring: true,
        category: "categoria-inexistente",
      });

      const result = normalizeTransaction(transaction);

      expect(result.category).toBe("geral");
    });
  });
});
