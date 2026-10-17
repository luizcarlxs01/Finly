"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FinancialDialog } from "./financial-dialog";
import { FinancialCalendarDayPanel } from "./financial-calendar-day-panel";
import { FinancialCalendarGrid } from "./financial-calendar-grid";
import { useValuePrivacy } from "@/hooks/use-value-privacy";
import type { Transaction } from "@/types/transaction";
import { getCalendarMonthData } from "@/utils/financial-calendar";
import { getTodayDateValue } from "@/utils/recurring-transactions";
import styles from "./financial-calendar.module.css";

type FinancialCalendarModalProps = {
  open: boolean;
  initialDate?: string;
  onClose: () => void;
  transactions: Transaction[];
  onEditTransaction: (transaction: Transaction) => void;
  currentBalance: number;
};
const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export function FinancialCalendarModal(props: FinancialCalendarModalProps) {
  return props.open ? <CalendarContent key={props.initialDate ?? "current"} {...props} /> : null;
}
function CalendarContent({ initialDate, onClose, transactions, onEditTransaction, currentBalance }: FinancialCalendarModalProps) {
  const [visibleMonth, setVisibleMonth] = useState(() => { const date = new Date((initialDate ?? getTodayDateValue()) + "T12:00:00"); return { year: date.getFullYear(), monthIndex: date.getMonth() }; });
  const [selectedDateValue, setSelectedDateValue] = useState<string | null>(initialDate ?? getTodayDateValue());
  const { hidden } = useValuePrivacy();
  const month = useMemo(() => getCalendarMonthData({ transactions, year: visibleMonth.year, monthIndex: visibleMonth.monthIndex, currentBalance }), [transactions, visibleMonth.monthIndex, visibleMonth.year, currentBalance]);
  const selectedDay = month.days.find(day => day.dateValue === selectedDateValue) ?? null;
  function goToMonth(step: number) {
    setSelectedDateValue(null);
    setVisibleMonth(current => { const date = new Date(current.year, current.monthIndex + step, 1, 12); return { year: date.getFullYear(), monthIndex: date.getMonth() }; });
  }
  return <FinancialDialog title="Calendário financeiro" className={styles.calendarDialog} smooth wide onClose={onClose} header={<div className={styles.heading}>
    <h2>Calendário</h2>
    <div className={styles.navigation} aria-label="Navegação do calendário">
      <button type="button" aria-label="Mês anterior" onClick={() => goToMonth(-1)}><ChevronLeft className="size-5" /></button>
      <p aria-live="polite" className={styles.monthLabel}>{month.monthLabel}</p>
      <button type="button" aria-label="Próximo mês" onClick={() => goToMonth(1)}><ChevronRight className="size-5" /></button>
    </div>
  </div>}>
    <div className={styles.body}>
      <section className={styles.summary} aria-label="Previsão do mês">
        {[{ label: "Entradas previstas", value: month.summary.totalIncome, income: true }, { label: "Saídas previstas", value: month.summary.totalExpense }, { label: "Saldo projetado", value: month.summary.cumulativeBalance }].map(item => <div key={item.label}><strong className={item.income ? "text-primary" : item.value < 0 ? "text-destructive" : ""}>{hidden ? "••••••" : currencyFormatter.format(item.value)}</strong><span>{item.label}</span></div>)}
      </section>
      <div className={styles.layout}>
        <FinancialCalendarGrid hidden={hidden} month={month} selectedDateValue={selectedDateValue} onSelectDay={setSelectedDateValue} />
        <FinancialCalendarDayPanel hidden={hidden} day={selectedDay} onEditTransaction={onEditTransaction} />
      </div>
    </div>
  </FinancialDialog>;
}
