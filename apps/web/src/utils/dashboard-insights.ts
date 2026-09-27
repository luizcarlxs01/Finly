import type { Transaction } from "@/types/finance";
import type { Goal } from "@/types/goal";
import { getTransactionCategoryLabel } from "@/types/transaction-category";
import type { SpendingThresholds } from "@/utils/spending-profile";

export type DashboardInsightTone = "neutral" | "positive" | "warning";

export type DashboardInsight = {
  id: string;
  title: string;
  description: string;
  tone: DashboardInsightTone;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getTopExpenseCategory(transactions: Transaction[]) {
  const categoryTotals = new Map<string, number>();

  for (const transaction of transactions) {
    if (transaction.type !== "expense") {
      continue;
    }

    categoryTotals.set(
      transaction.category,
      (categoryTotals.get(transaction.category) ?? 0) + transaction.amount,
    );
  }

  let topCategory: string | null = null;
  let topAmount = 0;

  for (const [category, amount] of categoryTotals.entries()) {
    if (amount > topAmount) {
      topCategory = category;
      topAmount = amount;
    }
  }

  if (!topCategory) {
    return null;
  }

  return {
    category: topCategory,
    amount: topAmount,
  };
}

function getClosestGoal(goals: Goal[]) {
  const goalsWithProgress = goals
    .filter((goal) => goal.targetAmount > 0)
    .map((goal) => ({
      goal,
      percentage: Math.min((goal.currentAmount / goal.targetAmount) * 100, 100),
    }))
    .filter(({ percentage }) => percentage < 100);

  if (goalsWithProgress.length === 0) {
    return null;
  }

  goalsWithProgress.sort((left, right) => right.percentage - left.percentage);
  return goalsWithProgress[0];
}

/**
 * Classifica o saldo atual conforme os limiares do perfil de gastos (seção 29
 * do CLAUDE.md) — não é mais um corte único de 50% da despesa pra todo mundo.
 * Negativo é sempre "ruim", independente do perfil.
 */
function getBalanceStatus(currentBalance: number, thresholds: SpendingThresholds) {
  if (currentBalance < 0) {
    return {
      label: "Saldo negativo",
      description:
        "Seu saldo atual está abaixo de zero e pede revisão das próximas movimentações.",
      tone: "warning" as const,
    };
  }

  if (currentBalance >= thresholds.good) {
    return {
      label: "Saldo saudável",
      description:
        "Seu saldo atual mantém uma folga confortável para o seu perfil de gastos.",
      tone: "positive" as const,
    };
  }

  if (currentBalance >= thresholds.ok) {
    return {
      label: "Saldo em atenção",
      description:
        "Seu saldo está numa faixa intermediária para o seu perfil — dá pra melhorar.",
      tone: "neutral" as const,
    };
  }

  return {
    label: "Saldo baixo",
    description:
      "Seu saldo está abaixo do esperado para o seu perfil de gastos.",
    tone: "warning" as const,
  };
}

export function getDashboardInsights(input: {
  transactions: Transaction[];
  goals: Goal[];
  totalIncome: number;
  totalExpense: number;
  currentBalance: number;
  spendingThresholds: SpendingThresholds;
}) {
  const { transactions, goals, totalIncome, totalExpense, currentBalance, spendingThresholds } =
    input;

  const topExpenseCategory = getTopExpenseCategory(transactions);
  const expenseRatio =
    totalIncome > 0 ? Math.round((totalExpense / totalIncome) * 100) : null;
  const closestGoal = getClosestGoal(goals);
  const balanceStatus = getBalanceStatus(currentBalance, spendingThresholds);

  const insights: DashboardInsight[] = [
    {
      id: "balance-status",
      title: balanceStatus.label,
      description: balanceStatus.description,
      tone: balanceStatus.tone,
    },
    {
      id: "top-expense-category",
      title: topExpenseCategory
        ? `Maior categoria de gasto: ${getTransactionCategoryLabel(
            topExpenseCategory.category,
          )}`
        : "Maior categoria de gasto indisponível",
      description: topExpenseCategory
        ? `Até agora, ${formatCurrency(topExpenseCategory.amount)} saíram nessa categoria.`
        : "Adicione saídas para entender onde seu dinheiro está concentrado.",
      tone: topExpenseCategory ? "warning" : "neutral",
    },
    {
      id: "expense-ratio",
      title:
        expenseRatio !== null
          ? `Saídas equivalem a ${expenseRatio}% das entradas`
          : "Relação entre entradas e saídas indisponível",
      description:
        expenseRatio !== null
          ? "Essa leitura ajuda a entender o quanto sua receita já está comprometida."
          : "Registre entradas para acompanhar melhor o peso das saídas.",
      tone:
        expenseRatio === null
          ? "neutral"
          : expenseRatio <= 70
            ? "positive"
            : "warning",
    },
    {
      id: "active-goals",
      title: `${goals.length} meta${goals.length === 1 ? "" : "s"} ativa${
        goals.length === 1 ? "" : "s"
      }`,
      description:
        goals.length > 0
          ? "Suas metas já fazem parte da leitura estratégica da dashboard."
          : "Crie metas para começar a acompanhar objetivos financeiros no MVP.",
      tone: goals.length > 0 ? "positive" : "neutral",
    },
    {
      id: "closest-goal",
      title: closestGoal
        ? `Meta mais próxima: ${closestGoal.goal.title}`
        : "Nenhuma meta próxima da conclusão ainda",
      description: closestGoal
        ? `${closestGoal.percentage.toFixed(0)}% concluído, faltando ${formatCurrency(
            Math.max(
              closestGoal.goal.targetAmount - closestGoal.goal.currentAmount,
              0,
            ),
          )}.`
        : "Conforme suas metas avançarem, esta seção mostra o objetivo mais perto de ser concluído.",
      tone: closestGoal ? "positive" : "neutral",
    },
  ];

  return insights;
}
