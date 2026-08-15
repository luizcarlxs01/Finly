"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { FinancialCalendarDayPanel } from "@/components/dashboard/overlays/financial-calendar-day-panel";
import { FinancialCalendarGrid } from "@/components/dashboard/overlays/financial-calendar-grid";
import { Button } from "@/components/ui/button";
import type { Transaction } from "@/types/transaction";
import { getCalendarMonthData } from "@/utils/financial-calendar";

type FinancialCalendarModalProps = {
  open: boolean;
  onClose: () => void;
  transactions: Transaction[];
  onEditTransaction: (transaction: Transaction) => void;
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function getCurrentMonth() {
  const today = new Date();

  return { year: today.getFullYear(), monthIndex: today.getMonth() };
}

export function FinancialCalendarModal({
  open,
  onClose,
  transactions,
  onEditTransaction,
}: FinancialCalendarModalProps) {
  const [visibleMonth, setVisibleMonth] = useState(getCurrentMonth);
  const [selectedDateValue, setSelectedDateValue] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setVisibleMonth(getCurrentMonth());
    setSelectedDateValue(null);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  const month = useMemo(
    () =>
      getCalendarMonthData({
        transactions,
        year: visibleMonth.year,
        monthIndex: visibleMonth.monthIndex,
      }),
    [transactions, visibleMonth.monthIndex, visibleMonth.year],
  );

  const selectedDay = useMemo(
    () => month.days.find((day) => day.dateValue === selectedDateValue) ?? null,
    [month.days, selectedDateValue],
  );

  if (!open) {
    return null;
  }

  function goToMonth(step: number) {
    setSelectedDateValue(null);
    setVisibleMonth((current) => {
      const nextMonth = new Date(current.year, current.monthIndex + step, 1, 12);

      return {
        year: nextMonth.getFullYear(),
        monthIndex: nextMonth.getMonth(),
      };
    });
  }

  const currentMonth = getCurrentMonth();
  const isViewingCurrentMonth =
    visibleMonth.year === currentMonth.year &&
    visibleMonth.monthIndex === currentMonth.monthIndex;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 backdrop-blur-sm sm:items-center sm:px-6 sm:py-6 lg:px-8">
      <div className="flex max-h-[min(100dvh-0.5rem,96vh)] w-full flex-col overflow-hidden rounded-t-[1.75rem] border border-border/70 bg-background shadow-2xl sm:max-h-[92vh] sm:max-w-6xl sm:rounded-[1.75rem]">
        <div className="flex flex-col gap-4 border-b border-border/60 px-4 py-4 sm:px-6 sm:py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="rounded-xl"
              aria-label="Mês anterior"
              onClick={() => goToMonth(-1)}
            >
              <ChevronLeft className="size-4" />
            </Button>

            <h2 className="min-w-[11rem] text-center text-lg font-semibold tracking-tight text-foreground first-letter:uppercase sm:text-xl">
              {month.monthLabel}
            </h2>

            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="rounded-xl"
              aria-label="Próximo mês"
              onClick={() => goToMonth(1)}
            >
              <ChevronRight className="size-4" />
            </Button>

            {isViewingCurrentMonth ? null : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-xl"
                onClick={() => {
                  setSelectedDateValue(null);
                  setVisibleMonth(getCurrentMonth());
                }}
              >
                Hoje
              </Button>
            )}
          </div>

          <Button
            type="button"
            variant="ghost"
            className="rounded-2xl"
            onClick={onClose}
          >
            <X className="size-4" />
            Fechar
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-primary/20 bg-primary/8 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Entradas previstas
                </p>
                <p className="mt-1 text-base font-semibold text-primary">
                  {currencyFormatter.format(month.summary.totalIncome)}
                </p>
              </div>

              <div className="rounded-2xl border border-accent/60 bg-accent/25 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Saídas previstas
                </p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  {currencyFormatter.format(month.summary.totalExpense)}
                </p>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card/80 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Saldo do mês
                </p>
                <p
                  className={`mt-1 text-base font-semibold ${
                    month.summary.monthBalance < 0 ? "text-destructive" : "text-foreground"
                  }`}
                >
                  {currencyFormatter.format(month.summary.monthBalance)}
                </p>
              </div>
            </div>

            {month.summary.occurrenceCount === 0 ? (
              <p className="rounded-2xl border border-dashed border-border/70 bg-background/40 px-4 py-3 text-sm text-muted-foreground">
                Nenhum lançamento neste mês.
              </p>
            ) : null}

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,1fr)] xl:items-start">
              <FinancialCalendarGrid
                month={month}
                selectedDateValue={selectedDateValue}
                onSelectDay={setSelectedDateValue}
              />

              <FinancialCalendarDayPanel
                day={selectedDay}
                onEditTransaction={onEditTransaction}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
