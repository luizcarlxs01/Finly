import type { Transaction } from "@/types/transaction";
import {
  createDateValue,
  formatDateValue,
  getDaysInMonth,
  parseDateValue,
} from "@/utils/recurring-transactions";

const monthLabelFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});

export const CALENDAR_WEEKDAY_LABELS = [
  "Dom",
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sáb",
] as const;

export type CalendarDay = {
  /** "YYYY-MM-DD" — mesma convenção de Occurrence.dueDate nos dois modos. */
  dateValue: string;
  dayNumber: number;
  isToday: boolean;
  isPast: boolean;
  occurrences: Transaction[];
  paidCount: number;
  pendingCount: number;
};

export type CalendarMonthSummary = {
  totalIncome: number;
  totalExpense: number;
  monthBalance: number;
  /** Saldo acumulado projetado ao fim do mês: currentBalance + pendências até último dia do mês. */
  cumulativeBalance: number;
  occurrenceCount: number;
};

export type CalendarMonthData = {
  year: number;
  monthIndex: number;
  monthLabel: string;
  /** Células vazias antes do dia 1 para alinhar a coluna do dia da semana. */
  leadingBlankDays: number;
  days: CalendarDay[];
  summary: CalendarMonthSummary;
};

export function isPaidOccurrence(transaction: Transaction) {
  return transaction.occurrenceStatus === "paid";
}

function sortDayOccurrences(left: Transaction, right: Transaction) {
  if (left.type !== right.type) {
    return left.type === "income" ? -1 : 1;
  }

  return left.title.localeCompare(right.title, "pt-BR");
}

/**
 * Agrupa por dia as Occurrences já achatadas de useFinanceData().transactions. Funciona igual
 * nos dois modos porque local e API passam pela mesma flattenApiTransactionToLineItems
 * (seção 21 do CLAUDE.md) — Occurrences Cancelled já vêm filtradas de lá, não há filtro extra
 * aqui.
 *
 * Diferente de getUpcomingOccurrencesByMonth (removido junto com a Agenda), o calendário
 * mostra o mês inteiro — dias passados inclusive — e considera Paid + Pending.
 */
export function getCalendarMonthData({
  transactions,
  year,
  monthIndex,
  currentBalance = 0,
  referenceDate = new Date(),
}: {
  transactions: Transaction[];
  year: number;
  monthIndex: number;
  /** Saldo atual (Occurrences pagas). Usado como base do saldo acumulado projetado. */
  currentBalance?: number;
  referenceDate?: Date;
}): CalendarMonthData {
  const occurrencesByDay = new Map<number, Transaction[]>();
  let totalIncome = 0;
  let totalExpense = 0;
  let occurrenceCount = 0;

  const lastDayDateValue = formatDateValue(
    createDateValue(year, monthIndex, getDaysInMonth(year, monthIndex)),
  );

  // Soma das ocorrências PENDENTES com data até o último dia do mês visível —
  // adicionado ao currentBalance (que já inclui as pagas) resulta no saldo acumulado projetado.
  let pendingNetToEndOfMonth = 0;

  for (const transaction of transactions) {
    const occurrenceDate = parseDateValue(transaction.occurrenceDate);

    if (!occurrenceDate) {
      continue;
    }

    const dateValue = formatDateValue(occurrenceDate);

    // Acumula pendências até o fim do mês exibido (qualquer mês, não só o atual).
    if (dateValue <= lastDayDateValue && !isPaidOccurrence(transaction)) {
      if (transaction.type === "income") {
        pendingNetToEndOfMonth += transaction.amount;
      } else {
        pendingNetToEndOfMonth -= transaction.amount;
      }
    }

    if (
      occurrenceDate.getFullYear() !== year ||
      occurrenceDate.getMonth() !== monthIndex
    ) {
      continue;
    }

    const dayNumber = occurrenceDate.getDate();
    const dayOccurrences = occurrencesByDay.get(dayNumber);

    if (dayOccurrences) {
      dayOccurrences.push(transaction);
    } else {
      occurrencesByDay.set(dayNumber, [transaction]);
    }

    occurrenceCount += 1;

    if (transaction.type === "income") {
      totalIncome += transaction.amount;
    } else {
      totalExpense += transaction.amount;
    }
  }

  const todayValue = formatDateValue(referenceDate);
  const daysInMonth = getDaysInMonth(year, monthIndex);

  const days = Array.from({ length: daysInMonth }, (_, index) => {
    const dayNumber = index + 1;
    const dateValue = formatDateValue(createDateValue(year, monthIndex, dayNumber));
    const occurrences = (occurrencesByDay.get(dayNumber) ?? []).sort(
      sortDayOccurrences,
    );

    return {
      dateValue,
      dayNumber,
      isToday: dateValue === todayValue,
      isPast: dateValue < todayValue,
      occurrences,
      paidCount: occurrences.filter(isPaidOccurrence).length,
      pendingCount: occurrences.filter(
        (occurrence) => !isPaidOccurrence(occurrence),
      ).length,
    } satisfies CalendarDay;
  });

  return {
    year,
    monthIndex,
    monthLabel: monthLabelFormatter.format(createDateValue(year, monthIndex, 1)),
    leadingBlankDays: createDateValue(year, monthIndex, 1).getDay(),
    days,
    summary: {
      totalIncome,
      totalExpense,
      monthBalance: totalIncome - totalExpense,
      cumulativeBalance: currentBalance + pendingNetToEndOfMonth,
      occurrenceCount,
    },
  };
}

/**
 * Rótulo do mês seguinte ao de referência, exibido em "Próximo período" no FinanceSummaryCard.
 * Preserva exatamente o texto que antes vinha do primeiro grupo de getUpcomingOccurrencesByMonth.
 */
export function getNextMonthLabel(referenceDate: Date = new Date()) {
  return monthLabelFormatter.format(
    createDateValue(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 1),
  );
}
