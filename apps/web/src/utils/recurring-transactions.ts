import type { Transaction } from "@/types/transaction";

type SynchronizeRecurringTransactionsInput = {
  transactions: Transaction[];
  referenceDate?: string;
};

type SynchronizeRecurringTransactionsResult = {
  transactions: Transaction[];
  generatedCount: number;
};

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

export function getOccurrenceKey(sourceId: string, occurrenceDate: Date) {
  return `${sourceId}:${formatDateValue(occurrenceDate)}`;
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

function getSourceId(transaction: Transaction) {
  if (typeof transaction.sourceId === "string" && transaction.sourceId.trim()) {
    return transaction.sourceId.trim();
  }

  if (
    typeof transaction.recurringSourceId === "string" &&
    transaction.recurringSourceId.trim()
  ) {
    return transaction.recurringSourceId.trim();
  }

  return null;
}

function getOccurrenceDate(transaction: Transaction) {
  return parseDateValue(transaction.occurrenceDate) ??
    parseDateValue(transaction.recurringOccurrenceDate);
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

function createRecurringInstance(
  transaction: Transaction,
  dueDate: Date,
): Transaction {
  const occurrenceDate = formatDateValue(dueDate);

  return {
    id: crypto.randomUUID(),
    title: transaction.title,
    amount: transaction.amount,
    type: transaction.type,
    category: transaction.category,
    transactionKind: "recurring-instance",
    sourceId: transaction.id,
    occurrenceDate,
    installmentIndex: null,
    installmentCount: null,
    installmentStartDate: null,
    recurringSourceId: transaction.id,
    recurringOccurrenceDate: occurrenceDate,
    isRecurring: false,
    recurrenceType: null,
    recurrenceMode: null,
    recurrenceDay: null,
    recurrenceStartDate: null,
    recurrenceEndDate: null,
    recurrenceMonths: null,
    lastGeneratedAt: null,
    createdAt: dueDate.toISOString(),
  };
}

export function synchronizeRecurringTransactions({
  transactions,
  referenceDate,
}: SynchronizeRecurringTransactionsInput): SynchronizeRecurringTransactionsResult {
  const synchronizedTransactions = [...transactions];
  const recurringInstances = new Set<string>();
  const currentDate = getReferenceDate(referenceDate);

  for (const transaction of transactions) {
    if (transaction.transactionKind !== "recurring-instance") {
      continue;
    }

    const sourceId = getSourceId(transaction);
    const occurrenceDate = getOccurrenceDate(transaction);

    if (!sourceId || !occurrenceDate) {
      continue;
    }

    recurringInstances.add(getOccurrenceKey(sourceId, occurrenceDate));
  }

  let generatedCount = 0;

  for (let index = 0; index < synchronizedTransactions.length; index += 1) {
    const transaction = synchronizedTransactions[index];
    const startDate = parseDateValue(transaction.recurrenceStartDate);

    if (
      !currentDate ||
      !startDate ||
      !isRecurringTemplateTransaction(transaction) ||
      startDate > currentDate
    ) {
      continue;
    }

    let latestGeneratedOccurrence = getLatestGeneratedOccurrenceDate(transaction);
    let nextOccurrence = latestGeneratedOccurrence
      ? getNextMonthlyOccurrenceAfter(
          latestGeneratedOccurrence,
          transaction.recurrenceDay!,
        )
      : startDate;

    while (
      nextOccurrence <= currentDate &&
      isOccurrenceWithinRecurringLimit(transaction, nextOccurrence, startDate)
    ) {
      const recurringKey = getOccurrenceKey(transaction.id, nextOccurrence);

      if (!recurringInstances.has(recurringKey)) {
        synchronizedTransactions.push(
          createRecurringInstance(transaction, nextOccurrence),
        );
        recurringInstances.add(recurringKey);
        generatedCount += 1;
      }

      latestGeneratedOccurrence = nextOccurrence;
      nextOccurrence = getNextMonthlyOccurrenceAfter(
        latestGeneratedOccurrence,
        transaction.recurrenceDay!,
      );
    }

    const latestGeneratedAt =
      latestGeneratedOccurrence &&
      isOccurrenceWithinRecurringLimit(
        transaction,
        latestGeneratedOccurrence,
        startDate,
      )
        ? latestGeneratedOccurrence.toISOString()
        : null;

    if (transaction.lastGeneratedAt !== latestGeneratedAt) {
      synchronizedTransactions[index] = {
        ...transaction,
        lastGeneratedAt: latestGeneratedAt,
      };
    }
  }

  return {
    transactions: synchronizedTransactions,
    generatedCount,
  };
}
