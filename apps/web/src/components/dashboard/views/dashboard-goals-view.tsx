"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Filter, Ghost, Plus, Search, X } from "lucide-react";
import { GoalForm } from "@/components/dashboard/goal-form";
import { GoalList } from "@/components/dashboard/goal-list";
import type { Goal } from "@/types/goal";
import { getTransactionCategoryLabel, TRANSACTION_CATEGORIES } from "@/types/transaction-category";

type GoalInput = { title: string; targetAmount: number; currentAmount: number; category: string; deadline?: string };
type Filters = { category: string; deadline: "" | "nearest" | "range"; from: string; to: string; progress: "" | "closest" | "furthest"; value: "" | "current" | "target" };
const emptyFilters: Filters = { category: "", deadline: "", from: "", to: "", progress: "", value: "" };
const sizes = [3, 6, 9, 12];
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const progressOf = (goal: Goal) => goal.targetAmount > 0 ? goal.currentAmount / goal.targetAmount : 0;

export type DashboardGoalsViewProps = {
  isSubmitting?: boolean;
  createErrorMessage?: string | null;
  areActionsDisabled?: boolean;
  goals: Goal[];
  totalGoalProgress?: number;
  remainingGoalAmount?: number;
  currencyFormatter?: Intl.NumberFormat;
  onAddGoal: (input: GoalInput) => Promise<void>;
  onUpdateProgress: (goal: Goal) => void;
  onAddCustom?: (goal: Goal) => void;
  onAddContribution?: (goal: Goal, amount: number) => Promise<void>;
  onRemoveGoal: (id: string) => void;
  lastContributions?: Record<string, number>;
};

