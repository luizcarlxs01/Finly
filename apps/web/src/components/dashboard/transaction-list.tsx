"use client";

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
    <div className="space-y-4">
      {transactions.map((transaction) => {
        const recurringSummary = formatRecurringSummary(transaction);
        const nextRecurringOccurrence = getNextRecurringOccurrence(transaction);

        return (
          <Card
            key={transaction.id}
            className="rounded-[1.5rem] border-border/70 bg-card/95 shadow-sm transition hover:border-border"
          >
            <CardContent className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-foreground">
                    {transaction.title}
                  </h3>

                  <p className="text-sm text-muted-foreground">
                    {dateFormatter.format(new Date(transaction.createdAt))}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
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
                  <p className="text-sm text-muted-foreground">
                    Próxima ocorrência:{" "}
                    {formatRecurringDate(nextRecurringOccurrence)}
                  </p>
                ) : null}

                {transaction.transactionKind === "recurring-instance" &&
                transaction.recurringOccurrenceDate ? (
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>
                      Competência gerada:{" "}
                      {formatRecurringDate(transaction.recurringOccurrenceDate)}
                    </p>

                    {nextRecurringOccurrence ? (
                      <p>
                        Próximo lançamento:{" "}
                        {formatRecurringDate(nextRecurringOccurrence)}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col gap-3 sm:items-end">
                <span className="text-xl font-semibold text-foreground sm:min-w-36 sm:text-right">
                  {currencyFormatter.format(transaction.amount)}
                </span>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onEditTransaction(transaction)}
                    className="h-10 rounded-xl"
                  >
                    Editar
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => onRemoveTransaction(transaction.id)}
                    className="h-10 rounded-xl"
                  >
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
