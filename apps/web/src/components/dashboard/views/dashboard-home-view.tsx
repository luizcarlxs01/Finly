"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Eye, EyeOff, Wallet } from "lucide-react";
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Goal } from "@/types/goal";
import type { Transaction } from "@/types/transaction";
import { getTransactionCategoryLabel } from "@/types/transaction-category";
import { formatBusinessDateBr } from "@/utils/date-format";
import { getTodayDateValue } from "@/utils/recurring-transactions";

type Period = "6M" | "YTD" | "1A";
const HIDDEN_VALUES_KEY = "finly:dashboard-values-hidden";
const PRIVACY_PREFERENCE_EVENT = "finly:dashboard-values-hidden-change";
type Props = {
  currentBalance: number;
  postedTransactions: Transaction[];
  goals: Goal[];
  onViewTransactions: () => void;
  onViewGoals: () => void;
  errorMessage?: string | null;
};

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const axisMoney = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 0 });
const shortMonth = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" });

function subscribeToPrivacyPreference(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(PRIVACY_PREFERENCE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(PRIVACY_PREFERENCE_EVENT, onChange);
  };
}

function getPrivacyPreference() {
  return window.localStorage.getItem(HIDDEN_VALUES_KEY) === "true";
}

function getServerPrivacyPreference() {
  return false;
}

function effectiveDate(transaction: Transaction) {
  const date = transaction.occurrenceDate ?? transaction.recurringOccurrenceDate;
  if (date) return date.slice(0, 10);
  const created = new Date(transaction.createdAt);
  if (Number.isNaN(created.getTime())) return null;
  return `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}-${String(created.getDate()).padStart(2, "0")}`;
}

function months(period: Period, today: Date) {
  const count = period === "6M" ? 6 : period === "1A" ? 12 : today.getMonth() + 1;
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(today.getFullYear(), today.getMonth() - count + i + 1, 1);
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: shortMonth.format(date),
      income: 0,
      expense: 0,
    };
  });
}

function Indicator({ title, value, hidden, icon }: {
  title: string; value: number; hidden: boolean; icon: React.ReactNode;
}) {
  return <div className="rounded-[1.25rem] border border-border/60 bg-card/70 p-4 shadow-sm sm:p-5">
    <div className="flex items-start justify-between gap-3">
      <p className="text-sm text-muted-foreground">{title}</p>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</span>
    </div>
    <p className="mt-3 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{hidden ? "••••••" : money.format(value)}</p>
  </div>;
}

