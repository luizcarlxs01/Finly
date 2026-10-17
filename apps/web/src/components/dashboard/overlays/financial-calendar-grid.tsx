"use client";
import type { Transaction } from "@/types/transaction";
import { CALENDAR_WEEKDAY_LABELS, type CalendarDay, type CalendarMonthData } from "@/utils/financial-calendar";
import { CALENDAR_MARKER_LABELS, getCalendarDayMarkers, getCalendarMarkerKind } from "@/utils/calendar-day-markers";
import styles from "./financial-calendar.module.css";

type Props = { hidden?: boolean; month: CalendarMonthData; selectedDateValue: string | null; onSelectDay: (dateValue: string) => void };
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
function DayPreview({ day, upward, hidden }: { day: CalendarDay; upward: boolean; hidden: boolean }) {
  return <div className={`${styles.tooltip} ${upward ? styles.tooltipUp : ""}`} role="presentation"><ul>{day.occurrences.slice(0, 3).map((item: Transaction) => <li key={item.id}><i className={styles.dot} data-kind={getCalendarMarkerKind(item)} /><span className="min-w-0 flex-1 truncate">{item.title}</span><strong>{hidden ? "••••••" : `${item.type === "income" ? "+" : "−"}${money.format(item.amount)}`}</strong></li>)}</ul>{day.occurrences.length > 3 && <p>e mais {day.occurrences.length - 3} lançamentos</p>}</div>;
}
export function FinancialCalendarGrid({ hidden = false, month, selectedDateValue, onSelectDay }: Props) {
  const rowCount = Math.ceil((month.leadingBlankDays + month.days.length) / 7);
  return <><div className={styles.gridArea}>
    <div className={styles.weekdays} aria-hidden="true">{CALENDAR_WEEKDAY_LABELS.map(label => <span key={label}>{label}</span>)}</div>
    <div className={styles.days} style={{ gridTemplateRows: `repeat(${rowCount}, minmax(0, 1fr))` }}>
      {Array.from({ length: month.leadingBlankDays }, (_, index) => <div key={`blank-${index}`} className={styles.blankDay} aria-hidden="true" />)}
      {month.days.map((day, index) => {
        const selected = day.dateValue === selectedDateValue;
        const markers = getCalendarDayMarkers(day.occurrences);
        return <div key={day.dateValue} className={`${styles.cell} ${(month.leadingBlankDays + index) % 7 >= 5 ? styles.rightCell : ""}`}>
          <button type="button" aria-pressed={selected} aria-current={day.isToday ? "date" : undefined} aria-label={`Dia ${day.dayNumber} — ${day.occurrences.length} lançamento${day.occurrences.length === 1 ? "" : "s"}`} className={`${styles.day} ${selected ? styles.selected : ""}`} onClick={() => onSelectDay(day.dateValue)}>
            <span>{day.dayNumber}</span>
            <span className={styles.markers}>{markers.visible.map((kind, i) => <i key={`${kind}-${i}`} aria-label={CALENDAR_MARKER_LABELS[kind]} className={styles.dot} data-kind={kind} />)}{markers.remaining > 0 && <span className={styles.moreDot} aria-label={`Mais ${markers.remaining} lançamento${markers.remaining === 1 ? "" : "s"}`}>+</span>}</span>
          </button>
          {day.occurrences.length > 0 && <DayPreview day={day} hidden={hidden} upward={Math.floor((month.leadingBlankDays + index) / 7) >= rowCount - 2} />}
        </div>;
      })}
    </div>
  </div>
    <div className={styles.legend} aria-label="Legenda dos lançamentos">{(["paid", "pending", "income"] as const).map(kind => <span key={kind}><i className={styles.dot} data-kind={kind} aria-hidden="true" />{CALENDAR_MARKER_LABELS[kind]}</span>)}</div>
  </>;
}
