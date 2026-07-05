import type { Transaction } from "@/types/transaction";
import { formatDateValue, parseDateValue } from "@/utils/recurring-transactions";
import type {
  UpcomingTransactionItem,
  UpcomingTransactionsMonthGroup,
} from "@/utils/upcoming-transactions";

const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

function getMonthEnd(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 12);
}

function getFutureMonthStarts(referenceDate: Date, monthsAhead: number) {
  return Array.from({ length: monthsAhead }, (_, index) =>
    new Date(referenceDate.getFullYear(), referenceDate.getMonth() + index + 1, 1, 12),
  );
}

function buildMonthGroups(referenceDate: Date, monthsAhead: number) {
  return getFutureMonthStarts(referenceDate, monthsAhead).map((monthDate) => ({
    id: formatDateValue(monthDate),
    monthLabel: monthFormatter.format(monthDate),
    monthDate: formatDateValue(monthDate),
    monthStart: getMonthStart(monthDate),
    monthEnd: getMonthEnd(monthDate),
    items: [] as UpcomingTransactionItem[],
  }));
}

function pushItemToMonthGroup(
  monthGroups: ReturnType<typeof buildMonthGroups>,
  occurrenceDate: Date,
  item: UpcomingTransactionItem,
) {
  const monthGroup = monthGroups.find(
    (group) => occurrenceDate >= group.monthStart && occurrenceDate <= group.monthEnd,
  );

  if (!monthGroup) {
    return;
  }

  monthGroup.items.push(item);
}

function getMonthBalanceTone({
  totalIncome,
  totalExpense,
  projectedBalance,
}: {
  totalIncome: number;
  totalExpense: number;
  projectedBalance: number;
}): UpcomingTransactionsMonthGroup["balanceTone"] {
  if (projectedBalance < 0) {
    return "warning";
  }

  const monthlyCommitment = Math.max(totalIncome, totalExpense);
  const safetyThreshold = Math.max(monthlyCommitment * 0.15, 200);

  if (projectedBalance === 0 || projectedBalance <= safetyThreshold) {
    return "neutral";
  }

  return "positive";
}

function getMonthBalanceSummary(
  tone: UpcomingTransactionsMonthGroup["balanceTone"],
  projectedBalance: number,
) {
  if (tone === "warning") {
    return "Atenção: as saídas previstas superam as entradas deste mês.";
  }

  if (tone === "neutral") {
    return projectedBalance === 0
      ? "Mês equilibrado, sem folga prevista."
      : "Mês apertado, com pouca margem prevista.";
  }

  return "Mês com folga prevista para absorver os próximos lançamentos.";
}

function getRecurringMarker(transaction: Transaction) {
  if (transaction.recurrenceMode === "until-date" && transaction.recurrenceEndDate) {
    const endDate = parseDateValue(transaction.recurrenceEndDate);
    const endMonthLabel = endDate
      ? new Intl.DateTimeFormat("pt-BR", {
          month: "short",
          year: "numeric",
        }).format(endDate)
      : transaction.recurrenceEndDate;

    return `Recorrente até ${endMonthLabel}`;
  }

  if (transaction.recurrenceMode === "for-months" && transaction.recurrenceMonths) {
    return `Recorrente por ${transaction.recurrenceMonths} meses`;
  }

  return "Recorrente indefinido";
}

function getOccurrenceMarker(transaction: Transaction) {
  if (transaction.transactionKind === "installment-instance") {
    return transaction.installmentIndex && transaction.installmentCount
      ? `Parcela ${transaction.installmentIndex}/${transaction.installmentCount}`
      : "Parcelado";
  }

  if (transaction.transactionKind === "recurring-instance") {
    return getRecurringMarker(transaction);
  }

  return "";
}

/**
 * Equivalente a getUpcomingTransactionsByMonth (utils/upcoming-transactions.ts), mas para
 * o modo API: como as Occurrences futuras já existem de verdade no backend (seção 21 do
 * CLAUDE.md), não há necessidade de projetar datas — só filtrar as pendentes e agrupar
 * por mês.
 */
export function getUpcomingOccurrencesByMonth({
  transactions,
  monthsAhead = 3,
  referenceDate = new Date(),
  baseBalance = 0,
}: {
  transactions: Transaction[];
  monthsAhead?: number;
  referenceDate?: Date;
  baseBalance?: number;
}): UpcomingTransactionsMonthGroup[] {
  const monthGroups = buildMonthGroups(referenceDate, monthsAhead);

  const pendingItems = transactions.filter(
    (transaction) => transaction.occurrenceStatus === "pending",
  );

  for (const transaction of pendingItems) {
    const occurrenceDate = parseDateValue(transaction.occurrenceDate);

    if (!occurrenceDate) {
      continue;
    }

    pushItemToMonthGroup(monthGroups, occurrenceDate, {
      id: transaction.id,
      title: transaction.title,
      amount: transaction.amount,
      type: transaction.type,
      occurrenceDate: formatDateValue(occurrenceDate),
      marker: getOccurrenceMarker(transaction),
      sourceKind: transaction.transactionKind,
    });
  }

  let runningBalance = baseBalance;

  return monthGroups.map((group) => {
    const items = [...group.items].sort((left, right) =>
      left.occurrenceDate.localeCompare(right.occurrenceDate),
    );
    const totalIncome = items
      .filter((item) => item.type === "income")
      .reduce((total, item) => total + item.amount, 0);
    const totalExpense = items
      .filter((item) => item.type === "expense")
      .reduce((total, item) => total + item.amount, 0);
    const projectedBalance = runningBalance + totalIncome - totalExpense;
    runningBalance = projectedBalance;
    const balanceTone = getMonthBalanceTone({
      totalIncome,
      totalExpense,
      projectedBalance,
    });

    return {
      id: group.id,
      monthLabel: group.monthLabel,
      monthDate: group.monthDate,
      items,
      totalIncome,
      totalExpense,
      projectedBalance,
      balanceTone,
      balanceSummary: getMonthBalanceSummary(balanceTone, projectedBalance),
    };
  });
}
