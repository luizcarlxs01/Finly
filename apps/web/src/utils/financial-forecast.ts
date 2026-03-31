import type { Transaction } from "@/types/finance";
import { parseDateValue } from "@/utils/recurring-transactions";

type MonthlyForecastResult = {
  totalIncome: number;
  totalExpense: number;
  projectedBalance: number;
};

function getLastDayOfMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function buildOccurrenceDate(year: number, monthIndex: number, day: number) {
  const validDay = Math.min(day, getLastDayOfMonth(year, monthIndex));

  return new Date(year, monthIndex, validDay, 12);
}

export function getMonthlyForecast({
  transactions,
  referenceDate,
  currentBalance,
}: {
  transactions: Transaction[];
  referenceDate: Date;
  currentBalance: number;
}): MonthlyForecastResult {
  const targetYear = referenceDate.getFullYear();
  const targetMonthIndex = referenceDate.getMonth() + 1;

  let totalIncome = 0;
  let totalExpense = 0;

  for (const transaction of transactions) {
    if (transaction.transactionKind !== "recurring-template") {
      continue;
    }

    if (
      transaction.recurrenceType !== "monthly" ||
      !transaction.recurrenceDay ||
      !transaction.recurrenceStartDate
    ) {
      continue;
    }

    const recurrenceStartDate = parseDateValue(transaction.recurrenceStartDate);

    if (!recurrenceStartDate) {
      continue;
    }

    const forecastOccurrenceDate = buildOccurrenceDate(
      targetYear,
      targetMonthIndex,
      transaction.recurrenceDay,
    );

    if (forecastOccurrenceDate < recurrenceStartDate) {
      continue;
    }

    if (transaction.type === "income") {
      totalIncome += transaction.amount;
    } else {
      totalExpense += transaction.amount;
    }
  }

  return {
    totalIncome,
    totalExpense,
    projectedBalance: currentBalance + totalIncome - totalExpense,
  };
}
