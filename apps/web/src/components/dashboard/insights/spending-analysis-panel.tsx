"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Transaction } from "@/types/finance";
import {
  getTransactionCategoryLabel,
  TRANSACTION_CATEGORIES,
} from "@/types/transaction-category";

type ChartType = "category-pie" | "monthly-evolution" | "category-ranking";
type EntryTypeFilter = "expense" | "income" | "all";
type KindFilter = "all" | "single" | "installment" | "recurring";
type PeriodFilter = "3" | "6" | "12" | "all";

const CHART_TYPE_OPTIONS: { value: ChartType; label: string }[] = [
  { value: "category-pie", label: "Pizza por categoria" },
  { value: "monthly-evolution", label: "Evolução mensal" },
  { value: "category-ranking", label: "Ranking de categorias" },
];

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const fieldClassName =
  "w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatTooltipValue(value: unknown) {
  return typeof value === "number" ? formatCurrency(value) : String(value ?? "");
}

function getSimplifiedKind(transaction: Transaction): Exclude<KindFilter, "all"> {
  if (transaction.transactionKind === "single") return "single";
  if (transaction.transactionKind.startsWith("installment")) return "installment";
  return "recurring";
}

function getEffectiveDate(transaction: Transaction): Date | null {
  const raw = transaction.occurrenceDate ?? transaction.createdAt;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("pt-BR", {
    month: "short",
    year: "2-digit",
  });
}

export function SpendingAnalysisPanel({ transactions }: { transactions: Transaction[] }) {
  const [chartType, setChartType] = useState<ChartType>("category-pie");
  const [entryTypeFilter, setEntryTypeFilter] = useState<EntryTypeFilter>("expense");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("6");

  const filteredTransactions = useMemo(() => {
    const monthsBack = periodFilter === "all" ? null : Number(periodFilter);
    const cutoff = monthsBack
      ? (() => {
          const date = new Date();
          date.setMonth(date.getMonth() - monthsBack);
          date.setDate(1);
          date.setHours(0, 0, 0, 0);
          return date;
        })()
      : null;

    return transactions.filter((transaction) => {
      if (entryTypeFilter !== "all" && transaction.type !== entryTypeFilter) {
        return false;
      }

      if (kindFilter !== "all" && getSimplifiedKind(transaction) !== kindFilter) {
        return false;
      }

      if (categoryFilter !== "all" && transaction.category !== categoryFilter) {
        return false;
      }

      if (cutoff) {
        const date = getEffectiveDate(transaction);
        if (!date || date < cutoff) return false;
      }

      return true;
    });
  }, [transactions, entryTypeFilter, kindFilter, categoryFilter, periodFilter]);

  const categoryData = useMemo(() => {
    const totals = new Map<string, number>();

    for (const transaction of filteredTransactions) {
      totals.set(
        transaction.category,
        (totals.get(transaction.category) ?? 0) + transaction.amount,
      );
    }

    return Array.from(totals.entries())
      .map(([category, amount]) => ({
        category,
        label: getTransactionCategoryLabel(category),
        amount,
      }))
      .sort((left, right) => right.amount - left.amount);
  }, [filteredTransactions]);

  const monthlyData = useMemo(() => {
    const totals = new Map<string, { entradas: number; saidas: number }>();

    for (const transaction of filteredTransactions) {
      const date = getEffectiveDate(transaction);
      if (!date) continue;

      const key = getMonthKey(date);
      const current = totals.get(key) ?? { entradas: 0, saidas: 0 };

      if (transaction.type === "income") {
        current.entradas += transaction.amount;
      } else {
        current.saidas += transaction.amount;
      }

      totals.set(key, current);
    }

    return Array.from(totals.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([monthKey, values]) => ({
        month: getMonthLabel(monthKey),
        ...values,
      }));
  }, [filteredTransactions]);

  const hasData =
    chartType === "monthly-evolution" ? monthlyData.length > 0 : categoryData.length > 0;

  return (
    <Card className="rounded-[1.75rem] border-border/60 bg-card/70 shadow-sm">
      <CardHeader className="space-y-1 pb-3">
        <CardTitle className="text-lg font-semibold tracking-tight">
          Análise de gastos
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Explore seus lançamentos pagos por categoria, período e tipo de lançamento.
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <select
            aria-label="Tipo de gráfico"
            value={chartType}
            onChange={(event) => setChartType(event.target.value as ChartType)}
            className={fieldClassName}
          >
            {CHART_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            aria-label="Entradas ou saídas"
            value={entryTypeFilter}
            onChange={(event) => setEntryTypeFilter(event.target.value as EntryTypeFilter)}
            className={fieldClassName}
          >
            <option value="expense">Só saídas</option>
            <option value="income">Só entradas</option>
            <option value="all">Entradas e saídas</option>
          </select>

          <select
            aria-label="Tipo de lançamento"
            value={kindFilter}
            onChange={(event) => setKindFilter(event.target.value as KindFilter)}
            className={fieldClassName}
          >
            <option value="all">Todos os lançamentos</option>
            <option value="single">Só únicos</option>
            <option value="installment">Só parcelados</option>
            <option value="recurring">Só recorrentes</option>
          </select>

          <select
            aria-label="Categoria"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className={fieldClassName}
          >
            <option value="all">Todas as categorias</option>
            {TRANSACTION_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {getTransactionCategoryLabel(category)}
              </option>
            ))}
          </select>

          <select
            aria-label="Período"
            value={periodFilter}
            onChange={(event) => setPeriodFilter(event.target.value as PeriodFilter)}
            className={fieldClassName}
          >
            <option value="3">Últimos 3 meses</option>
            <option value="6">Últimos 6 meses</option>
            <option value="12">Últimos 12 meses</option>
            <option value="all">Tudo</option>
          </select>
        </div>

        {!hasData ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nenhum lançamento pago encontrado com esses filtros.
          </p>
        ) : chartType === "category-pie" ? (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="amount"
                  nameKey="label"
                  innerRadius="45%"
                  outerRadius="80%"
                  paddingAngle={2}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={entry.category} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={formatTooltipValue} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : chartType === "monthly-evolution" ? (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} width={40} />
                <Tooltip formatter={formatTooltipValue} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="entradas" name="Entradas" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saidas" name="Saídas" fill="var(--destructive)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis
                  type="category"
                  dataKey="label"
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  width={100}
                />
                <Tooltip formatter={formatTooltipValue} />
                <Bar dataKey="amount" name="Total" radius={[0, 4, 4, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={entry.category} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
