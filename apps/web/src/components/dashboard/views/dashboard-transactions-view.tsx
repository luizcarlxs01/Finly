"use client";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Eye, EyeOff, Plus, Search, SlidersHorizontal, CalendarDays, ChevronDown } from "lucide-react";
import { FinanceSummaryCard } from "@/components/dashboard/finance-summary-card";
import { TransactionForm } from "@/components/dashboard/transaction-form";
import { FinancialDialog } from "@/components/dashboard/overlays/financial-dialog";
import { CompactFinancialCalendar } from "./compact-financial-calendar";
import { TransactionStatement } from "./transaction-statement";
import { Button } from "@/components/ui/button";
import { useValuePrivacy } from "@/hooks/use-value-privacy";
import { getCalendarMonthData } from "@/utils/financial-calendar";
import { getTodayDateValue } from "@/utils/recurring-transactions";
import { getTransactionDateValue } from "@/utils/statement-transactions";
import { TRANSACTION_CATEGORIES, getTransactionCategoryLabel } from "@/types/transaction-category";
import type { TransactionSortOption } from "@/components/dashboard/transaction-advanced-filters";
import type { LocalFinanceTransactionInput } from "@/hooks/use-local-finance";
import type { Transaction, TransactionFilter } from "@/types/finance";
import styles from "./dashboard-transactions-view.module.css";

type DashboardTransactionsViewProps = {
  isSubmitting?: boolean;
  transactionFilter: TransactionFilter;
  onTransactionFilterChange: (filter: TransactionFilter) => void;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  sortOption: TransactionSortOption;
  onSortOptionChange: (value: TransactionSortOption) => void;
  filteredTransactions: Transaction[];
  statementTransactions: Transaction[];
  hasActiveAdvancedFilters: boolean;
  onClearAdvancedFilters: () => void;
  onAddTransaction: (input: LocalFinanceTransactionInput) => void;
  onPreviewTransaction: (input: LocalFinanceTransactionInput) => void;
  onClearPreview: () => void;
  isPreviewActive: boolean;
  onEditTransaction: (transaction: Transaction) => void;
  onRemoveTransaction: (id: string) => void;
  getNextRecurringOccurrence: (transaction: Transaction) => string | null;
  emptyStateTitle: string;
  emptyStateDescription: string;
  onOpenCalendar: (date?: string) => void;
  calendarTransactions?: Transaction[];
  createErrorMessage?: string | null;
  onOpenStatementProjection: () => void;
  initialBalance: number;
  totalIncome: number;
  totalExpense: number;
  currentBalance: number;
  forecastTotalIncome: number;
  forecastTotalExpense: number;
  forecastProjectedBalance: number;
  onUpdateInitialBalance: (value: number) => void;
  nextUpcomingMonthLabel?: string | null;
};


