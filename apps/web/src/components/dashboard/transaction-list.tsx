"use client";

import { CalendarClock, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Transaction } from "@/types/finance";
import { TRANSACTION_RECURRENCE_LABELS } from "@/types/transaction";
import { getTransactionCategoryLabel } from "@/types/transaction-category";

type TransactionListProps = {
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

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const recurrenceDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function getTransactionTypeLabel(type: Transaction["type"]) {
  return type === "income" ? "Entrada" : "Saída";
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
  const [year, month, day] = dateValue.split("-").map(Number);

  return recurrenceDateFormatter.format(new Date(year, month - 1, day, 12));
}

export function TransactionList({
  transactions,
  onEditTransaction,
  onRemoveTransaction,
  getNextRecurringOccurrence,
  emptyStateTitle = "Nenhuma transação cadastrada",
  emptyStateDescription = "Assim que você registrar movimentações, elas aparecerão organizadas aqui.",
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
                          {dateFormatter.format(new Date(transaction.createdAt))}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <p
                        className={`text-xl font-semibold sm:text-right ${
                          transaction.type === "income"
                            ? "text-green-700"
                            : "text-red-700"
                        }`}
                      >
                        {currencyFormatter.format(transaction.amount)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                        transaction.type === "income"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {getTransactionTypeLabel(transaction.type)}
                    </span>

                    <span className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                      {getTransactionCategoryLabel(transaction.category)}
                    </span>

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
                        Lançamento gerado
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
                        Próxima ocorrência:{" "}
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
                          Competência gerada:{" "}
                          <span className="font-medium text-foreground">
                            {formatRecurringDate(transaction.recurringOccurrenceDate)}
                          </span>
                        </p>

                        {nextRecurringOccurrence ? (
                          <p>
                            Próximo lançamento:{" "}
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