export function DashboardHomeView({ currentBalance, postedTransactions, goals, onViewTransactions, onViewGoals, errorMessage }: Props) {
  const hidden = useSyncExternalStore(subscribeToPrivacyPreference, getPrivacyPreference, getServerPrivacyPreference);
  const [period, setPeriod] = useState<Period>("6M");
  const todayKey = getTodayDateValue();
  const today = useMemo(() => new Date(`${todayKey}T12:00:00`), [todayKey]);
  const monthKey = todayKey.slice(0, 7);

  const { recent, futureAdjustment, income, expense } = useMemo(() => {
    const recent: { transaction: Transaction; date: string }[] = [];
    let futureAdjustment = 0, income = 0, expense = 0;
    for (const transaction of postedTransactions) {
      const date = effectiveDate(transaction);
      if (!date) continue;
      if (date > todayKey) {
        futureAdjustment += transaction.type === "income" ? -transaction.amount : transaction.amount;
        continue;
      }
      recent.push({ transaction, date });
      if (date.slice(0, 7) === monthKey) {
        if (transaction.type === "income") income += transaction.amount;
        else expense += transaction.amount;
      }
    }
    recent.sort((a, b) => b.date.localeCompare(a.date) || b.transaction.createdAt.localeCompare(a.transaction.createdAt));
    return { recent, futureAdjustment, income, expense };
  }, [postedTransactions, todayKey, monthKey]);

  const chart = useMemo(() => {
    const result = months(period, today);
    const byMonth = new Map(result.map((item) => [item.key, item]));
    for (const { transaction, date } of recent) {
      const item = byMonth.get(date.slice(0, 7));
      if (item) item[transaction.type] += transaction.amount;
    }
    return result;
  }, [period, recent, today]);
  const range = `${chart[0]?.label ?? ""} – ${chart.at(-1)?.label ?? ""}`;
  const hasChartValues = chart.some((item) => item.income || item.expense);

  function toggleHiddenValues() {
    window.localStorage.setItem(HIDDEN_VALUES_KEY, String(!hidden));
    window.dispatchEvent(new Event(PRIVACY_PREFERENCE_EVENT));
  }

  return <section aria-label="Início" className="space-y-6 2xl:space-y-8">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Visão Geral</h1>
      <button type="button" onClick={toggleHiddenValues} aria-pressed={hidden}
        className="inline-flex items-center gap-2 rounded-2xl border border-border/70 bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}{hidden ? "Mostrar valores" : "Ocultar valores"}
      </button>
    </div>

    {errorMessage ? <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{errorMessage}</p> : null}

    {!errorMessage ? <>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Indicator title="Saldo atual" value={currentBalance + futureAdjustment} icon={<Wallet className="size-4" />} hidden={hidden} />
      <Indicator title="Receitas do mês" value={income} icon={<ArrowUpRight className="size-4" />} hidden={hidden} />
      <Indicator title="Despesas do mês" value={expense} icon={<ArrowDownRight className="size-4" />} hidden={hidden} />
      <Indicator title="Resultado do mês" value={income - expense} icon={<Wallet className="size-4" />} hidden={hidden} />
    </div>

    <div className="grid items-start gap-6 2xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,1fr)]">
      <section aria-label="Fluxo de Caixa" className="min-w-0 rounded-[1.75rem] border border-border/60 bg-card/95 p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Fluxo de Caixa</h2>
            <p className="mt-1 text-sm text-muted-foreground">Receitas e despesas de cada mês</p>
            <p className="mt-1 text-xs text-muted-foreground">{range}</p>
          </div>
          <div role="group" aria-label="Período do fluxo de caixa" className="inline-flex rounded-full bg-muted p-1">
            {(["6M", "YTD", "1A"] as const).map((option) => <button key={option} type="button" onClick={() => setPeriod(option)}
              aria-pressed={period === option} className={`rounded-full px-3 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${period === option ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{option}</button>)}
          </div>
        </div>
        <div className="mt-5 h-64 w-full" role="img" aria-label={hidden ? "Gráfico com valores ocultos" : `Fluxo mensal de receitas e despesas de ${range}`}>
          {hidden ? <div className="flex h-full items-center justify-center rounded-xl bg-muted/40 text-sm text-muted-foreground">Valores ocultos</div>
            : hasChartValues ? <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chart} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 4" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis width={68} tickFormatter={(value: number) => axisMoney.format(value)} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value, name) => [money.format(Number(value ?? 0)), name === "income" ? "Receitas" : "Despesas"]}
                  contentStyle={{ borderRadius: 12, borderColor: "var(--border)", background: "var(--card)" }} />
                <Area type="monotone" dataKey="income" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.12} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="expense" stroke="var(--chart-2)" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
            : <div className="flex h-full items-center justify-center rounded-xl bg-muted/40 text-center text-sm text-muted-foreground">Sem movimentações pagas neste período.</div>}
        </div>
        <div className="mt-3 flex justify-end gap-5 border-t border-border/70 pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-[var(--chart-1)]" />Receitas</span>
          <span className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-[var(--chart-2)]" />Despesas</span>
        </div>
      </section>

      <div className="grid gap-6">
        <section aria-label="Transações Recentes" className="rounded-[1.75rem] border border-border/60 bg-card/95 p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Transações Recentes</h2>
          {recent.length ? <ul className="mt-4 space-y-1">{recent.slice(0, 4).map(({ transaction, date }) =>
            <li key={transaction.id} className="flex items-center justify-between gap-3 rounded-xl px-2 py-2.5 hover:bg-muted/50">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{transaction.title}</p>
                <p className="text-xs text-muted-foreground">{getTransactionCategoryLabel(transaction.category)} · {formatBusinessDateBr(date)}</p>
              </div>
              <span className={`shrink-0 text-sm font-medium ${transaction.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
                {hidden ? "••••••" : `${transaction.type === "income" ? "+" : "−"} ${money.format(transaction.amount)}`}
              </span>
            </li>)}</ul>
            : <p className="my-8 text-center text-sm text-muted-foreground">Nenhuma transação paga até hoje.</p>}
          <button type="button" onClick={onViewTransactions} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary transition hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Ver todas as transações <ArrowRight className="size-4" />
          </button>
        </section>
        <section aria-label="Resumo de metas" className="rounded-[1.75rem] border border-border/60 bg-card/95 p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Metas</h2>
            <button type="button" onClick={onViewGoals} className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Ver metas</button>
          </div>
          {goals.length ? <ul className="mt-4 space-y-3">{goals.slice(0, 2).map((goal) => {
            const progress = goal.targetAmount > 0 ? Math.min(100, Math.max(0, goal.currentAmount / goal.targetAmount * 100)) : 0;
            return <li key={goal.id} className="rounded-xl bg-primary/5 p-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-medium text-foreground">{goal.title}</span>
                <span className="shrink-0 text-xs font-semibold text-primary">{hidden ? "••••" : `${Math.round(progress)}%`}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-primary/10" role="progressbar" aria-label={`Progresso de ${goal.title}`}
                aria-valuenow={hidden ? undefined : Math.round(progress)} aria-valuemin={hidden ? undefined : 0} aria-valuemax={hidden ? undefined : 100}>
                {!hidden ? <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} /> : null}
              </div>
              <div className="mt-2 flex justify-between gap-2 text-xs text-muted-foreground">
                <span>{hidden ? "••••••" : money.format(goal.currentAmount)}</span>
                <span>{hidden ? "••••••" : `Meta: ${money.format(goal.targetAmount)}`}</span>
              </div>
            </li>;
          })}</ul> : <p className="my-8 text-center text-sm text-muted-foreground">Nenhuma meta cadastrada.</p>}
        </section>
      </div>
    </div>
    </> : null}
  </section>;
}
