"use client";

import { useState } from "react";
import { Banknote, BriefcaseBusiness, Car, Gamepad2, GraduationCap, HeartPulse, House, MoreHorizontal, Pencil, ReceiptText, ShoppingBag, Target, Trash2, TrendingUp, Utensils } from "lucide-react";
import type { Goal } from "@/types/goal";
import { getTransactionCategoryLabel } from "@/types/transaction-category";

type GoalListProps = {
  goals: Goal[];
  lastContributions?: Record<string, number>;
  onAddContribution?: (goal: Goal, amount: number) => Promise<void>;
  onUpdateProgress: (goal: Goal) => void;
  onAddCustom?: (goal: Goal) => void;
  onRemoveGoal: (id: string) => void;
  actionsDisabled?: boolean;
  noResults?: boolean;
};

const formatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const icons = { alimentacao: Utensils, transporte: Car, moradia: House, saude: HeartPulse, educacao: GraduationCap, lazer: Gamepad2, salario: Banknote, freelance: BriefcaseBusiness, contas: ReceiptText, investimentos: TrendingUp, compras: ShoppingBag, geral: Target };

function ProgressValues({ goal, progress, color }: { goal: Goal; progress: number; color: "black" | "white" }) {
  return <div className={`absolute inset-0 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1 px-3 text-[clamp(0.6875rem,1vw,1rem)] ${color === "white" ? "text-white" : "text-muted-foreground"}`}>
    <span className="justify-self-start whitespace-nowrap font-semibold">{formatter.format(goal.currentAmount)}</span>
    <span className="justify-self-center whitespace-nowrap font-semibold">{progress.toFixed(0)}%</span>
    <span className="justify-self-end whitespace-nowrap font-medium">{formatter.format(goal.targetAmount)}</span>
  </div>;
}

export function GoalList({ goals, lastContributions = {}, onAddContribution = async () => {}, onUpdateProgress, onAddCustom = onUpdateProgress, onRemoveGoal, actionsDisabled = false, noResults = false }: GoalListProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [pendingGoal, setPendingGoal] = useState<string | null>(null);

  if (!goals.length) return noResults ? <p className="px-4 pt-10 text-center text-sm text-muted-foreground">Nenhuma meta corresponde à busca ou aos filtros.</p> : null;

  return <div className="divide-y divide-border/60 rounded-t-[inherit] bg-card">
    {goals.map((goal) => {
      const Icon = icons[goal.category as keyof typeof icons] ?? Target;
      const progress = goal.targetAmount > 0 ? Math.min(goal.currentAmount / goal.targetAmount * 100, 100) : 0;
      const quickAmount = lastContributions[goal.id] > 0 ? lastContributions[goal.id] : goal.currentAmount > 0 ? goal.currentAmount : 1;
      return <div key={goal.id} className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,1.2fr)_minmax(0,1fr)] lg:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground"><Icon size={24} strokeWidth={1.5} /></span>
          <div className="min-w-0"><h3 className="truncate font-medium text-foreground">{goal.title}</h3><p className="text-sm text-muted-foreground">{goal.category === "general" ? "Geral" : getTransactionCategoryLabel(goal.category)}{goal.deadline ? ` · Até ${new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${goal.deadline}T12:00:00Z`))}` : ""}</p></div>
        </div>
        <div className="relative h-11 overflow-hidden rounded-full bg-muted dark:bg-slate-200" aria-label={`Progresso: ${progress.toFixed(0)}%`}>
          <span className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] dark:bg-[#1A75FF]" style={{ width: `${progress}%` }} />
          <ProgressValues goal={goal} progress={progress} color="black" />
          <div aria-hidden="true" className="absolute inset-0 transition-[clip-path]" style={{ clipPath: `inset(0 ${100 - progress}% 0 0)` }}>
            <ProgressValues goal={goal} progress={progress} color="white" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-1 sm:gap-2">
          {progress < 100 && <><button type="button" disabled={actionsDisabled || pendingGoal === goal.id} onClick={async () => { if (pendingGoal) return; setPendingGoal(goal.id); try { await onAddContribution(goal, quickAmount); } catch { /* Error appears in the page message. */ } finally { setPendingGoal(null); } }} className="h-11 min-w-24 whitespace-nowrap rounded-xl bg-primary/10 px-3 text-sm font-medium text-primary hover:bg-primary/20 disabled:opacity-50 sm:min-w-28">+ {formatter.format(quickAmount)}</button><span aria-hidden="true" className="mx-0.5 h-9 w-px shrink-0 bg-border/80" /></>}
          {progress < 100 && <button type="button" disabled={actionsDisabled || pendingGoal === goal.id} onClick={() => onAddCustom(goal)} className="whitespace-nowrap rounded-xl px-2 py-2 text-sm font-medium text-primary hover:bg-primary/10 disabled:opacity-50">+ Adicionar</button>}
          <div className="relative">
            <button type="button" aria-label={`Opções de ${goal.title}`} aria-expanded={openMenu === goal.id} onClick={() => setOpenMenu(openMenu === goal.id ? null : goal.id)} className="flex size-10 items-center justify-center rounded-xl text-foreground hover:bg-muted"><MoreHorizontal size={20} /></button>
            {openMenu === goal.id && <><button type="button" aria-label="Fechar opções" className="fixed inset-0 z-10 cursor-default" onClick={() => setOpenMenu(null)} /><div className="absolute right-0 top-full z-20 w-36 rounded-xl border border-border bg-card p-1 shadow-lg"><button type="button" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted" onClick={() => { setOpenMenu(null); onUpdateProgress(goal); }}><Pencil size={16} />Editar valor</button><button type="button" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-destructive hover:bg-muted" onClick={() => { setOpenMenu(null); onRemoveGoal(goal.id); }}><Trash2 size={16} />Deletar</button></div></>}
          </div>
        </div>
      </div>;
    })}
  </div>;
}
