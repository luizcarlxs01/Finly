import { describe, expect, it } from "vitest";

import type { Transaction } from "@/types/finance";
import type { Goal } from "@/types/goal";
import { getDashboardInsights } from "@/utils/dashboard-insights";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function createTransaction(
  overrides: Partial<Transaction> = {},
): Transaction {
  return {
    id: "tx-1",
    title: "Transacao teste",
    amount: 100,
    type: "expense",
    category: "geral",
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
  };
}

function createGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: "goal-1",
    title: "Reserva",
    targetAmount: 1000,
    currentAmount: 200,
    category: "geral",
    createdAt: "2026-04-01T12:00:00.000Z",
    ...overrides,
  };
}

function getInsight(
  insights: ReturnType<typeof getDashboardInsights>,
  id: string,
) {
  const insight = insights.find((item) => item.id === id);

  expect(insight).toBeDefined();

  return insight!;
}

describe("getDashboardInsights", () => {
  it("deve montar os insights principais com dados preenchidos", () => {
    const insights = getDashboardInsights({
      transactions: [
        createTransaction({
          id: "expense-1",
          category: "moradia",
          amount: 900,
        }),
        createTransaction({
          id: "expense-2",
          category: "alimentacao",
          amount: 300,
        }),
        createTransaction({
          id: "income-1",
          type: "income",
          category: "salario",
          amount: 2500,
        }),
      ],
      goals: [
        createGoal({
          id: "goal-1",
          title: "Reserva de emergencia",
          targetAmount: 1000,
          currentAmount: 750,
        }),
        createGoal({
          id: "goal-2",
          title: "Viagem",
          targetAmount: 2000,
          currentAmount: 500,
        }),
      ],
      totalIncome: 2500,
      totalExpense: 1200,
      currentBalance: 1800,
    });

    expect(insights).toHaveLength(5);

    expect(getInsight(insights, "balance-status")).toMatchObject({
      title: "Saldo saudável",
      tone: "positive",
    });

    expect(getInsight(insights, "top-expense-category")).toMatchObject({
      title: "Maior categoria de gasto: Moradia",
      description: `Até agora, ${currencyFormatter.format(900)} saíram nessa categoria.`,
      tone: "warning",
    });

    expect(getInsight(insights, "expense-ratio")).toMatchObject({
      title: "Saídas equivalem a 48% das entradas",
      tone: "positive",
    });

    expect(getInsight(insights, "active-goals")).toMatchObject({
      title: "2 metas ativas",
      tone: "positive",
    });

    expect(getInsight(insights, "closest-goal")).toMatchObject({
      title: "Meta mais próxima: Reserva de emergencia",
      description: `75% concluído, faltando ${currencyFormatter.format(250)}.`,
      tone: "positive",
    });
  });

  it("deve usar fallbacks neutros quando nao ha despesas, entradas ou metas", () => {
    const insights = getDashboardInsights({
      transactions: [
        createTransaction({
          id: "income-1",
          type: "income",
          category: "salario",
          amount: 500,
        }),
      ],
      goals: [],
      totalIncome: 0,
      totalExpense: 0,
      currentBalance: 0,
    });

    expect(getInsight(insights, "balance-status")).toMatchObject({
      title: "Saldo em atenção",
      tone: "warning",
    });

    expect(getInsight(insights, "top-expense-category")).toMatchObject({
      title: "Maior categoria de gasto indisponível",
      tone: "neutral",
    });

    expect(getInsight(insights, "expense-ratio")).toMatchObject({
      title: "Relação entre entradas e saídas indisponível",
      tone: "neutral",
    });

    expect(getInsight(insights, "active-goals")).toMatchObject({
      title: "0 metas ativas",
      tone: "neutral",
    });

    expect(getInsight(insights, "closest-goal")).toMatchObject({
      title: "Nenhuma meta próxima da conclusão ainda",
      tone: "neutral",
    });
  });

  it("deve identificar saldo negativo e relacao de saidas comprometida", () => {
    const insights = getDashboardInsights({
      transactions: [
        createTransaction({
          id: "expense-1",
          amount: 900,
          category: "compras",
        }),
      ],
      goals: [createGoal()],
      totalIncome: 1000,
      totalExpense: 850,
      currentBalance: -10,
    });

    expect(getInsight(insights, "balance-status")).toMatchObject({
      title: "Saldo negativo",
      tone: "warning",
    });

    expect(getInsight(insights, "expense-ratio")).toMatchObject({
      title: "Saídas equivalem a 85% das entradas",
      tone: "warning",
    });
  });

  it("deve ignorar metas concluidas ou invalidas ao escolher a meta mais proxima", () => {
    const insights = getDashboardInsights({
      transactions: [],
      goals: [
        createGoal({
          id: "goal-complete",
          title: "Completa",
          targetAmount: 1000,
          currentAmount: 1000,
        }),
        createGoal({
          id: "goal-invalid",
          title: "Invalida",
          targetAmount: 0,
          currentAmount: 100,
        }),
        createGoal({
          id: "goal-over",
          title: "Ultrapassada",
          targetAmount: 1000,
          currentAmount: 1200,
        }),
        createGoal({
          id: "goal-closest",
          title: "Mais proxima",
          targetAmount: 800,
          currentAmount: 600,
        }),
      ],
      totalIncome: 500,
      totalExpense: 100,
      currentBalance: 400,
    });

    expect(getInsight(insights, "closest-goal")).toMatchObject({
      title: "Meta mais próxima: Mais proxima",
      description: `75% concluído, faltando ${currencyFormatter.format(200)}.`,
      tone: "positive",
    });
  });

  it("deve usar o rotulo padrao para categoria desconhecida e pluralizar uma unica meta", () => {
    const insights = getDashboardInsights({
      transactions: [
        createTransaction({
          id: "expense-1",
          category: "categoria-inexistente",
          amount: 250,
        }),
      ],
      goals: [
        createGoal({
          id: "goal-1",
          title: "Meta unica",
        }),
      ],
      totalIncome: 1000,
      totalExpense: 250,
      currentBalance: 400,
    });

    expect(getInsight(insights, "top-expense-category")).toMatchObject({
      title: "Maior categoria de gasto: Geral",
      description: `Até agora, ${currencyFormatter.format(250)} saíram nessa categoria.`,
    });

    expect(getInsight(insights, "active-goals")).toMatchObject({
      title: "1 meta ativa",
      tone: "positive",
    });
  });
});
