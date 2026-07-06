import type { Transaction } from "@/types/transaction";

export function createDateValue(year: number, monthIndex: number, day: number) {
  return new Date(year, monthIndex, day, 12);
}

export function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function parseDateValue(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const dateOnlyMatch = trimmedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;

    return createDateValue(Number(year), Number(month) - 1, Number(day));
  }

  const parsedDate = new Date(trimmedValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return createDateValue(
    parsedDate.getFullYear(),
    parsedDate.getMonth(),
    parsedDate.getDate(),
  );
}

export function getTodayDateValue() {
  return formatDateValue(new Date());
}

export function getTodayRecurrenceDay() {
  return String(new Date().getDate());
}

export function getReferenceDate(referenceDate?: string) {
  return parseDateValue(referenceDate) ?? parseDateValue(getTodayDateValue());
}

export function getDaysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function createMonthlyOccurrence(
  year: number,
  monthIndex: number,
  recurrenceDay: number,
) {
  const day = Math.min(recurrenceDay, getDaysInMonth(year, monthIndex));

  return createDateValue(year, monthIndex, day);
}

export function getNextMonthlyOccurrenceAfter(
  occurrenceDate: Date,
  recurrenceDay: number,
) {
  const nextMonthIndex =
    occurrenceDate.getMonth() === 11 ? 0 : occurrenceDate.getMonth() + 1;
  const nextYear =
    occurrenceDate.getMonth() === 11
      ? occurrenceDate.getFullYear() + 1
      : occurrenceDate.getFullYear();

  return createMonthlyOccurrence(nextYear, nextMonthIndex, recurrenceDay);
}

function getMonthDifference(startDate: Date, endDate: Date) {
  return (
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth())
  );
}

function isRecurringTemplateTransaction(transaction: Transaction) {
  return (
    transaction.transactionKind === "recurring-template" &&
    transaction.isRecurring &&
    transaction.recurrenceType === "monthly" &&
    Boolean(transaction.recurrenceDay) &&
    Boolean(transaction.recurrenceStartDate)
  );
}

function isOccurrenceWithinRecurringLimit(
  transaction: Transaction,
  occurrenceDate: Date,
  startDate: Date,
) {
  if (occurrenceDate < startDate) {
    return false;
  }

  const recurrenceMode = transaction.recurrenceMode ?? "indefinite";

  if (recurrenceMode === "until-date") {
    const endDate = parseDateValue(transaction.recurrenceEndDate);

    return endDate ? occurrenceDate <= endDate : true;
  }

  if (recurrenceMode === "for-months") {
    const recurrenceMonths = transaction.recurrenceMonths;

    if (!recurrenceMonths || recurrenceMonths < 1) {
      return true;
    }

    return getMonthDifference(startDate, occurrenceDate) < recurrenceMonths;
  }

  return true;
}

function getLatestGeneratedOccurrenceDate(transaction: Transaction) {
  if (!isRecurringTemplateTransaction(transaction)) {
    return null;
  }

  const startDate = parseDateValue(transaction.recurrenceStartDate);
  const lastGeneratedAt = parseDateValue(transaction.lastGeneratedAt);

  if (!startDate) {
    return null;
  }

  if (
    lastGeneratedAt &&
    lastGeneratedAt >= startDate &&
    isOccurrenceWithinRecurringLimit(transaction, lastGeneratedAt, startDate)
  ) {
    return lastGeneratedAt;
  }

  return null;
}

export function getNextRecurringOccurrenceDate(
  transaction: Transaction,
  referenceDate?: string,
) {
  if (!isRecurringTemplateTransaction(transaction)) {
    return null;
  }

  const startDate = parseDateValue(transaction.recurrenceStartDate);
  const currentDate = getReferenceDate(referenceDate);

  if (!startDate || !currentDate) {
    return null;
  }

  const latestGeneratedOccurrence = getLatestGeneratedOccurrenceDate(transaction);
  const nextOccurrence = latestGeneratedOccurrence
    ? getNextMonthlyOccurrenceAfter(
        latestGeneratedOccurrence,
        transaction.recurrenceDay!,
      )
    : startDate;

  return isOccurrenceWithinRecurringLimit(transaction, nextOccurrence, startDate)
    ? formatDateValue(nextOccurrence)
    : null;
}
