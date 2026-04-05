import { describe, expect, it } from "vitest";

import { getMonthlyForecast } from "@/utils/financial-forecast";
import type { Transaction } from "@/types/finance";

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
    recurrenceType: "monthly",
    recurrenceDay: 10,
    recurrenceStartDate: "2026-01-10",
    ...overrides,
  } as Transaction;
}

describe("getMonthlyForecast", () => {
  it("deve somar entradas e saídas recorrentes do mês e calcular o saldo projetado", () => {
    const transactions: Transaction[] = [
      createTransaction({
        id: "income-1",
        title: "Salário",
        type: "income",
        amount: 3000,
        recurrenceDay: 5,
        recurrenceStartDate: "2026-01-05",
      }),
      createTransaction({
        id: "expense-1",
        title: "Aluguel",
        type: "expense",
        amount: 1200,
        recurrenceDay: 10,
        recurrenceStartDate: "2026-01-10",
      }),
    ];

    const result = getMonthlyForecast({
      transactions,
      referenceDate: new Date(2026, 3, 15), // abril/2026
      currentBalance: 2000,
    });

    expect(result).toEqual({
      totalIncome: 3000,
      totalExpense: 1200,
      projectedBalance: 3800,
    });
  });

  it("deve ignorar transações que não são recurring-template", () => {
    const transactions: Transaction[] = [
      createTransaction({
        id: "single-income",
        title: "Entrada única",
        type: "income",
        amount: 5000,
        transactionKind: "single",
      }),
      createTransaction({
        id: "expense-1",
        title: "Internet",
        type: "expense",
        amount: 200,
      }),
    ];

    const result = getMonthlyForecast({
      transactions,
      referenceDate: new Date(2026, 3, 15),
      currentBalance: 1000,
    });

    expect(result).toEqual({
      totalIncome: 0,
      totalExpense: 200,
      projectedBalance: 800,
    });
  });

  it("deve ignorar recorrências que ainda não começaram", () => {
    const transactions: Transaction[] = [
      createTransaction({
        id: "future-income",
        title: "Renda futura",
        type: "income",
        amount: 1000,
        recurrenceDay: 20,
        recurrenceStartDate: "2026-06-20",
      }),
    ];

    const result = getMonthlyForecast({
      transactions,
      referenceDate: new Date(2026, 3, 15), // abril/2026
      currentBalance: 500,
    });

    expect(result).toEqual({
      totalIncome: 0,
      totalExpense: 0,
      projectedBalance: 500,
    });
  });

  it("deve considerar o mês correto da referenceDate ao montar a ocorrência prevista", () => {
    const transactions: Transaction[] = [
      createTransaction({
        id: "rec-income",
        title: "Receita mensal",
        type: "income",
        amount: 1000,
        recurrenceDay: 30,
        recurrenceStartDate: "2026-04-30",
      }),
    ];

    const result = getMonthlyForecast({
      transactions,
      referenceDate: new Date(2026, 3, 10), // abril/2026
      currentBalance: 0,
    });

    expect(result.totalIncome).toBe(1000);
    expect(result.totalExpense).toBe(0);
    expect(result.projectedBalance).toBe(1000);
  });

  it("deve somar múltiplas entradas e saídas válidas no mesmo mês", () => {
    const transactions: Transaction[] = [
      createTransaction({
        id: "income-1",
        title: "Salário",
        type: "income",
        amount: 2500,
        recurrenceDay: 5,
        recurrenceStartDate: "2026-01-05",
      }),
      createTransaction({
        id: "income-2",
        title: "Freela",
        type: "income",
        amount: 800,
        recurrenceDay: 20,
        recurrenceStartDate: "2026-01-20",
      }),
      createTransaction({
        id: "expense-1",
        title: "Aluguel",
        type: "expense",
        amount: 1200,
        recurrenceDay: 10,
        recurrenceStartDate: "2026-01-10",
      }),
      createTransaction({
        id: "expense-2",
        title: "Internet",
        type: "expense",
        amount: 150,
        recurrenceDay: 15,
        recurrenceStartDate: "2026-01-15",
      }),
    ];

    const result = getMonthlyForecast({
      transactions,
      referenceDate: new Date(2026, 3, 15),
      currentBalance: 1000,
    });

    expect(result).toEqual({
      totalIncome: 3300,
      totalExpense: 1350,
      projectedBalance: 2950,
    });
  });

  it("deve ignorar transações com recorrência inválida ou incompleta", () => {
    const transactions: Transaction[] = [
      createTransaction({
        id: "invalid-type",
        recurrenceType: "weekly" as Transaction["recurrenceType"],
      }),
      createTransaction({
        id: "missing-day",
        recurrenceDay: null,
      }),
      createTransaction({
        id: "missing-start-date",
        recurrenceStartDate: null,
      }),
      createTransaction({
        id: "valid-income",
        title: "Receita válida",
        type: "income",
        amount: 1000,
        recurrenceDay: 10,
        recurrenceStartDate: "2026-01-10",
      }),
    ];

    const result = getMonthlyForecast({
      transactions,
      referenceDate: new Date(2026, 3, 15),
      currentBalance: 200,
    });

    expect(result).toEqual({
      totalIncome: 1000,
      totalExpense: 0,
      projectedBalance: 1200,
    });
  });

  it("deve respeitar mês curto ao calcular ocorrência recorrente", () => {
    const transactions: Transaction[] = [
      createTransaction({
        id: "short-month-expense",
        title: "Conta do fim do mês",
        type: "expense",
        amount: 300,
        recurrenceDay: 31,
        recurrenceStartDate: "2026-01-31",
      }),
    ];

    const result = getMonthlyForecast({
      transactions,
      referenceDate: new Date(2026, 1, 10), // fevereiro/2026
      currentBalance: 1000,
    });

    expect(result).toEqual({
      totalIncome: 0,
      totalExpense: 300,
      projectedBalance: 700,
    });
  });

  it("deve usar currentBalance como base real do saldo projetado", () => {
    const transactions: Transaction[] = [
      createTransaction({
        id: "income-1",
        title: "Receita mensal",
        type: "income",
        amount: 500,
        recurrenceDay: 10,
        recurrenceStartDate: "2026-01-10",
      }),
      createTransaction({
        id: "expense-1",
        title: "Despesa mensal",
        type: "expense",
        amount: 200,
        recurrenceDay: 12,
        recurrenceStartDate: "2026-01-12",
      }),
    ];

    const result = getMonthlyForecast({
      transactions,
      referenceDate: new Date(2026, 3, 15),
      currentBalance: 4000,
    });

    expect(result.totalIncome).toBe(500);
    expect(result.totalExpense).toBe(200);
    expect(result.projectedBalance).toBe(4300);
  });
});
