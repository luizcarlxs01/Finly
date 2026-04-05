import { describe, expect, it } from "vitest";

import type { Transaction } from "@/types/transaction";
import { getUpcomingTransactionsByMonth } from "@/utils/upcoming-transactions";

function createTransaction(
  overrides: Partial<Transaction> = {},
): Transaction {
  return {
    id: "tx-1",
    title: "Transacao teste",
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

describe("getUpcomingTransactionsByMonth", () => {
  it("deve criar grupos mensais e acumular saldo a partir do baseBalance", () => {
    const transactions: Transaction[] = [
      createTransaction({
        id: "future-income",
        title: "Receita futura",
        type: "income",
        amount: 500,
        transactionKind: "recurring-instance",
        occurrenceDate: "2026-05-10",
        sourceId: "rec-1",
      }),
      createTransaction({
        id: "future-expense",
        title: "Despesa futura",
        type: "expense",
        amount: 200,
        transactionKind: "recurring-instance",
        occurrenceDate: "2026-06-15",
        sourceId: "rec-2",
      }),
    ];

    const result = getUpcomingTransactionsByMonth({
      transactions,
      monthsAhead: 2,
      referenceDate: new Date(2026, 3, 10),
      baseBalance: 1000,
    });

    expect(result).toHaveLength(2);

    expect(result[0].totalIncome).toBe(500);
    expect(result[0].totalExpense).toBe(0);
    expect(result[0].projectedBalance).toBe(1500);

    expect(result[1].totalIncome).toBe(0);
    expect(result[1].totalExpense).toBe(200);
    expect(result[1].projectedBalance).toBe(1300);
  });

  it("deve projetar recorrentes mensais para os proximos meses", () => {
    const transactions: Transaction[] = [
      createTransaction({
        id: "rec-template-1",
        title: "Academia",
        type: "expense",
        amount: 120,
        transactionKind: "recurring-template",
        recurrenceType: "monthly",
        recurrenceDay: 10,
        recurrenceStartDate: "2026-01-10",
        recurrenceMode: "indefinite",
      }),
    ];

    const result = getUpcomingTransactionsByMonth({
      transactions,
      monthsAhead: 2,
      referenceDate: new Date(2026, 3, 10),
      baseBalance: 1000,
    });

    expect(result[0].items).toHaveLength(1);
    expect(result[0].items[0]).toMatchObject({
      title: "Academia",
      amount: 120,
      type: "expense",
      marker: "Recorrente indefinido",
      sourceKind: "recurring-instance",
    });

    expect(result[1].items).toHaveLength(1);
    expect(result[1].items[0]).toMatchObject({
      title: "Academia",
      amount: 120,
      type: "expense",
      marker: "Recorrente indefinido",
      sourceKind: "recurring-instance",
    });
  });

  it("deve projetar parcelamentos mes a mes", () => {
    const transactions: Transaction[] = [
      createTransaction({
        id: "installment-template-1",
        title: "Notebook",
        type: "expense",
        amount: 300,
        transactionKind: "installment-template",
        installmentCount: 3,
        installmentStartDate: "2026-05-05",
      }),
    ];

    const result = getUpcomingTransactionsByMonth({
      transactions,
      monthsAhead: 3,
      referenceDate: new Date(2026, 3, 10),
      baseBalance: 1000,
    });

    expect(result[0].items[0]).toMatchObject({
      title: "Notebook",
      marker: "Parcela 1/3",
      sourceKind: "installment-instance",
    });

    expect(result[1].items[0]).toMatchObject({
      title: "Notebook",
      marker: "Parcela 2/3",
      sourceKind: "installment-instance",
    });

    expect(result[2].items[0]).toMatchObject({
      title: "Notebook",
      marker: "Parcela 3/3",
      sourceKind: "installment-instance",
    });
  });

  it("nao deve duplicar projecao quando ja existir instancia futura da mesma origem e data", () => {
    const transactions: Transaction[] = [
      createTransaction({
        id: "rec-template-1",
        title: "Internet",
        type: "expense",
        amount: 100,
        transactionKind: "recurring-template",
        recurrenceType: "monthly",
        recurrenceDay: 10,
        recurrenceStartDate: "2026-01-10",
        recurrenceMode: "indefinite",
      }),
      createTransaction({
        id: "rec-instance-1",
        title: "Internet",
        type: "expense",
        amount: 100,
        transactionKind: "recurring-instance",
        occurrenceDate: "2026-05-10",
        sourceId: "rec-template-1",
      }),
    ];

    const result = getUpcomingTransactionsByMonth({
      transactions,
      monthsAhead: 1,
      referenceDate: new Date(2026, 3, 10),
      baseBalance: 1000,
    });

    expect(result[0].items).toHaveLength(1);
    expect(result[0].totalExpense).toBe(100);
    expect(result[0].projectedBalance).toBe(900);
  });

  it("deve respeitar recorrencia com until-date", () => {
    const transactions: Transaction[] = [
      createTransaction({
        id: "rec-template-until",
        title: "Curso",
        type: "expense",
        amount: 200,
        transactionKind: "recurring-template",
        recurrenceType: "monthly",
        recurrenceDay: 10,
        recurrenceStartDate: "2026-01-10",
        recurrenceMode: "until-date",
        recurrenceEndDate: "2026-06-10",
      }),
    ];

    const result = getUpcomingTransactionsByMonth({
      transactions,
      monthsAhead: 3,
      referenceDate: new Date(2026, 3, 10),
      baseBalance: 1000,
    });

    expect(result[0].items).toHaveLength(1);
    expect(result[1].items).toHaveLength(1);
    expect(result[2].items).toHaveLength(0);
  });

  it("deve respeitar recorrencia com for-months", () => {
    const transactions: Transaction[] = [
      createTransaction({
        id: "rec-template-months",
        title: "Aporte",
        type: "income",
        amount: 300,
        transactionKind: "recurring-template",
        recurrenceType: "monthly",
        recurrenceDay: 5,
        recurrenceStartDate: "2026-04-05",
        recurrenceMode: "for-months",
        recurrenceMonths: 2,
      }),
    ];

    const result = getUpcomingTransactionsByMonth({
      transactions,
      monthsAhead: 3,
      referenceDate: new Date(2026, 3, 10),
      baseBalance: 0,
    });

    expect(result[0].items).toHaveLength(1);
    expect(result[1].items).toHaveLength(0);
    expect(result[2].items).toHaveLength(0);
  });

  it("nao deve projetar recorrencia antes da data de inicio", () => {
    const transactions: Transaction[] = [
      createTransaction({
        id: "future-rec-template",
        title: "Plano futuro",
        type: "expense",
        amount: 80,
        transactionKind: "recurring-template",
        recurrenceType: "monthly",
        recurrenceDay: 15,
        recurrenceStartDate: "2026-07-15",
        recurrenceMode: "indefinite",
      }),
    ];

    const result = getUpcomingTransactionsByMonth({
      transactions,
      monthsAhead: 2,
      referenceDate: new Date(2026, 3, 10),
      baseBalance: 1000,
    });

    expect(result[0].items).toHaveLength(0);
    expect(result[1].items).toHaveLength(0);
  });

  it("deve calcular saldo acumulado corretamente ao longo dos meses", () => {
    const transactions: Transaction[] = [
      createTransaction({
        id: "income-may",
        title: "Freela",
        type: "income",
        amount: 500,
        transactionKind: "recurring-instance",
        occurrenceDate: "2026-05-10",
        sourceId: "income-1",
      }),
      createTransaction({
        id: "expense-june",
        title: "Seguro",
        type: "expense",
        amount: 300,
        transactionKind: "recurring-instance",
        occurrenceDate: "2026-06-10",
        sourceId: "expense-1",
      }),
      createTransaction({
        id: "expense-july",
        title: "Manutencao",
        type: "expense",
        amount: 400,
        transactionKind: "recurring-instance",
        occurrenceDate: "2026-07-10",
        sourceId: "expense-2",
      }),
    ];

    const result = getUpcomingTransactionsByMonth({
      transactions,
      monthsAhead: 3,
      referenceDate: new Date(2026, 3, 10),
      baseBalance: 1000,
    });

    expect(result[0].projectedBalance).toBe(1500);
    expect(result[1].projectedBalance).toBe(1200);
    expect(result[2].projectedBalance).toBe(800);
  });

  it("deve ajustar recorrencia para mes curto quando necessario", () => {
    const transactions: Transaction[] = [
      createTransaction({
        id: "rec-template-31",
        title: "Assinatura",
        type: "expense",
        amount: 90,
        transactionKind: "recurring-template",
        recurrenceType: "monthly",
        recurrenceDay: 31,
        recurrenceStartDate: "2026-01-31",
        recurrenceMode: "indefinite",
      }),
    ];

    const result = getUpcomingTransactionsByMonth({
      transactions,
      monthsAhead: 1,
      referenceDate: new Date(2026, 0, 15),
      baseBalance: 1000,
    });

    expect(result[0].items).toHaveLength(1);
    expect(result[0].items[0].occurrenceDate).toBe("2026-02-28");
  });

  it("deve definir balanceTone e balanceSummary coerentes com saldo negativo", () => {
    const transactions: Transaction[] = [
      createTransaction({
        id: "heavy-expense",
        title: "Despesa alta",
        type: "expense",
        amount: 1500,
        transactionKind: "recurring-instance",
        occurrenceDate: "2026-05-10",
        sourceId: "expense-1",
      }),
    ];

    const result = getUpcomingTransactionsByMonth({
      transactions,
      monthsAhead: 1,
      referenceDate: new Date(2026, 3, 10),
      baseBalance: 500,
    });

    expect(result[0].balanceTone).toBe("warning");
    expect(result[0].balanceSummary).toContain("Aten");
  });

  it("deve ordenar itens do mesmo mes pela occurrenceDate", () => {
    const transactions: Transaction[] = [
      createTransaction({
        id: "late-item",
        title: "Conta 20",
        type: "expense",
        amount: 50,
        transactionKind: "recurring-instance",
        occurrenceDate: "2026-05-20",
        sourceId: "source-20",
      }),
      createTransaction({
        id: "early-item",
        title: "Conta 05",
        type: "expense",
        amount: 30,
        transactionKind: "recurring-instance",
        occurrenceDate: "2026-05-05",
        sourceId: "source-05",
      }),
      createTransaction({
        id: "middle-item",
        title: "Conta 10",
        type: "income",
        amount: 100,
        transactionKind: "recurring-instance",
        occurrenceDate: "2026-05-10",
        sourceId: "source-10",
      }),
    ];

    const result = getUpcomingTransactionsByMonth({
      transactions,
      monthsAhead: 1,
      referenceDate: new Date(2026, 3, 10),
      baseBalance: 0,
    });

    expect(result[0].items.map((item) => item.id)).toEqual([
      "early-item:2026-05-05",
      "middle-item:2026-05-10",
      "late-item:2026-05-20",
    ]);
  });

  it("deve usar recurringOccurrenceDate e recurringSourceId quando occurrenceDate e sourceId nao vierem preenchidos", () => {
    const transactions: Transaction[] = [
      createTransaction({
        id: "template-1",
        title: "Streaming",
        type: "expense",
        amount: 40,
        transactionKind: "recurring-template",
        recurrenceType: "monthly",
        recurrenceDay: 8,
        recurrenceStartDate: "2026-01-08",
        recurrenceMode: "indefinite",
      }),
      createTransaction({
        id: "instance-1",
        title: "Streaming",
        type: "expense",
        amount: 40,
        transactionKind: "recurring-instance",
        occurrenceDate: null,
        sourceId: null,
        recurringOccurrenceDate: "2026-05-08",
        recurringSourceId: "template-1",
      }),
    ];

    const result = getUpcomingTransactionsByMonth({
      transactions,
      monthsAhead: 1,
      referenceDate: new Date(2026, 3, 10),
      baseBalance: 100,
    });

    expect(result[0].items).toHaveLength(1);
    expect(result[0].items[0]).toMatchObject({
      id: "instance-1:2026-05-08",
      marker: "Recorrente indefinido",
      sourceKind: "recurring-instance",
    });
  });

  it("deve usar marcador de parcela para instancias futuras ja existentes", () => {
    const transactions: Transaction[] = [
      createTransaction({
        id: "installment-template-1",
        title: "Celular",
        type: "expense",
        amount: 250,
        transactionKind: "installment-template",
        installmentCount: 4,
        installmentStartDate: "2026-03-05",
      }),
      createTransaction({
        id: "installment-instance-2",
        title: "Celular",
        type: "expense",
        amount: 250,
        transactionKind: "installment-instance",
        occurrenceDate: "2026-05-05",
        sourceId: "installment-template-1",
        installmentIndex: 3,
        installmentCount: 4,
      }),
    ];

    const result = getUpcomingTransactionsByMonth({
      transactions,
      monthsAhead: 2,
      referenceDate: new Date(2026, 3, 10),
      baseBalance: 1000,
    });

    expect(result[0].items[0]).toMatchObject({
      id: "installment-instance-2:2026-05-05",
      marker: "Parcela 3/4",
      sourceKind: "installment-instance",
    });

    expect(result[1].items[0]).toMatchObject({
      marker: "Parcela 4/4",
      sourceKind: "installment-instance",
    });
  });

  it("deve ignorar templates com datas invalidas ou incompletas", () => {
    const transactions: Transaction[] = [
      createTransaction({
        id: "invalid-recurring",
        transactionKind: "recurring-template",
        recurrenceType: "monthly",
        recurrenceDay: 10,
        recurrenceStartDate: "data-invalida",
        recurrenceMode: "indefinite",
      }),
      createTransaction({
        id: "invalid-installment",
        transactionKind: "installment-template",
        installmentCount: 3,
        installmentStartDate: "data-invalida",
      }),
    ];

    const result = getUpcomingTransactionsByMonth({
      transactions,
      monthsAhead: 2,
      referenceDate: new Date(2026, 3, 10),
      baseBalance: 500,
    });

    expect(result[0].items).toHaveLength(0);
    expect(result[1].items).toHaveLength(0);
    expect(result[0].projectedBalance).toBe(500);
    expect(result[1].projectedBalance).toBe(500);
  });

  it("deve marcar o mes como neutro quando o saldo fica zerado", () => {
    const transactions: Transaction[] = [
      createTransaction({
        id: "expense-zero-balance",
        title: "Fechamento",
        type: "expense",
        amount: 500,
        transactionKind: "recurring-instance",
        occurrenceDate: "2026-05-10",
        sourceId: "expense-zero-balance",
      }),
    ];

    const result = getUpcomingTransactionsByMonth({
      transactions,
      monthsAhead: 1,
      referenceDate: new Date(2026, 3, 10),
      baseBalance: 500,
    });

    expect(result[0].projectedBalance).toBe(0);
    expect(result[0].balanceTone).toBe("neutral");
    expect(result[0].balanceSummary).toContain("equilibrado");
  });

  it("deve marcar o mes como neutro quando sobra apenas uma margem pequena", () => {
    const transactions: Transaction[] = [
      createTransaction({
        id: "small-margin-income",
        title: "Receita",
        type: "income",
        amount: 1000,
        transactionKind: "recurring-instance",
        occurrenceDate: "2026-05-05",
        sourceId: "small-margin-income",
      }),
      createTransaction({
        id: "small-margin-expense",
        title: "Despesa",
        type: "expense",
        amount: 850,
        transactionKind: "recurring-instance",
        occurrenceDate: "2026-05-10",
        sourceId: "small-margin-expense",
      }),
    ];

    const result = getUpcomingTransactionsByMonth({
      transactions,
      monthsAhead: 1,
      referenceDate: new Date(2026, 3, 10),
      baseBalance: 0,
    });

    expect(result[0].projectedBalance).toBe(150);
    expect(result[0].balanceTone).toBe("neutral");
    expect(result[0].balanceSummary).toContain("pouca margem");
  });

  it("deve marcar o mes como positivo quando a folga supera o limite de seguranca", () => {
    const transactions: Transaction[] = [
      createTransaction({
        id: "comfortable-income",
        title: "Salario",
        type: "income",
        amount: 2000,
        transactionKind: "recurring-instance",
        occurrenceDate: "2026-05-05",
        sourceId: "comfortable-income",
      }),
      createTransaction({
        id: "comfortable-expense",
        title: "Custos fixos",
        type: "expense",
        amount: 1000,
        transactionKind: "recurring-instance",
        occurrenceDate: "2026-05-10",
        sourceId: "comfortable-expense",
      }),
    ];

    const result = getUpcomingTransactionsByMonth({
      transactions,
      monthsAhead: 1,
      referenceDate: new Date(2026, 3, 10),
      baseBalance: 0,
    });

    expect(result[0].projectedBalance).toBe(1000);
    expect(result[0].balanceTone).toBe("positive");
    expect(result[0].balanceSummary).toContain("folga prevista");
  });
});