export function DashboardGoalsView({ isSubmitting = false, createErrorMessage, areActionsDisabled = false, goals, onAddGoal, onUpdateProgress, onAddCustom, onAddContribution = async () => {}, onRemoveGoal, lastContributions = {} }: DashboardGoalsViewProps) {
  const [tab, setTab] = useState<"active" | "completed" | "all">("active");
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [applied, setApplied] = useState<Filters>(emptyFilters);
  const [draft, setDraft] = useState<Filters>(emptyFilters);
  const [filterError, setFilterError] = useState("");
  const [pageSize, setPageSize] = useState(3);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  const [page, setPage] = useState(1);
  const filterRef = useRef<HTMLDivElement>(null);
  const createButtonRef = useRef<HTMLButtonElement>(null);
  const createDialogRef = useRef<HTMLDivElement>(null);
  const pageSizeRef = useRef<HTMLDivElement>(null);
  const pageSizeButtonRef = useRef<HTMLButtonElement>(null);
  const hasFilters = Object.values(applied).some(Boolean);

  useEffect(() => { if (!filterOpen) return; const onPointer = (event: PointerEvent) => { if (filterRef.current && !filterRef.current.contains(event.target as Node)) setFilterOpen(false); }; const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setFilterOpen(false); }; document.addEventListener("pointerdown", onPointer); document.addEventListener("keydown", onKey); return () => { document.removeEventListener("pointerdown", onPointer); document.removeEventListener("keydown", onKey); }; }, [filterOpen]);
  useEffect(() => { if (!pageSizeOpen) return; pageSizeRef.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus(); const onPointer = (event: PointerEvent) => { if (pageSizeRef.current && !pageSizeRef.current.contains(event.target as Node)) setPageSizeOpen(false); }; const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { setPageSizeOpen(false); pageSizeButtonRef.current?.focus(); } }; document.addEventListener("pointerdown", onPointer); document.addEventListener("keydown", onKey); return () => { document.removeEventListener("pointerdown", onPointer); document.removeEventListener("keydown", onKey); }; }, [pageSizeOpen]);
  useEffect(() => { if (!createOpen) return; const old = document.body.style.overflow; const trigger = createButtonRef.current; document.body.style.overflow = "hidden"; const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setCreateOpen(false); }; document.addEventListener("keydown", onKey); return () => { document.body.style.overflow = old; document.removeEventListener("keydown", onKey); trigger?.focus(); }; }, [createOpen]);

  const counts = useMemo(() => { const active = goals.filter(g => progressOf(g) < 1); const date = today(); const limit = new Date(`${date}T12:00:00Z`); limit.setUTCDate(limit.getUTCDate() + 30); const until = limit.toISOString().slice(0, 10); return { active: active.length, completed: goals.length - active.length, approaching: active.filter(g => g.deadline && g.deadline >= date && g.deadline <= until).length }; }, [goals]);
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    const rows = goals.filter(g => (tab === "all" || (tab === "completed" ? progressOf(g) >= 1 : progressOf(g) < 1)) && (!query || `${g.title} ${g.category === "general" ? "Geral" : getTransactionCategoryLabel(g.category)}`.toLocaleLowerCase("pt-BR").includes(query)) && (!applied.category || (applied.category === "general" ? g.category === "general" || g.category === "geral" : g.category === applied.category)) && (applied.deadline !== "range" || (g.deadline && (!applied.from || g.deadline >= applied.from) && (!applied.to || g.deadline <= applied.to))));
    return rows.sort((a, b) => {
      if (applied.deadline === "nearest") { const diff = (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999"); if (diff) return diff; }
      if (applied.progress) { const diff = (progressOf(b) - progressOf(a)) * (applied.progress === "closest" ? 1 : -1); if (diff) return diff; }
      if (applied.value) { const diff = applied.value === "current" ? b.currentAmount - a.currentAmount : b.targetAmount - a.targetAmount; if (diff) return diff; }
      return b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id);
    });
  }, [goals, tab, search, applied]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const resetPage = () => setPage(1);
  const choosePageSize = (size: number) => { setPageSize(size); resetPage(); setPageSizeOpen(false); pageSizeButtonRef.current?.focus(); };
  const handlePageSizeKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    if (!pageSizeOpen) { setPageSizeOpen(true); return; }
    const options = Array.from(pageSizeRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? []);
    const current = options.indexOf(document.activeElement as HTMLButtonElement);
    const next = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : (current + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length;
    options[next]?.focus();
  };
  const patchDraft = (patch: Partial<Filters>) => setDraft(current => ({ ...current, ...patch }));
  const clearFilters = () => { setApplied(emptyFilters); setDraft(emptyFilters); setFilterError(""); resetPage(); };
  const removeFilter = (key: "category" | "deadline" | "progress" | "value") => {
    const patch: Partial<Filters> = key === "deadline" ? { deadline: "", from: "", to: "" } : { [key]: "" };
    setApplied(current => ({ ...current, ...patch }));
    setDraft(current => ({ ...current, ...patch }));
    setFilterError("");
    resetPage();
  };
  const applyFilters = () => { if (draft.deadline === "range" && (!draft.from || !draft.to || draft.from > draft.to)) { setFilterError("Informe um período válido: De deve ser anterior ou igual a Até."); return; } setApplied(draft); setFilterError(""); setFilterOpen(false); resetPage(); };
  const trapDialogFocus = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab" || !createDialogRef.current) return;
    const items = Array.from(createDialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled])'));
    const first = items[0], last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };
  const filterChips = [
    { key: "category" as const, label: applied.category ? applied.category === "general" ? "Geral" : getTransactionCategoryLabel(applied.category) : "" },
    { key: "deadline" as const, label: applied.deadline ? applied.deadline === "nearest" ? "Prazo: mais próximo" : `Prazo: ${applied.from} a ${applied.to}` : "" },
    { key: "progress" as const, label: applied.progress ? applied.progress === "closest" ? "Progresso: mais próxima" : "Progresso: mais distante" : "" },
    { key: "value" as const, label: applied.value ? applied.value === "current" ? "Valor: maior adicionado" : "Valor: maior alvo" : "" },
  ].filter(chip => chip.label);

  return <div className="space-y-6">
    <section aria-label="Resumo das metas" className="mx-auto grid w-full max-w-4xl grid-cols-3 items-center gap-3">
      {[[counts.active, "Em andamento"], [counts.completed, "Metas batidas"], [counts.approaching, "Próximas do prazo"]].map(([value, label], index) => <div key={label} className={`min-w-0 text-center ${index < 2 ? "border-r border-border/70" : ""}`}><p className="text-3xl font-semibold text-foreground sm:text-4xl">{value}</p><p className="text-xs text-muted-foreground sm:text-sm">{label}</p></div>)}
    </section>
        <div className="grid gap-3 sm:grid-cols-[360px_auto] sm:items-center sm:justify-center min-[1140px]:w-full min-[1140px]:!grid-cols-[1fr_360px_1fr] min-[1140px]:!justify-normal min-[1140px]:gap-0">
      <div role="group" aria-label="Estado das metas" className="flex w-full rounded-xl bg-muted p-1 sm:col-span-2 sm:w-auto sm:justify-self-center min-[1140px]:!col-span-1 min-[1140px]:!justify-self-start">{[["active", "Em andamento"], ["completed", "Concluídas"], ["all", "Todas"]].map(([key, label]) => <button key={key} type="button" aria-pressed={tab === key} onClick={() => { setTab(key as typeof tab); resetPage(); }} className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm sm:flex-none sm:px-5 ${tab === key ? "bg-card font-medium text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{label}</button>)}</div>
      <div className="flex min-w-0 w-full gap-2 min-[1140px]:w-[360px] min-[1140px]:justify-self-center"><label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-xl bg-muted px-3"><Search size={18} className="shrink-0 text-muted-foreground" /><input type="search" aria-label="Buscar metas" placeholder="Buscar em todas as metas" value={search} onChange={e => { setSearch(e.target.value); resetPage(); }} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" /></label>
        <div ref={filterRef} className="relative"><button type="button" aria-label="Filtros" aria-expanded={filterOpen} onClick={() => { setDraft(applied); setFilterError(""); setFilterOpen(!filterOpen); }} className="relative flex size-11 items-center justify-center rounded-xl bg-muted text-foreground hover:bg-primary/10"><Filter size={19} />{hasFilters && <span className="absolute right-0 top-0 size-2.5 rounded-full bg-primary" />}</button>
          {filterOpen && <div className="fixed inset-x-4 top-24 z-50 max-h-[calc(100dvh-7rem)] space-y-4 overflow-y-auto rounded-2xl border border-border bg-card p-4 text-sm shadow-xl lg:absolute lg:inset-x-auto lg:right-0 lg:top-12 lg:w-[min(90vw,390px)] lg:max-h-[min(80dvh,650px)]">
            <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Filtros</h2><button type="button" aria-label="Fechar filtros" onClick={() => setFilterOpen(false)}><X size={18} /></button></div>
            <label className="block space-y-1 font-medium">Categoria<select value={draft.category} onChange={e => patchDraft({ category: e.target.value })} className="h-10 w-full rounded-lg border border-border bg-background px-3 font-normal"><option value="">Todas as categorias</option><option value="general">Geral</option>{TRANSACTION_CATEGORIES.filter(c => c !== "geral").map(c => <option key={c} value={c}>{getTransactionCategoryLabel(c)}</option>)}</select></label>
            <fieldset className="border-t border-border pt-3"><legend className="font-medium">Prazo</legend><p className="mb-2 text-xs text-muted-foreground">Ordena pelo prazo ou restringe por período.</p><div className="grid grid-cols-2 gap-2"><button type="button" aria-pressed={draft.deadline === "nearest"} onClick={() => patchDraft({ deadline: draft.deadline === "nearest" ? "" : "nearest", from: "", to: "" })} className={`rounded-lg border p-2 ${draft.deadline === "nearest" ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>Mais próximo</button><button type="button" aria-pressed={draft.deadline === "range"} onClick={() => patchDraft({ deadline: draft.deadline === "range" ? "" : "range" })} className={`rounded-lg border p-2 ${draft.deadline === "range" ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>Período específico</button></div><div className="mt-2 h-[70px]">{draft.deadline === "range" && <div className="grid grid-cols-2 gap-2"><label>De<input type="date" value={draft.from} onChange={e => patchDraft({ from: e.target.value })} className="h-10 w-full rounded-lg border border-border bg-background px-1" /></label><label>Até<input type="date" value={draft.to} onChange={e => patchDraft({ to: e.target.value })} className="h-10 w-full rounded-lg border border-border bg-background px-1" /></label></div>}</div></fieldset>
            <fieldset className="border-t border-border pt-3"><legend className="font-medium">Progresso da meta</legend><p className="mb-2 text-xs text-muted-foreground">Ordenar por percentual atingido</p><div className="grid grid-cols-2 gap-2">{[["closest", "Mais próxima de atingir"], ["furthest", "Mais distante de atingir"]].map(([key, label]) => <button key={key} type="button" aria-pressed={draft.progress === key} onClick={() => patchDraft({ progress: draft.progress === key ? "" : key as Filters["progress"] })} className={`rounded-lg border p-2 ${draft.progress === key ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>{label}</button>)}</div></fieldset>
            <fieldset className="border-t border-border pt-3"><legend className="font-medium">Valor</legend><p className="mb-2 text-xs text-muted-foreground">Ordenar por valor, do maior ao menor</p><div className="grid grid-cols-2 gap-2">{[["current", "Maior valor adicionado"], ["target", "Maior valor alvo"]].map(([key, label]) => <button key={key} type="button" aria-pressed={draft.value === key} onClick={() => patchDraft({ value: draft.value === key ? "" : key as Filters["value"] })} className={`rounded-lg border p-2 ${draft.value === key ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>{label}</button>)}</div></fieldset>
            {filterError && <p role="alert" className="text-destructive">{filterError}</p>}
            <div className="flex items-center justify-between"><button type="button" onClick={clearFilters} className="text-primary">Limpar</button><button type="button" onClick={applyFilters} className="rounded-lg bg-primary px-4 py-2 text-primary-foreground">Aplicar filtros</button></div>
          </div>}
        </div></div>
      <button ref={createButtonRef} type="button" onClick={() => setCreateOpen(true)} className="flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-primary px-5 font-medium text-primary-foreground hover:bg-primary/90 min-[1140px]:!justify-self-end"><Plus size={18} /> Nova meta</button>
    </div>
    <div className="flex h-8 min-w-0 items-center gap-2 overflow-x-auto whitespace-nowrap">{filterChips.map(chip => <span key={chip.key} className="group relative inline-flex h-7 shrink-0 items-center rounded-full bg-primary/10 px-5 text-sm text-primary"><span className="transition-transform duration-200 ease-out group-hover:-translate-x-2.5 group-focus-within:-translate-x-2.5 motion-reduce:transition-none">{chip.label}</span><button type="button" aria-label={`Remover filtro ${chip.label}`} onClick={() => removeFilter(chip.key)} className="absolute right-1 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full opacity-0 transition-opacity duration-200 hover:bg-primary/10 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none [@media(hover:none)]:opacity-100"><X size={13} /></button></span>)}{hasFilters && <button type="button" onClick={clearFilters} className="shrink-0 text-sm text-primary">Limpar filtros</button>}</div>
    <div className="rounded-2xl shadow-sm"><div className="relative isolate flex min-h-[603px] flex-col rounded-2xl bg-card sm:min-h-[627px] lg:min-h-[267px]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-0 flex h-[603px] items-center justify-center sm:h-[627px] lg:h-[267px]"><Ghost className="size-64 text-slate-300/80 dark:text-slate-500/60 sm:size-72 lg:size-32 [&_path]:[vector-effect:non-scaling-stroke]" strokeWidth={2} focusable="false" /></div>
      <div className="relative z-10"><GoalList goals={visible} lastContributions={lastContributions} onAddContribution={onAddContribution} onUpdateProgress={onUpdateProgress} onAddCustom={onAddCustom} onRemoveGoal={onRemoveGoal} actionsDisabled={areActionsDisabled} noResults={goals.length > 0 && Boolean(search.trim() || hasFilters)} /></div>
      <div className="min-h-0 flex-1" />
    </div>
      {filtered.length > 0 && <div className="flex flex-wrap items-center justify-between gap-3 rounded-b-2xl border border-border/70 bg-card px-4 py-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-3">
          <span>{(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)}</span>
          <div ref={pageSizeRef} className="relative border-l border-border pl-3" onKeyDown={handlePageSizeKeyDown}>
            <button ref={pageSizeButtonRef} type="button" aria-label="Metas por página" aria-haspopup="listbox" aria-expanded={pageSizeOpen} aria-controls="goal-page-size-options" onClick={() => setPageSizeOpen(open => !open)} className="inline-flex items-center gap-2 rounded-lg px-1 py-1 text-muted-foreground outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-primary">
              {pageSize} por página <ChevronDown size={16} className={`transition-transform ${pageSizeOpen ? "rotate-180" : ""}`} />
            </button>
            {pageSizeOpen && <div id="goal-page-size-options" role="listbox" aria-label="Metas por página" className="absolute bottom-full left-3 z-50 mb-2 w-52 rounded-xl border border-border/70 bg-card p-1.5 text-foreground shadow-xl">
              {sizes.map(size => <button key={size} type="button" role="option" aria-selected={size === pageSize} onClick={() => choosePageSize(size)} className={`block w-full rounded-lg px-3 py-2 text-left text-sm outline-none hover:bg-primary/10 focus-visible:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary ${size === pageSize ? "bg-primary/10 font-medium text-primary" : ""}`}>{size} por página</button>)}
            </div>}
          </div>
        </div>
        <div className="relative ml-auto flex items-center gap-2"><button type="button" aria-label="Página anterior" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className="rounded-lg p-2 hover:bg-muted disabled:opacity-40"><ChevronLeft size={18} /></button><span>{currentPage}</span><button type="button" aria-label="Próxima página" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)} className="rounded-lg p-2 hover:bg-muted disabled:opacity-40"><ChevronRight size={18} /></button></div>
      </div>}
    </div>
    {createOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm" onMouseDown={e => { if (e.target === e.currentTarget) setCreateOpen(false); }}><div ref={createDialogRef} role="dialog" aria-modal="true" aria-label="Nova meta" onKeyDown={trapDialogFocus} className="max-h-[calc(100dvh-1.5rem)] w-full max-w-xl overflow-y-auto"><GoalForm isSubmitting={isSubmitting} errorMessage={createErrorMessage} onAddGoal={async input => { await onAddGoal(input); setCreateOpen(false); }} onCancel={() => setCreateOpen(false)} /></div></div>}
  </div>;
}
