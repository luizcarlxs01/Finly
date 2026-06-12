"use client";

import { CalendarClock, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Transaction } from "@/types/finance";
import { TRANSACTION_RECURRENCE_LABELS } from "@/types/transaction";
import { getTransactionCategoryLabel } from "@/types/transaction-category";
import {
  formatBusinessDateBr,
  formatDisplayDateTime,
} from "@/utils/date-format";

type TransactionListProps = {
  disableRemove?: boolean;
  removeDisabledMessage?: string;
  transactions: Transaction[];
  onEditTransaction: (transaction: Transaction) => void;
  onRemoveTransaction: (id: string) => void;
  getNextRecurringOccurrence: (transaction: Transaction) => string | null;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function getTransactionTypeLabel(type: Transaction["type"]) {
  return type === "income" ? "Entrada" : "Saida";
}

function getTransactionKindLabel(transactionKind: Transaction["transactionKind"]) {
  if (
    transactionKind === "installment-template" ||
    transactionKind === "installment-instance"
  ) {
    return "Parcelado";
  }

  if (
    transactionKind === "recurring-template" ||
    transactionKind === "recurring-instance"
  ) {
    return "Recorrente";
  }

  return "Unico";
}

function getTransactionDisplayDate(transaction: Transaction) {
  if (transaction.transactionKind === "installment-template") {
    return transaction.installmentStartDate;
  }

  if (transaction.transactionKind === "recurring-template") {
    return transaction.recurrenceStartDate;
  }

  return (
    transaction.occurrenceDate ??
    transaction.recurringOccurrenceDate ??
    transaction.createdAt
  );
}

function formatTransactionDisplayDate(transaction: Transaction) {
  const rawDate = getTransactionDisplayDate(transaction);

  return formatDisplayDateTime(rawDate, transaction.createdAt);
}

function formatRecurringSummary(transaction: Transaction) {
  if (
    transaction.transactionKind !== "recurring-template" ||
    transaction.recurrenceType !== "monthly" ||
    !transaction.recurrenceDay
  ) {
    return null;
  }

  return `${TRANSACTION_RECURRENCE_LABELS.monthly} · dia ${transaction.recurrenceDay}`;
}

function formatRecurringDate(dateValue: string) {
  return formatBusinessDateBr(dateValue) ?? dateValue;
}

export function TransactionList({
  disableRemove = false,
  removeDisabledMessage,
  transactions,
  onEditTransaction,
  onRemoveTransaction,
  getNextRecurringOccurrence,
  emptyStateTitle = "Nenhuma transacao cadastrada",
  emptyStateDescription = "Assim que voce registrar movimentacoes, elas aparecerao organizadas aqui.",
}: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <Card className="rounded-[1.75rem] border border-dashed border-border/70 bg-card/80 shadow-sm">
        <CardContent className="p-8 text-center">
          <p className="text-base font-medium text-foreground">
            {emptyStateTitle}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {emptyStateDescription}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => {
        const recurringSummary = formatRecurringSummary(transaction);
        const nextRecurringOccurrence = getNextRecurringOccurrence(transaction);
        const displayDate = formatTransactionDisplayDate(transaction);
        const isIncome = transaction.type === "income";

        return (
          <Card
            key={transaction.id}
            className="rounded-[1.5rem] border border-border/70 bg-card/95 shadow-sm transition-colors hover:bg-card"
          >
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1 space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <h3 className="truncate text-lg font-semibold text-foreground">
                        {transaction.title}
                      </h3>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarClock className="size-4 shrink-0" />
                        <span className="truncate">
                          {displayDate?.withTime
                            ? displayDate.value
                            : displayDate
                              ? `${displayDate.value} · sem horario registrado`
                              : "Data indisponivel"}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <p
                        className={`text-xl font-semibold sm:text-right ${
                          isIncome ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {currencyFormatter.format(transaction.amount)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                        isIncome
                          ? "bg-primary/12 text-primary"
                          : "bg-accent/55 text-foreground"
                      }`}
                    >
                      {getTransactionTypeLabel(transaction.type)}
                    </span>

                    <span className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                      {getTransactionCategoryLabel(transaction.category)}
                    </span>

                    <Badge
                      variant="outline"
                      className="h-auto rounded-full px-3 py-1"
                    >
                      {getTransactionKindLabel(transaction.transactionKind)}
                    </Badge>

                    {transaction.transactionKind === "recurring-template" ? (
                      <Badge
                        variant="outline"
                        className="h-auto rounded-full px-3 py-1"
                      >
                        Modelo recorrente
                      </Badge>
                    ) : null}

                    {transaction.transactionKind === "recurring-instance" ? (
                      <Badge
                        variant="secondary"
                        className="h-auto rounded-full px-3 py-1"
                      >
                        Lancamento gerado
                      </Badge>
                    ) : null}

                    {recurringSummary ? (
                      <Badge
                        variant="outline"
                        className="h-auto rounded-full px-3 py-1"
                      >
                        {recurringSummary}
                      </Badge>
                    ) : null}
                  </div>

                  {transaction.transactionKind === "recurring-template" &&
                  nextRecurringOccurrence ? (
                    <div className="rounded-2xl border border-border/60 bg-background/60 px-4 py-3">
                      <p className="text-sm text-muted-foreground">
                        Proxima ocorrencia:{" "}
                        <span className="font-medium text-foreground">
                          {formatRecurringDate(nextRecurringOccurrence)}
                        </span>
                      </p>
                    </div>
                  ) : null}

                  {transaction.transactionKind === "recurring-instance" &&
                  transaction.recurringOccurrenceDate ? (
                    <div className="rounded-2xl border border-border/60 bg-background/60 px-4 py-3">
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>
                          Competencia gerada:{" "}
                          <span className="font-medium text-foreground">
                            {formatRecurringDate(transaction.recurringOccurrenceDate)}
                          </span>
                        </p>

                        {nextRecurringOccurrence ? (
                          <p>
                            Proximo lancamento:{" "}
                            <span className="font-medium text-foreground">
                              {formatRecurringDate(nextRecurringOccurrence)}
                            </span>
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="flex shrink-0 flex-col gap-2 sm:flex-row xl:flex-col">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onEditTransaction(transaction)}
                    className="h-10 rounded-2xl"
                  >
                    <Pencil className="size-4" />
                    Editar
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    disabled={disableRemove}
                    title={disableRemove ? removeDisabledMessage : undefined}
                    onClick={() => onRemoveTransaction(transaction.id)}
                    className="h-10 rounded-2xl"
                  >
                    <Trash2 className="size-4" />
                    Remover
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
