"use client";

import { useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { gsap } from "gsap";
import { ArrowRight, ChevronDown } from "lucide-react";
import { getCategoryIcon } from "@/components/dashboard/category-icons";
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Goal } from "@/types/goal";
import type { Transaction } from "@/types/transaction";
import { getTransactionCategoryLabel } from "@/types/transaction-category";
import { formatBusinessDateBr } from "@/utils/date-format";
import { getTodayDateValue } from "@/utils/recurring-transactions";

import Orb from "@/components/visuals/orb";
import styles from "./dashboard-home-view.module.css";

type Period = "6M" | "YTD" | "1A";
const HIDDEN_VALUES_KEY = "finly:dashboard-values-hidden";
const PRIVACY_PREFERENCE_EVENT = "finly:dashboard-values-hidden-change";
type Props = {
  currentBalance: number;
  postedTransactions: Transaction[];
  goals: Goal[];
  onViewTransactions: () => void;
  onViewGoals: () => void;
  onViewInsights: () => void;
  errorMessage?: string | null;
};

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const axisMoney = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 0 });
const shortMonth = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" });

function subscribeToMotionPreference(onChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getMotionPreference() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getServerMotionPreference() {
  return true;
}

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

export function DashboardHomeView({ currentBalance, postedTransactions, goals, onViewTransactions, onViewGoals, onViewInsights, errorMessage }: Props) {
  const hidden = useSyncExternalStore(subscribeToPrivacyPreference, getPrivacyPreference, getServerPrivacyPreference);
  const reducedMotion = useSyncExternalStore(subscribeToMotionPreference, getMotionPreference, getServerMotionPreference);
  const [period, setPeriod] = useState<Period>("6M");
  const [showMonthlyResult, setShowMonthlyResult] = useState(false);
  const balanceFacesRef = useRef<HTMLSpanElement>(null);
  const balanceInitializedRef = useRef(false);

  useLayoutEffect(() => {
    const faces = balanceFacesRef.current?.querySelectorAll<HTMLElement>("[data-active]");
    if (!faces?.length) return;
    const incoming = Array.from(faces).find(face => face.dataset.active === "true")!;
    const outgoing = Array.from(faces).find(face => face.dataset.active === "false")!;
    let animation: gsap.core.Timeline | undefined;
    gsap.killTweensOf(faces);

    if (!balanceInitializedRef.current || reducedMotion) {
      gsap.set(incoming, { autoAlpha: 1, y: 0 });
      gsap.set(outgoing, { autoAlpha: 0, y: -12 });
      balanceInitializedRef.current = true;
    } else {
      if (Number(gsap.getProperty(incoming, "opacity")) > 0) {
        gsap.set(outgoing, { autoAlpha: 0 });
        gsap.to(incoming, { autoAlpha: 1, y: 0, duration: 0.22, ease: "power2.out" });
      } else {
        gsap.set(incoming, { autoAlpha: 0, y: -12 });
        animation = gsap.timeline()
          .to(outgoing, { autoAlpha: 0, y: 12, duration: 0.12, ease: "power1.out" })
          .to(incoming, { autoAlpha: 1, y: 0, duration: 0.22, ease: "power2.out" });
      }
    }

    return () => { animation?.kill(); gsap.killTweensOf(faces); };
  }, [showMonthlyResult, reducedMotion, errorMessage]);
  const todayKey = getTodayDateValue();
  const today = useMemo(() => new Date(`${todayKey}T12:00:00`), [todayKey]);

  const { recent, futureAdjustment } = useMemo(() => {
    const recent: { transaction: Transaction; date: string }[] = [];
    let futureAdjustment = 0;
    for (const transaction of postedTransactions) {
      const date = effectiveDate(transaction);
      if (!date) continue;
      if (date > todayKey) {
        futureAdjustment += transaction.type === "income" ? -transaction.amount : transaction.amount;
        continue;
      }
      recent.push({ transaction, date });
    }
    recent.sort((a, b) => b.date.localeCompare(a.date) || b.transaction.createdAt.localeCompare(a.transaction.createdAt));
    return { recent, futureAdjustment };
  }, [postedTransactions, todayKey]);

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
  const currentMonth = chart.at(-1);
  const monthlyResult = (currentMonth?.income ?? 0) - (currentMonth?.expense ?? 0);
  const availableBalance = currentBalance + futureAdjustment;
  const monthExpenses = currentMonth?.expense ?? 0;
  const healthyBalance = monthExpenses > 0 && availableBalance >= monthExpenses * 2;
  const insightTitle = healthyBalance ? "Saldo saudável" : monthExpenses === 0 ? "Saldo sem comparação" : "Acompanhe o saldo";
  const insightBadge = healthyBalance ? "Bom sinal" : monthExpenses === 0 ? "Sem dados" : "Atenção";
  const insightDescription = healthyBalance
    ? "Seu saldo atual cobre pelo menos duas vezes as despesas lançadas neste mês."
    : monthExpenses === 0
      ? "Ainda não há despesas neste mês para avaliar o saldo."
      : availableBalance <= 0
        ? "Seu saldo atual não cobre as despesas lançadas neste mês."
        : "Seu saldo atual cobre menos de duas vezes as despesas lançadas neste mês.";

  const heading = <div className={`${styles.heading} mb-6 flex items-start justify-between gap-4 sm:mb-8`}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Visão geral</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">Suas finanças em um só lugar</p>
      </div>
    </div>;

  return <section aria-label="Início" className={`${styles.overview} w-full min-w-0`}>
    {errorMessage ? <>{heading}<p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{errorMessage}</p></> : <>
      <div className={styles.hero} data-eclipse-anchor="home">
        {heading}

        <div className={styles.goals}>
        <section aria-label="Resumo de metas" className={`${styles.card} ${styles.interactiveCard} min-w-0 p-5 sm:p-6`}>
          <button type="button" className={styles.cardLink} aria-label="Abrir Metas" onClick={onViewGoals} />
          <h2 className="flex items-center justify-between gap-2 border-b border-border/60 pb-3 text-xl font-semibold tracking-tight text-foreground">Metas<ArrowRight className={styles.cardArrow} size={20} aria-hidden="true" /></h2>
          {goals.length ? <ul className="mt-3 divide-y divide-border/70">{goals.slice(0, 2).map((goal) => {
            const progress = goal.targetAmount > 0 ? Math.min(100, Math.max(0, goal.currentAmount / goal.targetAmount * 100)) : 0;
            return <li key={goal.id} className="py-3 first:pt-0">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-medium text-foreground">{goal.title}</span>
                <span className="shrink-0 text-xs font-semibold text-primary">{hidden ? "••••" : `${Math.round(progress)}%`}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-primary/10" role="progressbar" aria-label={`Progresso de ${goal.title}`}
                aria-valuenow={hidden ? undefined : Math.round(progress)} aria-valuemin={hidden ? undefined : 0} aria-valuemax={hidden ? undefined : 100}>
                {!hidden ? <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} /> : null}
              </div>
              <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                <span>{hidden ? "••••••" : money.format(goal.currentAmount)}</span>
                <span>{hidden ? "••••••" : `Meta: ${money.format(goal.targetAmount)}`}</span>
              </div>
            </li>;
          })}</ul> : <p className="my-8 text-center text-sm text-muted-foreground">Nenhuma meta cadastrada.</p>}
        </section>
        <section aria-label="Insight do saldo" className={`${styles.card} ${styles.interactiveCard} ${styles.insight}`}>
          <button type="button" className={styles.cardLink} aria-label="Abrir Insights" onClick={onViewInsights} />
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-foreground">{insightTitle}</h2>
            <div className={styles.insightActions}>
              <span className={styles.insightBadge}>{insightBadge}</span>
              <ArrowRight className={`${styles.cardArrow} ${styles.insightArrow}`} size={20} aria-hidden="true" />
            </div>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{insightDescription}</p>
        </section>
        </div>
        <button
          type="button"
          className={styles.balance}
          aria-label={showMonthlyResult ? "Resultado do mês. Mostrar saldo atual" : "Saldo atual. Mostrar resultado do mês"}
          aria-pressed={showMonthlyResult}
          onClick={() => setShowMonthlyResult(current => !current)}
        >
          <div className={styles.orb} aria-hidden="true">
            <Orb hoverIntensity={0.26} hue={2} rotateOnHover={false} forceHoverState={false} backgroundColor="#f4f8fd" />
          </div>
          <span className={styles.balanceText} aria-live="polite">
            <span ref={balanceFacesRef} className={styles.balanceFaces}>
              {[false, true].map(isResult => {
                const active = showMonthlyResult === isResult;
                return <span key={String(isResult)} aria-hidden={!active} data-active={active} className={styles.balanceFace}>
                  <span className="block text-sm font-medium text-foreground sm:text-base">{isResult ? "Resultado do mês" : "Saldo atual"}</span>
                  <span className="block break-words text-2xl font-semibold tracking-tight text-primary tabular-nums sm:text-3xl">{hidden ? "••••••" : money.format(isResult ? monthlyResult : currentBalance + futureAdjustment)}</span>
                </span>;
              })}
            </span>
            <ChevronDown className={styles.balanceArrow} size={18} aria-hidden="true" />
          </span>
        </button>
        <section aria-label="Transações Recentes" className={`${styles.card} ${styles.interactiveCard} ${styles.transactions} min-w-0 p-5 sm:p-6`}>
          <button type="button" className={styles.cardLink} aria-label="Abrir Lançamentos" onClick={onViewTransactions} />
          <h2 className="flex items-center justify-between gap-2 text-xl font-semibold tracking-tight text-foreground">Transações Recentes<ArrowRight className={styles.cardArrow} size={20} aria-hidden="true" /></h2>
          {recent.length ? <ul className="mt-3 divide-y divide-border/70 border-t border-border/70">{recent.slice(0, 5).map(({ transaction, date }) => {
            const Icon = getCategoryIcon(transaction.category);
            return <li key={transaction.id} className="flex items-center justify-between gap-3 py-3">
              <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/5 text-primary"><Icon className="size-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{transaction.title}</p>
                <p className="text-xs text-muted-foreground">{getTransactionCategoryLabel(transaction.category)} · {formatBusinessDateBr(date)}</p>
              </div>
              <span className={`shrink-0 text-xs font-medium sm:text-sm ${transaction.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
                {hidden ? "••••••" : `${transaction.type === "income" ? "+" : "−"} ${money.format(transaction.amount)}`}
              </span>
            </li>;
          })}</ul>
            : <p className="my-8 text-center text-sm text-muted-foreground">Nenhuma transação paga até hoje.</p>}
        </section>
      </div>
      <section aria-label="Fluxo de Caixa" className={`${styles.card} ${styles.cashflow} min-w-0 p-5 sm:p-6 lg:p-7`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Fluxo de Caixa</h2>
            <p className="mt-1 text-xs text-muted-foreground">{range}</p>
          </div>
          <div role="group" aria-label="Período do fluxo de caixa" className="inline-flex rounded-full bg-muted p-1">
            {(["6M", "YTD", "1A"] as const).map((option) => <button key={option} type="button" onClick={() => setPeriod(option)}
              aria-pressed={period === option} className={`rounded-full px-3 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${period === option ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{option}</button>)}
          </div>
        </div>
        <div className={`${styles.chart} mt-5 h-56 w-full sm:h-64 lg:h-60`} role="img" aria-label={hidden ? "Gráfico com valores ocultos" : `Fluxo mensal de receitas e despesas de ${range}`}>
          {hidden ? <div className="flex h-full items-center justify-center rounded-xl bg-muted/40 text-sm text-muted-foreground">Valores ocultos</div>
            : hasChartValues ? <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chart} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 4" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis width={68} tickFormatter={(value: number) => axisMoney.format(value)} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value, name) => [money.format(Number(value ?? 0)), name === "income" ? "Receitas" : "Despesas"]}
                  contentStyle={{ borderRadius: 12, borderColor: "var(--border)", background: "var(--card)" }} />
                <Area type="monotone" dataKey="income" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.12} strokeWidth={2.5} dot={false} isAnimationActive={!reducedMotion} animationBegin={0} animationDuration={900} animationEasing="ease-in-out" activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="expense" stroke="var(--chart-2)" strokeWidth={2.5} dot={false} isAnimationActive={!reducedMotion} animationBegin={0} animationDuration={900} animationEasing="ease-in-out" activeDot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
            : <div className="flex h-full items-center justify-center rounded-xl bg-muted/40 text-center text-sm text-muted-foreground">Sem movimentações pagas neste período.</div>}
        </div>
        <div className="mt-4 flex justify-center gap-5 text-xs text-muted-foreground">
          <span className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-[var(--chart-1)]" />Receitas</span>
          <span className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-[var(--chart-2)]" />Despesas</span>
        </div>
      </section>
    </>}
  </section>;
}
