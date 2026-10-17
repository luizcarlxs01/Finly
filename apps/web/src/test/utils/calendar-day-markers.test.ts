import { describe, expect, it } from "vitest";
import type { Transaction } from "@/types/transaction";
import { getCalendarDayMarkers } from "@/utils/calendar-day-markers";
import { getCalendarMonthData } from "@/utils/financial-calendar";
const row = (kind: "paid" | "pending" | "income", id: string, date = "2026-10-16") => ({ id, title: id, amount: 10, type: kind === "income" ? "income" : "expense", occurrenceStatus: kind === "pending" ? "pending" : "paid", occurrenceDate: date, createdAt: "2026-10-01T12:00:00Z", transactionKind: "recurring-instance", recurringSourceId: "same-series" }) as Transaction;
describe("marcadores do calendário", () => {
  it.each([0, 1, 2, 3, 4, 8])("representa %i ocorrências repetidas", count => {
    const markers = getCalendarDayMarkers(Array.from({ length: count }, (_, i) => row("paid", String(i))));
    expect(markers.visible).toEqual(Array(Math.min(count, 3)).fill("paid"));
    expect(markers.remaining).toBe(Math.max(0, count - 3));
  });
  it("prioriza um de cada tipo antes de repetir e não modifica os dados", () => {
    const rows = [row("paid", "p1"), row("paid", "p2"), row("pending", "p3"), row("income", "p4")];
    expect(getCalendarDayMarkers(rows)).toEqual({ visible: ["paid", "pending", "income"], remaining: 1 });
    expect(rows.map(item => item.id)).toEqual(["p1", "p2", "p3", "p4"]);
    expect(getCalendarDayMarkers([row("income", "a"), row("income", "b"), row("pending", "c")])).toEqual({ visible: ["pending", "income", "income"], remaining: 0 });
  });
  it("considera somente as ocorrências efetivas de cada dia, mesmo na mesma série", () => {
    const month = getCalendarMonthData({ transactions: [row("paid", "a"), row("paid", "b", "2026-10-17"), row("income", "c", "2026-11-16")], year: 2026, monthIndex: 9 });
    expect(getCalendarDayMarkers(month.days[15].occurrences)).toEqual({ visible: ["paid"], remaining: 0 });
    expect(getCalendarDayMarkers(month.days[16].occurrences)).toEqual({ visible: ["paid"], remaining: 0 });
  });
});
