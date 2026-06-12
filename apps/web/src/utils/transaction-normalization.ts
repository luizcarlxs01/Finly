import {
  TRANSACTION_KINDS,
  TRANSACTION_RECURRENCE_MODES,
  TRANSACTION_RECURRENCE_TYPES,
  type Transaction,
  type TransactionKind,
  type TransactionRecurrenceMode,
  type TransactionRecurrenceType,
} from "@/types/transaction";
import {
  DEFAULT_TRANSACTION_CATEGORY,
  TRANSACTION_CATEGORIES,
} from "@/types/transaction-category";
import {
  formatDateValue,
  getTodayDateValue,
  parseDateValue,
} from "@/utils/recurring-transactions";

export function normalizeTransactionCategory(category: unknown) {
  if (typeof category !== "string") {
    return DEFAULT_TRANSACTION_CATEGORY;
  }

  const normalizedCategory = category.trim().toLowerCase();

  if (!normalizedCategory) {
    return DEFAULT_TRANSACTION_CATEGORY;
  }

  return TRANSACTION_CATEGORIES.includes(
    normalizedCategory as (typeof TRANSACTION_CATEGORIES)[number],
  )
    ? normalizedCategory
    : DEFAULT_TRANSACTION_CATEGORY;
}

export function normalizeTransactionRecurringFlag(value: unknown) {
  return value === true;
}

export function normalizeTransactionRecurrenceType(
  recurrenceType: unknown,
): TransactionRecurrenceType | null {
  if (typeof recurrenceType !== "string") {
    return null;
  }

  const normalizedRecurrenceType = recurrenceType.trim().toLowerCase();

  return TRANSACTION_RECURRENCE_TYPES.includes(
    normalizedRecurrenceType as TransactionRecurrenceType,
  )
    ? (normalizedRecurrenceType as TransactionRecurrenceType)
    : null;
}

export function normalizeTransactionRecurrenceMode(
  recurrenceMode: unknown,
): TransactionRecurrenceMode | null {
  if (typeof recurrenceMode !== "string") {
    return null;
  }

  const normalizedRecurrenceMode = recurrenceMode.trim().toLowerCase();

  return TRANSACTION_RECURRENCE_MODES.includes(
    normalizedRecurrenceMode as TransactionRecurrenceMode,
  )
    ? (normalizedRecurrenceMode as TransactionRecurrenceMode)
    : null;
}

export function normalizeTransactionKind(
  transactionKind: unknown,
  isRecurring: boolean,
): TransactionKind {
  if (typeof transactionKind === "string") {
    const normalizedTransactionKind = transactionKind.trim().toLowerCase();

    if (
      TRANSACTION_KINDS.includes(normalizedTransactionKind as TransactionKind)
    ) {
      return normalizedTransactionKind as TransactionKind;
    }
  }

  return isRecurring ? "recurring-template" : "single";
}

export function normalizeTransactionRecurrenceDay(
  recurrenceDay: unknown,
  referenceDate: string,
) {
  if (
    typeof recurrenceDay === "number" &&
    Number.isInteger(recurrenceDay) &&
    recurrenceDay >= 1 &&
    recurrenceDay <= 31
  ) {
    return recurrenceDay;
  }

  const parsedDay =
    typeof recurrenceDay === "string" ? Number.parseInt(recurrenceDay, 10) : NaN;

  if (Number.isInteger(parsedDay) && parsedDay >= 1 && parsedDay <= 31) {
    return parsedDay;
  }

  return parseDateValue(referenceDate)?.getDate() ?? 1;
}

export function normalizeTransactionRecurrenceStartDate(
  recurrenceStartDate: unknown,
  fallbackDate: string,
  options?: {
    minimumDate?: string;
  },
) {
  const normalizedDate =
    parseDateValue(recurrenceStartDate) ?? parseDateValue(fallbackDate);
  const minimumDate = options?.minimumDate
    ? parseDateValue(options.minimumDate)
    : null;

  if (normalizedDate && minimumDate && normalizedDate < minimumDate) {
    return formatDateValue(minimumDate);
  }

  return normalizedDate ? formatDateValue(normalizedDate) : getTodayDateValue();
}

export function normalizeTransactionRecurrenceEndDate(
  recurrenceEndDate: unknown,
  recurrenceStartDate: string,
) {
  const normalizedDate = parseDateValue(recurrenceEndDate);
  const startDate = parseDateValue(recurrenceStartDate);

  if (!normalizedDate || !startDate) {
    return null;
  }

  return formatDateValue(normalizedDate < startDate ? startDate : normalizedDate);
}

export function normalizeTransactionRecurrenceMonths(value: unknown) {
  if (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1
  ) {
    return value;
  }

  const parsedValue =
    typeof value === "string" ? Number.parseInt(value, 10) : NaN;

  if (Number.isInteger(parsedValue) && parsedValue >= 1) {
    return parsedValue;
  }

  return null;
}

export function normalizeTransactionLastGeneratedAt(lastGeneratedAt: unknown) {
  const normalizedDate = parseDateValue(lastGeneratedAt);

  return normalizedDate ? normalizedDate.toISOString() : null;
}

export function normalizeSourceId(
  sourceId: unknown,
  legacySourceId?: unknown,
) {
  if (typeof sourceId === "string" && sourceId.trim()) {
    return sourceId.trim();
  }

  return typeof legacySourceId === "string" && legacySourceId.trim()
    ? legacySourceId.trim()
    : null;
}

export function normalizeOccurrenceDate(
  occurrenceDate: unknown,
  legacyOccurrenceDate?: unknown,
) {
  const normalizedDate =
    parseDateValue(occurrenceDate) ?? parseDateValue(legacyOccurrenceDate);

  return normalizedDate ? formatDateValue(normalizedDate) : null;
}

