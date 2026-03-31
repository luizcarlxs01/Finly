import type { Transaction } from "@/types/transaction";
import {
  createMonthlyOccurrence,
  formatDateValue,
  getNextMonthlyOccurrenceAfter,
  parseDateValue,
} from "@/utils/recurring-transactions";

export type UpcomingTransactionItem = {
  id: string;
  title: string;
  amount: number;
  type: Transaction["type"];
  occurrenceDate: string;
  marker: string;
  sourceKind: Transaction["transactionKind"];
};

export type UpcomingTransactionsMonthGroup = {
  id: string;
  monthLabel: string;
  monthDate: string;
  items: UpcomingTransactionItem[];
  totalIncome: number;
  totalExpense: number;
  projectedBalance: number;
  balanceTone: "neutral" | "positive" | "warning";
  balanceSummary: string;
};

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

function getOccurrenceKey(sourceId: string, occurrenceDate: string) {
  return `${sourceId}:${occurrenceDate}`;
}

function getTransactionOccurrenceDate(transaction: Transaction) {
  const value = transaction.occurrenceDate ?? transaction.recurringOccurrenceDate;

  return value ? parseDateValue(value) : null;
}

function getTransactionSourceId(transaction: Transaction) {
  return transaction.sourceId ?? transaction.recurringSourceId;
}

