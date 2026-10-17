import type { Transaction } from "@/types/transaction";
import type { TransactionSortOption } from "@/components/dashboard/transaction-advanced-filters";
import { formatDateBr } from "@/utils/date-format";

export function getTransactionDateValue(transaction: Transaction) {
  const date = transaction.occurrenceDate ?? transaction.recurringOccurrenceDate ?? transaction.installmentStartDate ?? transaction.recurrenceStartDate;
  if (date) return date.slice(0, 10);
  const formatted = formatDateBr(transaction.createdAt);
  return formatted ? formatted.split("/").reverse().join("-") : "";
}
export function signedTransactionAmount(transaction: Transaction) {
  return transaction.type === "income" ? transaction.amount : -transaction.amount;
}
export function sortStatementTransactions(items: Transaction[], option: TransactionSortOption) {
  return [...items].sort((a, b) => {
    const date = getTransactionDateValue(a).localeCompare(getTransactionDateValue(b));
    let comparison = 0;
    switch (option) {
      case "oldest": comparison = date; break;
      case "highest": comparison = signedTransactionAmount(b) - signedTransactionAmount(a); break;
      case "lowest": comparison = signedTransactionAmount(a) - signedTransactionAmount(b); break;
      case "title-asc": comparison = a.title.localeCompare(b.title, "pt-BR"); break;
      case "title-desc": comparison = b.title.localeCompare(a.title, "pt-BR"); break;
      default: comparison = -date;
    }
    return comparison || b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id);
  });
}
