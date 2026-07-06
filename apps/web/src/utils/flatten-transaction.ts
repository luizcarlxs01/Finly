import type { ApiTransaction } from "@/types/api-transaction";
import type { OccurrenceStatus } from "@/types/occurrence";
import type {
  Transaction,
  TransactionKind,
  TransactionRecurrenceMode,
  TransactionType,
} from "@/types/transaction";

export function normalizeTransactionType(value: string): TransactionType {
  return value.trim().toLowerCase() === "income" ? "income" : "expense";
}

/**
 * O contrato (ApiTransaction.transactionKind) só assume "Single"/"Installment"/"Recurring"
 * no modelo novo (seção 21 do CLAUDE.md). O check por substring também cobre defensivamente
 * os valores legados depreciados (InstallmentTemplate/Instance, RecurringTemplate/Instance)
 * caso alguma linha antiga ainda exista no banco.
 */
export function getDisplayKindForOccurrence(contractKind: string): TransactionKind {
  const normalizedValue = contractKind.trim().toLowerCase();

  if (normalizedValue.includes("installment")) {
    return "installment-instance";
  }

  if (normalizedValue.includes("recurring")) {
    return "recurring-instance";
  }

  return "single";
}

export function normalizeOccurrenceStatus(value: string): OccurrenceStatus {
  return value.trim().toLowerCase() === "paid" ? "paid" : "pending";
}

export function inferRecurrenceMode(
  transaction: ApiTransaction,
): TransactionRecurrenceMode | null {
  if (transaction.recurrenceEndDate) {
    return "until-date";
  }

  if (transaction.recurrenceMonths) {
    return "for-months";
  }

  return transaction.isRecurring ? "indefinite" : null;
}

/**
 * Achata um contrato (Transaction) com suas Occurrences embutidas em N linhas de UI — uma
 * por Occurrence — já que a UI continua precisando de 1 linha por ocorrência (parcela/
 * competência), enquanto o contrato representa a série inteira (seção 21 do CLAUDE.md).
 * Usado tanto pelo modo API (ApiTransaction vindo de GET /api/Transactions) quanto pelo modo
 * local (LocalTransactionContract + Occurrences do localStorage, unidas antes de chamar esta
 * função) — é a mesma regra de negócio nos dois casos, por isso vive num único lugar.
 */
export function flattenApiTransactionToLineItems(transaction: ApiTransaction): Transaction[] {
  const displayKind = getDisplayKindForOccurrence(transaction.transactionKind);
  const recurrenceMode = inferRecurrenceMode(transaction);

  return transaction.occurrences.map((occurrence) => ({
    id: occurrence.id,
    title: transaction.title,
    amount: occurrence.amount,
    type: normalizeTransactionType(transaction.type),
    category: transaction.category,
    transactionKind: displayKind,
    sourceId: transaction.id,
    occurrenceDate: occurrence.dueDate,
    installmentIndex: occurrence.installmentIndex,
    installmentCount: transaction.installmentCount,
    installmentStartDate: null,
    recurringSourceId: displayKind === "recurring-instance" ? transaction.id : null,
    recurringOccurrenceDate:
      displayKind === "recurring-instance" ? occurrence.dueDate : null,
    isRecurring: transaction.isRecurring,
    recurrenceType: displayKind === "recurring-instance" ? "monthly" : null,
    recurrenceMode,
    recurrenceDay: transaction.recurrenceDay,
    recurrenceStartDate: transaction.recurrenceStartDate,
    recurrenceEndDate: transaction.recurrenceEndDate,
    recurrenceMonths: transaction.recurrenceMonths,
    lastGeneratedAt: null,
    createdAt: transaction.createdAt,
    occurrenceId: occurrence.id,
    occurrenceStatus: normalizeOccurrenceStatus(occurrence.status),
    isCustomized: occurrence.isCustomized,
  }));
}