function getRecurringMarker(
  recurrenceMode: Transaction["recurrenceMode"],
  recurrenceEndDate: string | null,
  recurrenceMonths: number | null,
) {
  if (recurrenceMode === "until-date" && recurrenceEndDate) {
    const endDate = parseDateValue(recurrenceEndDate);
    const endMonthLabel = endDate
      ? new Intl.DateTimeFormat("pt-BR", {
          month: "short",
          year: "numeric",
        }).format(endDate)
      : recurrenceEndDate;

    return `Recorrente até ${endMonthLabel}`;
  }

  if (recurrenceMode === "for-months" && recurrenceMonths) {
    return `Recorrente por ${recurrenceMonths} meses`;
  }

  return recurrenceMode === "indefinite"
    ? "Recorrente indefinido"
    : "Recorrente";
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

function createProjectedRecurringItems(
  transactions: Transaction[],
  monthGroups: ReturnType<typeof buildMonthGroups>,
  existingProjectedKeys: Set<string>,
) {
  for (const transaction of transactions) {
    if (
      transaction.transactionKind !== "recurring-template" ||
      transaction.recurrenceType !== "monthly" ||
      !transaction.recurrenceDay ||
      !transaction.recurrenceStartDate
    ) {
      continue;
    }

    const startDate = parseDateValue(transaction.recurrenceStartDate);

    if (!startDate) {
      continue;
    }

    for (const group of monthGroups) {
      const occurrenceDate = createMonthlyOccurrence(
        group.monthStart.getFullYear(),
        group.monthStart.getMonth(),
        transaction.recurrenceDay,
      );

      if (occurrenceDate < startDate) {
        continue;
      }

      if (transaction.recurrenceMode === "until-date") {
        const endDate = parseDateValue(transaction.recurrenceEndDate);

        if (endDate && occurrenceDate > endDate) {
          continue;
        }
      }

      if (transaction.recurrenceMode === "for-months" && transaction.recurrenceMonths) {
        const occurrenceCursor = startDate;
        let currentOccurrence = occurrenceCursor;
        let allowed = false;

        for (let index = 0; index < transaction.recurrenceMonths; index += 1) {
          if (formatDateValue(currentOccurrence) === formatDateValue(occurrenceDate)) {
            allowed = true;
            break;
          }

          currentOccurrence = getNextMonthlyOccurrenceAfter(
            currentOccurrence,
            transaction.recurrenceDay,
          );
        }

        if (!allowed) {
          continue;
        }
      }

      const projectedKey = getOccurrenceKey(transaction.id, formatDateValue(occurrenceDate));

      if (existingProjectedKeys.has(projectedKey)) {
        continue;
      }

      existingProjectedKeys.add(projectedKey);

      pushItemToMonthGroup(monthGroups, occurrenceDate, {
        id: projectedKey,
        title: transaction.title,
        amount: transaction.amount,
        type: transaction.type,
        occurrenceDate: formatDateValue(occurrenceDate),
        marker: getRecurringMarker(
          transaction.recurrenceMode,
          transaction.recurrenceEndDate,
          transaction.recurrenceMonths,
        ),
        sourceKind: "recurring-instance",
      });
    }
  }
}

function createProjectedInstallmentItems(
  transactions: Transaction[],
  monthGroups: ReturnType<typeof buildMonthGroups>,
  existingProjectedKeys: Set<string>,
) {
  for (const transaction of transactions) {
    if (
      transaction.transactionKind !== "installment-template" ||
      !transaction.installmentCount ||
      !transaction.installmentStartDate
    ) {
      continue;
    }

    const startDate = parseDateValue(transaction.installmentStartDate);

    if (!startDate) {
      continue;
    }

    let occurrenceDate = startDate;

    for (
      let installmentIndex = 1;
      installmentIndex <= transaction.installmentCount;
      installmentIndex += 1
    ) {
      const projectedKey = getOccurrenceKey(
        transaction.id,
        formatDateValue(occurrenceDate),
      );

      if (!existingProjectedKeys.has(projectedKey)) {
        pushItemToMonthGroup(monthGroups, occurrenceDate, {
          id: projectedKey,
          title: transaction.title,
          amount: transaction.amount,
          type: transaction.type,
          occurrenceDate: formatDateValue(occurrenceDate),
          marker: `Parcela ${installmentIndex}/${transaction.installmentCount}`,
          sourceKind: "installment-instance",
        });
        existingProjectedKeys.add(projectedKey);
      }

      occurrenceDate = getNextMonthlyOccurrenceAfter(
        occurrenceDate,
        startDate.getDate(),
      );
    }
  }
}

function createFutureInstanceItems(
  transactions: Transaction[],
  monthGroups: ReturnType<typeof buildMonthGroups>,
  existingProjectedKeys: Set<string>,
) {
  const templatesById = new Map(transactions.map((transaction) => [transaction.id, transaction]));

  for (const transaction of transactions) {
    if (
      transaction.transactionKind !== "recurring-instance" &&
      transaction.transactionKind !== "installment-instance"
    ) {
      continue;
    }

    const occurrenceDate = getTransactionOccurrenceDate(transaction);
    const sourceId = getTransactionSourceId(transaction);

    if (!occurrenceDate || !sourceId) {
      continue;
    }

    const occurrenceDateValue = formatDateValue(occurrenceDate);
    const projectedKey = getOccurrenceKey(sourceId, occurrenceDateValue);

    if (existingProjectedKeys.has(projectedKey)) {
      continue;
    }

    const sourceTemplate = templatesById.get(sourceId);
    const marker =
      transaction.transactionKind === "installment-instance"
        ? `Parcela ${transaction.installmentIndex}/${transaction.installmentCount}`
        : getRecurringMarker(
            sourceTemplate?.recurrenceMode ?? "indefinite",
            sourceTemplate?.recurrenceEndDate ?? null,
            sourceTemplate?.recurrenceMonths ?? null,
          );

    existingProjectedKeys.add(projectedKey);

    pushItemToMonthGroup(monthGroups, occurrenceDate, {
      id: `${transaction.id}:${occurrenceDateValue}`,
      title: transaction.title,
      amount: transaction.amount,
      type: transaction.type,
      occurrenceDate: occurrenceDateValue,
      marker,
      sourceKind: transaction.transactionKind,
    });
  }
}

export function getUpcomingTransactionsByMonth({
  transactions,
  monthsAhead = 3,
  referenceDate = new Date(),
}: {
  transactions: Transaction[];
  monthsAhead?: number;
  referenceDate?: Date;
}): UpcomingTransactionsMonthGroup[] {
  const monthGroups = buildMonthGroups(referenceDate, monthsAhead);
  const existingProjectedKeys = new Set<string>();

  createFutureInstanceItems(transactions, monthGroups, existingProjectedKeys);
  createProjectedRecurringItems(transactions, monthGroups, existingProjectedKeys);
  createProjectedInstallmentItems(transactions, monthGroups, existingProjectedKeys);

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
    const projectedBalance = totalIncome - totalExpense;
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
