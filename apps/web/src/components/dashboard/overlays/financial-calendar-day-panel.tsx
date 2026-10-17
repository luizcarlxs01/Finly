"use client";
import { Pencil } from "lucide-react";
import type { Transaction } from "@/types/transaction";
import { getTransactionCategoryLabel } from "@/types/transaction-category";
import { formatBusinessDateBr } from "@/utils/date-format";
import { isPaidOccurrence, type CalendarDay } from "@/utils/financial-calendar";
import styles from "./financial-calendar.module.css";

type Props = { hidden?: boolean; day: CalendarDay | null; onEditTransaction: (transaction: Transaction) => void };
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
function kindLabel(item: Transaction) {
  if (item.transactionKind === "installment-instance") return item.installmentIndex && item.installmentCount ? `Parcela ${item.installmentIndex}/${item.installmentCount}` : "Parcelado";
  return item.transactionKind === "recurring-instance" ? "Recorrente" : "Único";
}
export function FinancialCalendarDayPanel({ hidden = false, day, onEditTransaction }: Props) {
  const rows = day?.occurrences ?? [];
  const income = rows.filter(item => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
  const expense = rows.filter(item => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
  return <section className={styles.dayPanel} aria-label="Lançamentos do dia">
    <header className={styles.dayHeader}>
      <p>Lançamentos do dia</p>
      <h3>{day ? formatBusinessDateBr(day.dateValue) ?? day.dateValue : "Selecione uma data"}</h3>
    </header>
    {rows.length === 0 ? <div className={styles.emptyDay}><p>{day ? "Sem lançamentos neste dia." : "Selecione um dia para ver os detalhes."}</p></div> : <ul className={styles.dayList} data-scrollable={rows.length > 3} tabIndex={0} aria-label="Lista de lançamentos do dia">
      {rows.map(item => <li key={item.id}>
        <div className={styles.dayRowTop}><div className="min-w-0"><h4 className="break-words text-sm font-semibold">{item.title}</h4><div className={styles.badges}><span data-status={isPaidOccurrence(item) ? "paid" : "pending"}>{isPaidOccurrence(item) ? "Pago" : "Pendente"}</span><span>{kindLabel(item)}</span><span>{getTransactionCategoryLabel(item.category)}</span></div></div>
        <button type="button" onClick={() => onEditTransaction(item)}><Pencil className="size-3.5" />Editar</button></div>
        <strong className={`${styles.dayAmount} ${item.type === "income" ? "text-primary" : ""}`}>{hidden ? "••••••" : `${item.type === "income" ? "+ " : "− "}${money.format(item.amount)}`}</strong>
      </li>)}
    </ul>}
    {rows.length > 0 && <footer className={styles.dayFooter}>{rows.length} {rows.length === 1 ? "lançamento" : "lançamentos"} · entradas {hidden ? "••••••" : money.format(income)} · saídas {hidden ? "••••••" : money.format(expense)}</footer>}
  </section>;
}
