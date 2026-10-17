"use client";

import { getCategoryIcon } from "@/components/dashboard/category-icons";
import { getTransactionCategoryLabel } from "@/types/transaction-category";
import type { CalendarMonthData } from "@/utils/financial-calendar";
import styles from "./dashboard-transactions-view.module.css";

type Props = {
  month: CalendarMonthData;
  selectedDate: string;
  hidden: boolean;
  onSelect: (date: string) => void;
  onOpen: (date: string) => void;
};
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export function CompactFinancialCalendar({ month, selectedDate, hidden, onSelect, onOpen }: Props) {
  const day = month.days.find(day => day.dateValue === selectedDate);
  const rows = day?.occurrences ?? [];
  const open = () => onOpen(selectedDate || month.days[0].dateValue);
  return <section className={`${styles.card} ${styles.calendar}`} aria-label="Calendário compacto">
    <div className="flex items-center justify-between gap-2">
      <h2 className="w-full text-xl font-semibold capitalize"><button type="button" className={styles.monthTitle} onClick={open}>{month.monthLabel}</button></h2>
    </div>
    <button type="button" className={styles.weekdays} aria-label="Abrir calendário pelos dias da semana" onClick={open}>{["D", "S", "T", "Q", "Q", "S", "S"].map((label, index) => <span key={index} aria-hidden="true">{label}</span>)}</button>
    <div className={styles.days} onClick={open}>
      {Array.from({ length: month.leadingBlankDays }, (_, index) => <span key={`blank-${index}`} />)}
      {month.days.map(day => {
        const income = day.occurrences.some(item => item.type === "income");
        const expense = day.occurrences.some(item => item.type === "expense");
        const kind = income && expense ? "both" : income ? "income" : expense ? "expense" : "none";
        return <button type="button" key={day.dateValue} aria-label={`${day.dayNumber} de ${month.monthLabel}, ${income ? "entradas" : ""}${income && expense ? " e " : ""}${expense ? "saídas" : ""}${!income && !expense ? "sem lançamentos" : ""}`} aria-pressed={day.dateValue === selectedDate} className={styles.day} onClick={event => { event.stopPropagation(); if (day.dateValue === selectedDate) onOpen(day.dateValue); else onSelect(day.dateValue); }}>
          <span className={day.dateValue === selectedDate ? styles.selectedDay : day.isToday ? styles.today : ""}>{day.dayNumber}</span>
          {kind !== "none" && <i aria-hidden="true" data-kind={kind} className={styles.dayDot} />}
        </button>;
      })}
    </div>
    <div className={`${styles.preview} ${rows.length > 2 ? styles.morePreview : ""}`} data-clickable={rows.length > 0} onClick={rows.length > 0 ? open : undefined}>
      <h3 className="mb-3 text-sm font-semibold">{day ? `Lançamentos em ${day.dayNumber} de ${month.monthLabel.split(" de ")[0]}` : "Selecione uma data"}</h3>
      <div className={styles.previewBody}>{rows.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum lançamento nesta data.</p> : <ul className={styles.previewList}>{rows.slice(0, 2).map(item => {
        const Icon = getCategoryIcon(item.category);
        return <li key={item.id}><button type="button" className={styles.previewRow} onClick={event => { event.stopPropagation(); open(); }}><span className={styles.categoryIcon}><Icon className="size-5" /></span><span className="min-w-0 flex-1"><span className="block truncate font-semibold">{item.title}</span><span className="text-xs text-muted-foreground">{getTransactionCategoryLabel(item.category)}</span></span><span className={`whitespace-nowrap font-semibold ${item.type === "income" ? "text-primary" : ""}`}>{hidden ? "••••••" : `${item.type === "income" ? "+ " : "− "}${money.format(item.amount)}`}</span></button></li>;
      })}</ul>}</div>
      <div className={styles.previewMore}>{rows.length > 2 && <button type="button" onClick={event => { event.stopPropagation(); open(); }}>Ver todos</button>}</div>
    </div>
    <button type="button" className="sr-only focus:not-sr-only focus:mt-3 focus:text-primary" onClick={event => { event.stopPropagation(); open(); }}>Abrir calendário completo</button>
  </section>;
}