export function normalizeInstallmentCount(value: unknown) {
  if (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1
  ) {
    return value;
  }

  const parsedValue =
    typeof value === "string" ? Number.parseInt(value, 10) : NaN;

  if (Number.isInteger(parsedValue) && parsedValue >= 1) {
    return parsedValue;
  }

  return null;
}

export function normalizeInstallmentIndex(
  value: unknown,
  installmentCount: number | null,
) {
  if (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    (!installmentCount || value <= installmentCount)
  ) {
    return value;
  }

  const parsedValue =
    typeof value === "string" ? Number.parseInt(value, 10) : NaN;

  if (
    Number.isInteger(parsedValue) &&
    parsedValue >= 1 &&
    (!installmentCount || parsedValue <= installmentCount)
  ) {
    return parsedValue;
  }

  return null;
}

export function normalizeInstallmentStartDate(
  installmentStartDate: unknown,
  fallbackDate: string,
) {
  const normalizedDate =
    parseDateValue(installmentStartDate) ?? parseDateValue(fallbackDate);

  return normalizedDate ? formatDateValue(normalizedDate) : getTodayDateValue();
}

function normalizeRecurringTemplate(
  transaction: Transaction,
  transactionKind: TransactionKind,
) {
  const recurrenceType =
    normalizeTransactionRecurrenceType(transaction.recurrenceType) ?? "monthly";
  const recurrenceStartDate = normalizeTransactionRecurrenceStartDate(
    transaction.recurrenceStartDate,
    transaction.createdAt,
  );
  const recurrenceDay = normalizeTransactionRecurrenceDay(
    transaction.recurrenceDay,
    recurrenceStartDate,
  );
  const normalizedRecurrenceMode =
    normalizeTransactionRecurrenceMode(transaction.recurrenceMode) ??
    "indefinite";
  const recurrenceEndDate = normalizeTransactionRecurrenceEndDate(
    transaction.recurrenceEndDate,
    recurrenceStartDate,
  );
  const recurrenceMonths = normalizeTransactionRecurrenceMonths(
    transaction.recurrenceMonths,
  );

  const recurrenceMode =
    normalizedRecurrenceMode === "until-date" && recurrenceEndDate
      ? "until-date"
      : normalizedRecurrenceMode === "for-months" && recurrenceMonths
        ? "for-months"
        : "indefinite";

  return {
    ...transaction,
    category: normalizeTransactionCategory(transaction.category),
    transactionKind,
    sourceId: null,
    occurrenceDate: normalizeOccurrenceDate(
      transaction.occurrenceDate,
      transaction.createdAt,
    ),
    installmentIndex: null,
    installmentCount: null,
    installmentStartDate: null,
    recurringSourceId: null,
    recurringOccurrenceDate: null,
    isRecurring: true,
    recurrenceType,
    recurrenceMode,
    recurrenceDay,
    recurrenceStartDate,
    recurrenceEndDate: recurrenceMode === "until-date" ? recurrenceEndDate : null,
    recurrenceMonths: recurrenceMode === "for-months" ? recurrenceMonths : null,
    lastGeneratedAt: normalizeTransactionLastGeneratedAt(transaction.lastGeneratedAt),
  } satisfies Transaction;
}

export function normalizeTransaction(transaction: Transaction): Transaction {
  const isRecurring = normalizeTransactionRecurringFlag(transaction.isRecurring);
  const transactionKind = normalizeTransactionKind(
    transaction.transactionKind,
    isRecurring,
  );

  if (transactionKind === "recurring-instance") {
    const sourceId = normalizeSourceId(
      transaction.sourceId,
      transaction.recurringSourceId,
    );
    const occurrenceDate = normalizeOccurrenceDate(
      transaction.occurrenceDate,
      transaction.recurringOccurrenceDate,
    );

    return {
      ...transaction,
      category: normalizeTransactionCategory(transaction.category),
      transactionKind,
      sourceId,
      occurrenceDate,
      installmentIndex: null,
      installmentCount: null,
      installmentStartDate: null,
      recurringSourceId: sourceId,
      recurringOccurrenceDate: occurrenceDate,
      isRecurring: false,
      recurrenceType: null,
      recurrenceMode: null,
      recurrenceDay: null,
      recurrenceStartDate: null,
      recurrenceEndDate: null,
      recurrenceMonths: null,
      lastGeneratedAt: null,
    };
  }

  if (transactionKind === "installment-instance") {
    const installmentCount = normalizeInstallmentCount(transaction.installmentCount);

    return {
      ...transaction,
      category: normalizeTransactionCategory(transaction.category),
      transactionKind,
      sourceId: normalizeSourceId(transaction.sourceId),
      occurrenceDate: normalizeOccurrenceDate(transaction.occurrenceDate),
      installmentIndex: normalizeInstallmentIndex(
        transaction.installmentIndex,
        installmentCount,
      ),
      installmentCount,
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
    };
  }

  if (transactionKind === "installment-template") {
    return {
      ...transaction,
      category: normalizeTransactionCategory(transaction.category),
      transactionKind,
      sourceId: null,
      occurrenceDate: null,
      installmentIndex: null,
      installmentCount: normalizeInstallmentCount(transaction.installmentCount),
      installmentStartDate: normalizeInstallmentStartDate(
        transaction.installmentStartDate,
        transaction.createdAt,
      ),
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
    };
  }

  if (transactionKind === "recurring-template") {
    return normalizeRecurringTemplate(transaction, transactionKind);
  }

  return {
    ...transaction,
    category: normalizeTransactionCategory(transaction.category),
    transactionKind,
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
  };
}
