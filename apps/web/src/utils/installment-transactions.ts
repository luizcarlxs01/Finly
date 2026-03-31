import type { Transaction } from "@/types/transaction";
import {
  formatDateValue,
  getOccurrenceKey,
  getNextMonthlyOccurrenceAfter,
  getReferenceDate,
  parseDateValue,
} from "@/utils/recurring-transactions";

type SynchronizeInstallmentTransactionsInput = {
  transactions: Transaction[];
  referenceDate?: string;
};

type SynchronizeInstallmentTransactionsResult = {
  transactions: Transaction[];
  generatedCount: number;
};

function isInstallmentTemplateTransaction(transaction: Transaction) {
  return (
    transaction.transactionKind === "installment-template" &&
    Boolean(transaction.installmentCount) &&
    Boolean(transaction.installmentStartDate)
  );
}

function getInstallmentInstanceKey(sourceId: string, occurrenceDate: Date) {
  return getOccurrenceKey(sourceId, occurrenceDate);
}

function getInstallmentOccurrencesUpToDate(
  startDate: Date,
  installmentCount: number,
  referenceDate: Date,
) {
  const occurrences: Date[] = [];
  let occurrenceDate = startDate;

  for (
    let installmentIndex = 1;
    installmentIndex <= installmentCount && occurrenceDate <= referenceDate;
    installmentIndex += 1
  ) {
    occurrences.push(occurrenceDate);
    occurrenceDate = getNextMonthlyOccurrenceAfter(
      occurrenceDate,
      startDate.getDate(),
    );
  }

  return occurrences;
}

function createInstallmentInstance(
  transaction: Transaction,
  occurrenceDate: Date,
  installmentIndex: number,
): Transaction {
  const normalizedOccurrenceDate = formatDateValue(occurrenceDate);

  return {
    id: crypto.randomUUID(),
    title: transaction.title,
    amount: transaction.amount,
    type: transaction.type,
    category: transaction.category,
    transactionKind: "installment-instance",
    sourceId: transaction.id,
    occurrenceDate: normalizedOccurrenceDate,
    installmentIndex,
    installmentCount: transaction.installmentCount,
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
    createdAt: occurrenceDate.toISOString(),
  };
}

export function synchronizeInstallmentTransactions({
  transactions,
  referenceDate,
}: SynchronizeInstallmentTransactionsInput): SynchronizeInstallmentTransactionsResult {
  const synchronizedTransactions = [...transactions];
  const installmentInstances = new Set<string>();
  const currentDate = getReferenceDate(referenceDate);

  if (!currentDate) {
    return {
      transactions: synchronizedTransactions,
      generatedCount: 0,
    };
  }

  for (const transaction of transactions) {
    if (transaction.transactionKind !== "installment-instance") {
      continue;
    }

    const sourceId =
      typeof transaction.sourceId === "string" && transaction.sourceId.trim()
        ? transaction.sourceId.trim()
        : null;
    const occurrenceDate = parseDateValue(transaction.occurrenceDate);

    if (!sourceId || !occurrenceDate) {
      continue;
    }

    installmentInstances.add(
      getInstallmentInstanceKey(sourceId, occurrenceDate),
    );
  }

  let generatedCount = 0;

  for (const transaction of synchronizedTransactions) {
    if (!isInstallmentTemplateTransaction(transaction)) {
      continue;
    }

    const installmentCount = transaction.installmentCount;
    const startDate = parseDateValue(transaction.installmentStartDate);

    if (!installmentCount || !startDate || startDate > currentDate) {
      continue;
    }

    const dueOccurrences = getInstallmentOccurrencesUpToDate(
      startDate,
      installmentCount,
      currentDate,
    );

    for (let index = 0; index < dueOccurrences.length; index += 1) {
      const occurrenceDate = dueOccurrences[index];
      const installmentKey = getInstallmentInstanceKey(
        transaction.id,
        occurrenceDate,
      );

      if (installmentInstances.has(installmentKey)) {
        continue;
      }

      synchronizedTransactions.push(
        createInstallmentInstance(transaction, occurrenceDate, index + 1),
      );
      installmentInstances.add(installmentKey);
      generatedCount += 1;
    }
  }

  return {
    transactions: synchronizedTransactions,
    generatedCount,
  };
}
