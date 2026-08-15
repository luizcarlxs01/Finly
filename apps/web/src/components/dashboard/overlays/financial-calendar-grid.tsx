"use client";

import type { Transaction } from "@/types/transaction";
import {
  CALENDAR_WEEKDAY_LABELS,
  isPaidOccurrence,
  type CalendarDay,
  type CalendarMonthData,
} from "@/utils/financial-calendar";

type FinancialCalendarGridProps = {
  month: CalendarMonthData;
  selectedDateValue: string | null;
  onSelectDay: (dateValue: string) => void;
};

const MAX_VISIBLE_DOTS = 4;
const MAX_PREVIEW_ITEMS = 3;

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function getDotClassName(occurrence: Transaction) {
  return isPaidOccurrence(occurrence)
    ? "bg-emerald-500 dark:bg-emerald-400"
    : "bg-muted-foreground/45";
}

function DayPreview({ day, openUpward }: { day: CalendarDay; openUpward: boolean }) {
  const visibleOccurrences = day.occurrences.slice(0, MAX_PREVIEW_ITEMS);
  const hiddenCount = day.occurrences.length - visibleOccurrences.length;

  return (
    <div
      className={`pointer-events-none absolute left-1/2 z-30 hidden w-56 -translate-x-1/2 rounded-2xl border border-border/70 bg-popover p-3 text-left shadow-xl group-hover:block ${
        openUpward ? "bottom-full mb-2" : "top-full mt-2"
      }`}
      role="presentation"
    >
      <ul className="space-y-2">
        {visibleOccurrences.map((occurrence) => (
          <li key={occurrence.id} className="flex items-start justify-between gap-2">
            <span className="flex min-w-0 items-start gap-2">
              <span
                className={`mt-1.5 size-1.5 shrink-0 rounded-full ${getDotClassName(occurrence)}`}
              />
              <span className="truncate text-xs font-medium text-foreground">
                {occurrence.title}
              </span>
            </span>

            <span
              className={`shrink-0 text-xs font-semibold ${
                occurrence.type === "income" ? "text-primary" : "text-foreground"
              }`}
            >
              {occurrence.type === "income" ? "+" : "-"}
              {currencyFormatter.format(occurrence.amount)}
            </span>
          </li>
        ))}
      </ul>

      {hiddenCount > 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">
          e mais {hiddenCount} lançamento{hiddenCount === 1 ? "" : "s"}
        </p>
      ) : null}
    </div>
  );
}

export function FinancialCalendarGrid({
  month,
  selectedDateValue,
  onSelectDay,
}: FinancialCalendarGridProps) {
  const totalRows = Math.ceil(
    (month.leadingBlankDays + month.days.length) / CALENDAR_WEEKDAY_LABELS.length,
  );

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {CALENDAR_WEEKDAY_LABELS.map((weekdayLabel) => (
          <div
            key={weekdayLabel}
            className="pb-1 text-center text-[0.7rem] font-medium uppercase tracking-[0.12em] text-muted-foreground"
          >
            {weekdayLabel}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {Array.from({ length: month.leadingBlankDays }, (_, index) => (
          <div key={`blank-${index}`} aria-hidden="true" />
        ))}

        {month.days.map((day, index) => {
          const hasOccurrences = day.occurrences.length > 0;
          const isSelected = day.dateValue === selectedDateValue;
          const rowIndex = Math.floor(
            (month.leadingBlankDays + index) / CALENDAR_WEEKDAY_LABELS.length,
          );
          const visibleDots = day.occurrences.slice(0, MAX_VISIBLE_DOTS);
          const hiddenDotCount = day.occurrences.length - visibleDots.length;

          return (
            <div key={day.dateValue} className="group relative">
              <button
                type="button"
                disabled={!hasOccurrences}
                aria-pressed={isSelected}
                aria-label={`Dia ${day.dayNumber} — ${day.occurrences.length} lançamento${
                  day.occurrences.length === 1 ? "" : "s"
                }`}
                onClick={() => onSelectDay(day.dateValue)}
                className={`flex h-16 w-full flex-col items-center justify-start gap-1.5 rounded-xl border p-1.5 transition-colors sm:h-20 sm:p-2 ${
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-border/60 bg-background/50"
                } ${
                  hasOccurrences
                    ? "cursor-pointer hover:border-primary/60 hover:bg-primary/5"
                    : "cursor-default opacity-60"
                }`}
              >
                <span
                  className={`flex size-6 items-center justify-center rounded-full text-xs font-semibold sm:size-7 sm:text-sm ${
                    day.isToday
                      ? "bg-primary text-primary-foreground"
                      : day.isPast
                        ? "text-muted-foreground"
                        : "text-foreground"
                  }`}
                >
                  {day.dayNumber}
                </span>

                <span className="flex flex-wrap items-center justify-center gap-0.5">
                  {visibleDots.map((occurrence) => (
                    <span
                      key={occurrence.id}
                      className={`size-1.5 rounded-full ${getDotClassName(occurrence)}`}
                    />
                  ))}

                  {hiddenDotCount > 0 ? (
                    <span className="text-[0.6rem] font-medium leading-none text-muted-foreground">
                      +{hiddenDotCount}
                    </span>
                  ) : null}
                </span>
              </button>

              {hasOccurrences ? (
                <DayPreview day={day} openUpward={rowIndex >= totalRows - 2} />
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
          Pago
        </span>

        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-muted-foreground/45" />
          Pendente
        </span>
      </div>
    </div>
  );
}
