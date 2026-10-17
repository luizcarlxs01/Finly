import type { Transaction } from "@/types/transaction";
import { isPaidOccurrence } from "@/utils/financial-calendar";

export type CalendarMarkerKind = "paid" | "pending" | "income";
export const CALENDAR_MARKER_LABELS: Record<CalendarMarkerKind, string> = { paid: "Pago", pending: "Pendente", income: "Entrada" };
export function getCalendarMarkerKind(occurrence: Transaction): CalendarMarkerKind {
  return occurrence.type === "income" ? "income" : isPaidOccurrence(occurrence) ? "paid" : "pending";
}
export function getCalendarDayMarkers(occurrences: Transaction[]) {
  const kinds = occurrences.map(getCalendarMarkerKind);
  const visible: CalendarMarkerKind[] = (["paid", "pending", "income"] as const).filter(kind => kinds.includes(kind));
  const consumed = new Set<CalendarMarkerKind>();
  for (const kind of kinds) {
    if (!consumed.has(kind)) { consumed.add(kind); continue; }
    if (visible.length < 3) visible.push(kind);
  }
  return { visible, remaining: Math.max(0, occurrences.length - visible.length) };
}
