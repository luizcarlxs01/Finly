"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowDown, ArrowUp, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { Transaction } from "@/types/transaction";
import type { TransactionSortOption } from "@/components/dashboard/transaction-advanced-filters";
import { getCategoryIcon } from "@/components/dashboard/category-icons";
import { getTransactionCategoryLabel } from "@/types/transaction-category";
import { formatBusinessDateBr } from "@/utils/date-format";
import { getTransactionDateValue } from "@/utils/statement-transactions";
import styles from "./dashboard-transactions-view.module.css";

type Props = { transactions: Transaction[]; hidden: boolean; sort: TransactionSortOption; onSort: (sort: TransactionSortOption) => void; onEdit: (transaction: Transaction) => void; onRemove: (id: string) => void; getNextRecurringOccurrence: (transaction: Transaction) => string | null; emptyTitle: string; emptyDescription: string };
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export function TransactionStatement({ transactions, hidden, sort, onSort, onEdit, onRemove, getNextRecurringOccurrence, emptyTitle, emptyDescription }: Props) {
  const [menu, setMenu] = useState<{ transaction: Transaction; left: number; top: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (!menu) return;
    menuRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const pointer = (event: PointerEvent) => { if (!menuRef.current?.contains(event.target as Node) && !triggerRef.current?.contains(event.target as Node)) setMenu(null); };
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") { event.stopPropagation(); setMenu(null); triggerRef.current?.focus(); } };
    const scroll = (event: Event) => { if (!menuRef.current?.contains(event.target as Node)) setMenu(null); };
    document.addEventListener("pointerdown", pointer); document.addEventListener("keydown", key); window.addEventListener("scroll", scroll, true);
    return () => { document.removeEventListener("pointerdown", pointer); document.removeEventListener("keydown", key); window.removeEventListener("scroll", scroll, true); };
  }, [menu]);
  const dateActive = sort === "newest" || sort === "oldest";
  const valueActive = sort === "highest" || sort === "lowest";
  return <div role="table" aria-label="Extrato de lançamentos" className={styles.table}>
    <div role="rowgroup"><div role="row" className={styles.tableHead}>
      <span role="columnheader">Descrição</span><span role="columnheader" className={styles.categoryColumn}>Categoria</span><span role="columnheader" className={styles.kindColumn}>Tipo</span>
      <span role="columnheader" aria-sort={dateActive ? sort === "newest" ? "descending" : "ascending" : "none"}><button type="button" onClick={() => onSort(sort === "newest" ? "oldest" : "newest")}>Data {dateActive && (sort === "newest" ? <ArrowDown aria-hidden="true" className="size-3" /> : <ArrowUp aria-hidden="true" className="size-3" />)}</button></span>
      <span role="columnheader" aria-sort={valueActive ? sort === "highest" ? "descending" : "ascending" : "none"} className="text-right"><button type="button" onClick={() => onSort(sort === "highest" ? "lowest" : "highest")}>Valor {valueActive && (sort === "highest" ? <ArrowDown aria-hidden="true" className="size-3" /> : <ArrowUp aria-hidden="true" className="size-3" />)}</button></span><span role="columnheader" className="sr-only">Ações</span>
    </div></div>
    <div role="rowgroup" tabIndex={0} aria-label="Lista rolável de lançamentos" className={styles.rows}>
      {transactions.length === 0 ? <div className="p-8 text-center"><p className="font-semibold">{emptyTitle}</p><p className="mt-2 text-sm text-muted-foreground">{emptyDescription}</p></div> : transactions.map(transaction => {
        const Icon = getCategoryIcon(transaction.category);
        const kind = transaction.transactionKind.startsWith("installment") ? "Parcelado" : transaction.transactionKind.startsWith("recurring") ? "Recorrente" : "Único";
        const next = getNextRecurringOccurrence(transaction);
        return <div role="row" key={transaction.id} data-transaction-id={transaction.id} className={styles.row}>
          <div role="cell" className={styles.rowTitle}><span className={styles.categoryIcon}><Icon className="size-5" /></span><div className="min-w-0"><strong title={transaction.title}>{transaction.title}</strong><span className="block text-[10px] text-muted-foreground">{transaction.occurrenceStatus === "paid" ? "Pago" : "Pendente"}<span className="min-[640px]:hidden"> · {kind}</span>{transaction.installmentIndex ? ` · ${transaction.installmentIndex}/${transaction.installmentCount}` : ""}</span><span className="block text-[10px] text-muted-foreground min-[1200px]:hidden">{getTransactionCategoryLabel(transaction.category)}</span>{next && <span className="block text-[10px] text-muted-foreground">Próximo: {formatBusinessDateBr(next) ?? next}</span>}</div></div>
          <div role="cell" className={`${styles.categoryColumn} text-muted-foreground`}>{getTransactionCategoryLabel(transaction.category)}</div>
          <div role="cell" className={styles.kindColumn}><span className={styles.kind}>{kind}</span></div>
          <div role="cell" className="text-muted-foreground">{formatBusinessDateBr(getTransactionDateValue(transaction)) ?? "—"}</div>
          <div role="cell" className={`whitespace-nowrap text-right font-semibold ${transaction.type === "income" ? "text-primary" : ""}`}>{hidden ? "••••••" : `${transaction.type === "income" ? "+ " : "− "}${money.format(transaction.amount)}`}</div>
          <div role="cell"><button type="button" aria-label={`Opções de ${transaction.title}`} aria-haspopup="menu" aria-expanded={menu?.transaction.id === transaction.id} className={styles.iconButton} onClick={event => { const button = event.currentTarget; if (menu?.transaction.id === transaction.id) { setMenu(null); return; } triggerRef.current = button; const bounds = button.getBoundingClientRect(); setMenu({ transaction, left: Math.max(12, Math.min(bounds.right - 180, window.innerWidth - 192)), top: Math.min(bounds.bottom + 4, window.innerHeight - 108) }); }}><MoreHorizontal className="size-4" /></button></div>
        </div>;
      })}
    </div>
    {menu && createPortal(<div ref={menuRef} role="menu" aria-label={`Ações de ${menu.transaction.title}`} className={styles.menu} style={{ left: menu.left, top: menu.top }} onKeyDown={event => { if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button")); const current = buttons.indexOf(document.activeElement as HTMLButtonElement); buttons[(current + (event.key === "ArrowDown" ? 1 : buttons.length - 1)) % buttons.length]?.focus(); } }}><button role="menuitem" onClick={() => { triggerRef.current?.focus(); setMenu(null); onEdit(menu.transaction); }}><Pencil className="size-4" />Editar</button><button role="menuitem" className="text-destructive" onClick={() => { triggerRef.current?.focus(); setMenu(null); onRemove(menu.transaction.id); }}><Trash2 className="size-4" />Remover</button></div>, document.body)}
  </div>;
}
