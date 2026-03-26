"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Transaction } from "@/types/finance";
import { getTransactionCategoryLabel } from "@/types/transaction-category";

type TransactionListProps = {
  transactions: Transaction[];
  onEditTransaction: (transaction: Transaction) => void;
  onRemoveTransaction: (id: string) => void;
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

function getTransactionTypeLabel(type: Transaction["type"]) {
  return type === "income" ? "Entrada" : "Saída";
}

export function TransactionList({
  transactions,
  onEditTransaction,
  onRemoveTransaction,
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
      {transactions.map((transaction) => (
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
              </div>
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
      ))}
    </div>
  );
}