const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export function DashboardTransactionsView(props: DashboardTransactionsViewProps) {
  const { transactionFilter, onTransactionFilterChange, searchTerm, onSearchTermChange, categoryFilter, onCategoryFilterChange, sortOption, onSortOptionChange, filteredTransactions, statementTransactions, onOpenCalendar, currentBalance } = props;
  const { hidden, toggle } = useValuePrivacy();
  const [monthDate, setMonthDate] = useState(() => getTodayDateValue().slice(0, 7));
  const [selectedDate, setSelectedDate] = useState(getTodayDateValue);
  const [statementMonth, setStatementMonth] = useState(() => getTodayDateValue().slice(0, 7));
  const [monthOpen, setMonthOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const monthRef = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  useEffect(() => { onSortOptionChange("newest"); }, [onSortOptionChange]);
  useEffect(() => { if (createOpen && props.isPreviewActive) previewRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "nearest" }); }, [createOpen, props.isPreviewActive]);
  useLayoutEffect(() => {
    const root = rootRef.current!;
    const resize = () => {
      let top = 0;
      for (let element: HTMLElement | null = root; element; element = element.offsetParent as HTMLElement | null) top += element.offsetTop;
      root.style.setProperty("--transactions-height", Math.max(0, window.innerHeight - top - 20) + "px");
    };
    resize();
    const observer = new ResizeObserver(resize);
    if (root.parentElement) observer.observe(root.parentElement);
    window.addEventListener("resize", resize);
    return () => { observer.disconnect(); window.removeEventListener("resize", resize); };
  }, []);
  useEffect(() => {
    if (!filtersOpen && !monthOpen) return;
    const pointer = (event: PointerEvent) => { if (!filtersRef.current?.contains(event.target as Node)) setFiltersOpen(false); if (!monthRef.current?.contains(event.target as Node)) setMonthOpen(false); };
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") { if (monthOpen) { setMonthOpen(false); monthRef.current?.querySelector<HTMLButtonElement>("button")?.focus(); } else { setFiltersOpen(false); filtersRef.current?.querySelector<HTMLButtonElement>("button")?.focus(); } } };
    document.addEventListener("pointerdown", pointer); document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", pointer); document.removeEventListener("keydown", key); };
  }, [filtersOpen, monthOpen]);
  const month = useMemo(() => getCalendarMonthData({ transactions: props.calendarTransactions ?? statementTransactions, year: Number(monthDate.slice(0, 4)), monthIndex: Number(monthDate.slice(5)) - 1, currentBalance }), [props.calendarTransactions, statementTransactions, monthDate, currentBalance]);
  const monthTotals = useMemo(() => {
    const currentMonth = getTodayDateValue().slice(0, 7);
    const posted = statementTransactions.filter(item => item.occurrenceStatus === "paid" && getTransactionDateValue(item).startsWith(currentMonth));
    return { income: posted.filter(item => item.type === "income").reduce((sum, item) => sum + item.amount, 0), expense: posted.filter(item => item.type === "expense").reduce((sum, item) => sum + item.amount, 0) };
  }, [statementTransactions]);
  const rows = statementMonth ? filteredTransactions.filter(item => getTransactionDateValue(item).startsWith(statementMonth)) : filteredTransactions;
  const summary = <FinanceSummaryCard initialBalance={props.initialBalance} totalIncome={props.totalIncome} totalExpense={props.totalExpense} currentBalance={currentBalance} forecastTotalIncome={props.forecastTotalIncome} forecastTotalExpense={props.forecastTotalExpense} forecastProjectedBalance={props.forecastProjectedBalance} isPreviewActive={props.isPreviewActive} onClearPreview={props.onClearPreview} onUpdateInitialBalance={props.onUpdateInitialBalance} nextUpcomingMonthLabel={props.nextUpcomingMonthLabel} valuesHidden={hidden} onToggleValues={toggle} />;
  function selectMonth(value: string) {
    setStatementMonth(value);
    if (value) {
      setMonthDate(value);
      setSelectedDate(getTodayDateValue().startsWith(value) ? getTodayDateValue() : value + "-01");
    }
    setMonthOpen(false);
  }
  const monthLabel = statementMonth ? new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(statementMonth + "-01T12:00:00" )).replace(" de ", " ") : "Todos os meses";
  function openCalendar(date?: string) { if (date) setSelectedDate(date); onOpenCalendar(date); }
  return <div ref={rootRef} className={styles.transactions}>
    <h1 className="sr-only">Lançamentos</h1>
    <section data-shared-indicators data-eclipse-anchor className={styles.summary} aria-label="Indicadores financeiros">
      {[{ label: "Saldo atual", value: currentBalance }, { label: "Entradas", value: monthTotals.income }, { label: "Saídas", value: monthTotals.expense }, { label: "Resultado do mês", value: monthTotals.income - monthTotals.expense }].map((item, index) => <div key={item.label} className={styles.indicator}><strong>{hidden ? "••••••" : money.format(item.value)}</strong><span>{item.label}{index === 0 && <><button type="button" aria-label={hidden ? "Mostrar valores" : "Ocultar valores"} className={styles.iconButton} onClick={toggle}>{hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></>}</span></div>)}
    </section>
    <div className={styles.columns}>
      <CompactFinancialCalendar month={month} selectedDate={selectedDate} hidden={hidden} onSelect={setSelectedDate} onOpen={openCalendar} />
      <section className={styles.card + " " + styles.statement} aria-label="Extrato">
        <div className={styles.statementTop}>
          <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-semibold">Extrato</h2><Button onClick={() => setCreateOpen(true)} className="rounded-xl"><Plus className="size-4" />Novo lançamento</Button></div>
          <div className={styles.controls}>
            <div className={styles.tabs} aria-label="Tipo de lançamento">{([{ value: "all", label: "Todos" }, { value: "income", label: "Entradas" }, { value: "expense", label: "Saídas" }] as const).map(tab => <button type="button" key={tab.value} aria-pressed={transactionFilter === tab.value} onClick={() => onTransactionFilterChange(tab.value)}>{tab.label}</button>)}</div>
            <label className={styles.search}><Search className="size-4 shrink-0" /><input type="search" aria-label="Buscar lançamento" placeholder="Buscar lançamento" value={searchTerm} onChange={event => onSearchTermChange(event.target.value)} /></label>
            <div ref={monthRef} className={"relative " + styles.monthControl}>
              <button type="button" className={styles.monthButton} aria-label={"Mês de referência: " + monthLabel} aria-expanded={monthOpen} onClick={() => { setMonthOpen(!monthOpen); setFiltersOpen(false); }}><CalendarDays className="size-4" /><span>{monthLabel}</span><ChevronDown className="size-4" /></button>
              {monthOpen && <div className={styles.filters}><label>Mês de referência<input type="month" autoFocus value={statementMonth} onChange={event => { if (event.target.validity.valid && event.target.value) selectMonth(event.target.value); }} /></label><Button variant="ghost" onClick={() => selectMonth("")}>Todos os meses</Button></div>}
            </div>
            <div ref={filtersRef} className={"relative " + styles.filterControl}><button type="button" className={styles.iconButton + " border border-border"} aria-label="Filtros do extrato" aria-expanded={filtersOpen} onClick={() => { setFiltersOpen(!filtersOpen); setMonthOpen(false); }}><SlidersHorizontal className="size-4" />{(props.hasActiveAdvancedFilters || statementMonth) && <span className="absolute -right-1 -top-1 size-2 rounded-full bg-primary" />}</button>
              {filtersOpen && <div className={styles.filters}><label>Categoria<select value={categoryFilter} onChange={event => onCategoryFilterChange(event.target.value)}><option value="all">Todas as categorias</option>{TRANSACTION_CATEGORIES.map(category => <option value={category} key={category}>{getTransactionCategoryLabel(category)}</option>)}</select></label><label>Ordenação<select value={sortOption} onChange={event => onSortOptionChange(event.target.value as TransactionSortOption)}><option value="newest">Mais recentes</option><option value="oldest">Mais antigas</option><option value="highest">Maior valor</option><option value="lowest">Menor valor</option><option value="title-asc">Título A–Z</option><option value="title-desc">Título Z–A</option></select></label><button type="button" className="mb-3 text-sm text-primary hover:underline" onClick={() => { setFiltersOpen(false); setSummaryOpen(true); }}>Resumo financeiro</button><Button variant="ghost" onClick={() => { props.onClearAdvancedFilters(); setStatementMonth(""); }}>Limpar filtros</Button><button type="button" className="ml-3 text-sm text-primary" onClick={() => setFiltersOpen(false)}>Fechar</button></div>}
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground"><span aria-live="polite">{rows.length} de {statementTransactions.length} lançamentos{statementMonth ? " · " + statementMonth.split("-").reverse().join("/") : ""}</span><button type="button" className="text-primary hover:underline" onClick={props.onOpenStatementProjection}>Ver projeção</button></div>
        </div>
        <TransactionStatement transactions={rows} hidden={hidden} sort={sortOption} onSort={onSortOptionChange} onEdit={props.onEditTransaction} onRemove={props.onRemoveTransaction} getNextRecurringOccurrence={props.getNextRecurringOccurrence} emptyTitle={props.emptyStateTitle} emptyDescription={props.emptyStateDescription} />
      </section>
    </div>
    {summaryOpen && <FinancialDialog title="Resumo financeiro" onClose={() => setSummaryOpen(false)}>{summary}<a href="https://wa.me/5511975832629" target="_blank" rel="noreferrer" className="mt-4 block text-center text-sm text-primary">Reportar problema</a></FinancialDialog>}
    {createOpen && <FinancialDialog title="Novo lançamento" onClose={() => { setCreateOpen(false); props.onClearPreview(); }}><TransactionForm onAddTransaction={async input => { await props.onAddTransaction(input); setCreateOpen(false); }} onPreviewTransaction={props.onPreviewTransaction} onClearPreview={props.onClearPreview} isPreviewActive={props.isPreviewActive} showPreviewNotice={false} isSubmitting={props.isSubmitting} />{props.createErrorMessage && <p role="alert" className="mt-3 text-sm text-destructive">{props.createErrorMessage}</p>}{props.isPreviewActive && <div ref={previewRef} className="mt-4">{summary}</div>}</FinancialDialog>}
  </div>;
}
