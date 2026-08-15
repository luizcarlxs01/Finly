"use client";

import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Transaction } from "@/types/transaction";
import { getTransactionCategoryLabel } from "@/types/transaction-category";
import { formatBusinessDateBr } from "@/utils/date-format";
import { isPaidOccurrence, type CalendarDay } from "@/utils/financial-calendar";

type FinancialCalendarDayPanelProps = {
  day: CalendarDay | null;
  onEditTransaction: (transaction: Transaction) => void;
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function getKindLabel(occurrence: Transaction) {
  if (occurrence.transactionKind === "installment-instance") {
    return occurrence.installmentIndex && occurrence.installmentCount
      ? `Parcela ${occurrence.installmentIndex}/${occurrence.installmentCount}`
      : "Parcelado";
  }

  if (occurrence.transactionKind === "recurring-instance") {
    return "Recorrente";
  }

  return "Único";
}

export function FinancialCalendarDayPanel({
  day,
  onEditTransaction,
}: FinancialCalendarDayPanelProps) {
  if (!day) {
    return (
      <div className="flex h-full min-h-[8rem] items-center justify-center rounded-[1.5rem] border border-dashed border-border/70 bg-background/40 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Selecione um dia com lançamentos para ver os detalhes.
        </p>
      </div>
    );
  }

  const totalIncome = day.occurrences
    .filter((occurrence) => occurrence.type === "income")
    .reduce((total, occurrence) => total + occurrence.amount, 0);
  const totalExpense = day.occurrences
    .filter((occurrence) => occurrence.type === "expense")
    .reduce((total, occurrence) => total + occurrence.amount, 0);

  return (
    <div className="space-y-3 rounded-[1.5rem] border border-border/70 bg-background/50 p-4 sm:p-5">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
          Lançamentos do dia
        </p>
        <h3 className="text-lg font-semibold text-foreground">
          {formatBusinessDateBr(day.dateValue) ?? day.dateValue}
        </h3>
        <p className="text-sm text-muted-foreground">
          {day.occurrences.length} lançamento
          {day.occurrences.length === 1 ? "" : "s"} · entradas{" "}
          {currencyFormatter.format(totalIncome)} · saídas{" "}
          {currencyFormatter.format(totalExpense)}
        </p>
      </div>

      <ul className="space-y-2">
        {day.occurrences.map((occurrence) => {
          const isPaid = isPaidOccurrence(occurrence);
          const isIncome = occurrence.type === "income";

          return (
            <li
              key={occurrence.id}
              className="rounded-[1.25rem] border border-border/60 bg-card/80 p-3 sm:p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {occurrence.title}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        isPaid
                          ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${
                          isPaid
                            ? "bg-emerald-500 dark:bg-emerald-400"
                            : "bg-muted-foreground/45"
                        }`}
                      />
                      {isPaid ? "Pago" : "Pendente"}
                    </span>

                    <span className="inline-flex rounded-full border border-border/70 bg-background/70 px-2.5 py-1 text-xs font-medium text-foreground/80">
                      {getKindLabel(occurrence)}
                    </span>

                    <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      {getTransactionCategoryLabel(occurrence.category)}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end">
                  <p
                    className={`text-base font-semibold ${
                      isIncome ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {isIncome ? "+" : "-"}
                    {currencyFormatter.format(occurrence.amount)}
                  </p>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => onEditTransaction(occurrence)}
                  >
                    <Pencil className="size-3.5" />
                    Editar
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
