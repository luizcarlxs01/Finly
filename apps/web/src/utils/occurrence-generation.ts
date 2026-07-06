import type { OccurrenceStatus } from "@/types/occurrence";
import type { TransactionKind, TransactionRecurrenceMode } from "@/types/transaction";
import {
  createMonthlyOccurrence,
  formatDateValue,
  getTodayDateValue,
  parseDateValue,
} from "@/utils/recurring-transactions";

export type GeneratedOccurrence = {
  dueDate: string;
  amount: number;
  installmentIndex: number | null;
  status: OccurrenceStatus;
};

export type GenerateOccurrencesInput = {
  transactionKind: TransactionKind;
  amount: number;
  transactionDate: string | null;
  installmentCount: number | null;
  installmentStartDate: string | null;
  recurrenceDay: number | null;
  recurrenceStartDate: string | null;
  recurrenceMode: TransactionRecurrenceMode | null;
  recurrenceEndDate: string | null;
  recurrenceMonths: number | null;
};

function addMonthsToDate(date: Date, monthOffset: number) {
  const totalMonths = date.getMonth() + monthOffset;
  const year = date.getFullYear() + Math.floor(totalMonths / 12);
  const monthIndex = ((totalMonths % 12) + 12) % 12;

  return { year, monthIndex };
}

function buildOccurrenceDate(anchorDate: Date, dayOfMonth: number, monthOffset: number) {
  const { year, monthIndex } = addMonthsToDate(anchorDate, monthOffset);

  return createMonthlyOccurrence(year, monthIndex, dayOfMonth);
}

/**
 * Réplica em TypeScript das regras exatas de
 * Finly.Application/Services/OccurrenceGenerationService.cs — Single gera 1 occurrence,
 * Installment gera N mensais a partir da data informada, Recurring gera até a condição de
 * parada (until-date/for-months/12 meses se indefinido). Status Paid/Pending é decidido do
 * mesmo jeito: DueDate <= hoje. É a fonte ÚNICA de geração de occurrences no modo local
 * (use-local-finance.ts persiste o resultado de verdade) e também alimenta o preview de
 * simulação (use-impact-simulation.ts, para os dois modos) — não duplicar esta lógica.
 */
export function generateOccurrences(input: GenerateOccurrencesInput): GeneratedOccurrence[] {
  const today = parseDateValue(getTodayDateValue())!;

  function buildOccurrence(dueDate: Date, installmentIndex: number | null): GeneratedOccurrence {
    return {
      dueDate: formatDateValue(dueDate),
      amount: input.amount,
      installmentIndex,
      status: dueDate <= today ? "paid" : "pending",
    };
  }

  if (input.transactionKind === "installment-template") {
    const startDate = parseDateValue(input.installmentStartDate);

    if (!startDate || !input.installmentCount) {
      return [];
    }

    const dayOfMonth = startDate.getDate();
    const occurrences: GeneratedOccurrence[] = [];

    for (let index = 0; index < input.installmentCount; index += 1) {
      const dueDate = buildOccurrenceDate(startDate, dayOfMonth, index);
      occurrences.push(buildOccurrence(dueDate, index + 1));
    }

    return occurrences;
  }

  if (input.transactionKind === "recurring-template") {
    const startDate = parseDateValue(input.recurrenceStartDate);

    if (!startDate) {
      return [];
    }

    const dayOfMonth = input.recurrenceDay ?? startDate.getDate();
    const mode = input.recurrenceMode ?? "indefinite";
    const endDate = parseDateValue(input.recurrenceEndDate);
    const occurrences: GeneratedOccurrence[] = [];
    let monthOffset = 0;

    while (true) {
      const dueDate = buildOccurrenceDate(startDate, dayOfMonth, monthOffset);

      if (mode === "until-date") {
        if (endDate && dueDate > endDate) {
          break;
        }
      } else if (mode === "for-months") {
        if (monthOffset >= (input.recurrenceMonths ?? 0)) {
          break;
        }
      } else if (monthOffset >= 12) {
        break;
      }

      occurrences.push(buildOccurrence(dueDate, monthOffset + 1));
      monthOffset += 1;
    }

    return occurrences;
  }

  const transactionDate = parseDateValue(input.transactionDate) ?? today;

  return [buildOccurrence(transactionDate, null)];
}
