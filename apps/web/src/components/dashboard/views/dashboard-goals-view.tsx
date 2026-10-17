"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import styles from "./dashboard-goals-view.module.css";
import { ChevronDown, ChevronLeft, ChevronRight, Filter, Ghost, Plus, Search, X } from "lucide-react";
import { GoalCreateDialog } from "@/components/dashboard/goal-create-dialog";
import { GoalList } from "@/components/dashboard/goal-list";
import type { Goal } from "@/types/goal";
import { getTransactionCategoryLabel, TRANSACTION_CATEGORIES } from "@/types/transaction-category";

type GoalInput = { title: string; targetAmount: number; currentAmount: number; category: string; deadline?: string };
type Filters = { category: string; deadline: "" | "nearest" | "range"; from: string; to: string; progress: "" | "closest" | "furthest"; value: "" | "current" | "target" };
const emptyFilters: Filters = { category: "", deadline: "", from: "", to: "", progress: "", value: "" };
const sizes = [5, 10, 15, "all"] as const;
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
  const [pageSize, setPageSize] = useState<number | "all">(5);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  const [page, setPage] = useState(1);
  const cubeViewportRef = useRef<HTMLDivElement>(null);
  const cubeOutgoingRef = useRef<HTMLDivElement | null>(null);
  const cubeTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const cubePendingRef = useRef<{ target: typeof tab; height: number; direction: number } | null>(null);
  const [cubeBusy, setCubeBusy] = useState(false);
  const pageContentRef = useRef<HTMLDivElement>(null);
  const pageAreaRef = useRef<HTMLDivElement>(null);
  const pageTweenRef = useRef<gsap.core.Tween | null>(null);
  const pageTransitionRef = useRef<{ target: number; direction: number } | null>(null);
  const [paging, setPaging] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const createButtonRef = useRef<HTMLButtonElement>(null);
  const pageSizeRef = useRef<HTMLDivElement>(null);
  const pageSizeButtonRef = useRef<HTMLButtonElement>(null);
  const hasFilters = Boolean(applied.category || applied.deadline || applied.progress || applied.value);

  useLayoutEffect(() => {
    if (!filterOpen) return;
    const updatePosition = () => {
      const panel = filterPanelRef.current;
      if (!panel) return;
      panel.style.setProperty("--filter-offset", "0px");
      const bounds = panel.getBoundingClientRect();
      panel.style.setProperty("--filter-offset", `${-Math.min(Math.max(0, bounds.bottom - window.innerHeight + 16), Math.max(0, bounds.top - 16))}px`);
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => { window.removeEventListener("resize", updatePosition); window.removeEventListener("scroll", updatePosition, true); };
  }, [filterOpen, draft.deadline, filterError]);

  useLayoutEffect(() => {
    const panel = filterPanelRef.current;
    if (!filterOpen || !panel || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const animation = gsap.fromTo(panel, { opacity: 0, y: -6, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.18, ease: "power2.out", clearProps: "opacity,transform" });
    return () => { animation.kill(); };
  }, [filterOpen]);

  useEffect(() => { if (!filterOpen) return; const onPointer = (event: PointerEvent) => { if (filterRef.current && !filterRef.current.contains(event.target as Node)) setFilterOpen(false); }; const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setFilterOpen(false); }; document.addEventListener("pointerdown", onPointer); document.addEventListener("keydown", onKey); return () => { document.removeEventListener("pointerdown", onPointer); document.removeEventListener("keydown", onKey); }; }, [filterOpen]);
  useEffect(() => { if (!pageSizeOpen) return; pageSizeRef.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus(); const onPointer = (event: PointerEvent) => { if (pageSizeRef.current && !pageSizeRef.current.contains(event.target as Node)) setPageSizeOpen(false); }; const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { setPageSizeOpen(false); pageSizeButtonRef.current?.focus(); } }; document.addEventListener("pointerdown", onPointer); document.addEventListener("keydown", onKey); return () => { document.removeEventListener("pointerdown", onPointer); document.removeEventListener("keydown", onKey); }; }, [pageSizeOpen]);

  const matching = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    return goals.filter(g => (!query || `${g.title} ${g.category === "general" ? "Geral" : getTransactionCategoryLabel(g.category)}`.toLocaleLowerCase("pt-BR").includes(query)) && (!applied.category || (applied.category === "general" ? g.category === "general" || g.category === "geral" : g.category === applied.category)) && (applied.deadline !== "range" || (g.deadline && g.deadline >= applied.from && g.deadline <= applied.to)));
  }, [goals, search, applied]);
  const counts = useMemo(() => { const active = matching.filter(g => progressOf(g) < 1); const date = today(); const limit = new Date(`${date}T12:00:00Z`); limit.setUTCDate(limit.getUTCDate() + 30); const until = limit.toISOString().slice(0, 10); return { active: active.length, completed: matching.length - active.length, approaching: active.filter(g => g.deadline && g.deadline >= date && g.deadline <= until).length }; }, [matching]);
  const filtered = useMemo(() => {
    const rows = matching.filter(g => tab === "all" || (tab === "completed" ? progressOf(g) >= 1 : progressOf(g) < 1));
    return rows.sort((a, b) => {
      if (applied.deadline === "nearest") { const diff = (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999"); if (diff) return diff; }
      if (applied.progress) { const diff = (progressOf(b) - progressOf(a)) * (applied.progress === "closest" ? 1 : -1); if (diff) return diff; }
      if (applied.value) { const diff = applied.value === "current" ? b.currentAmount - a.currentAmount : b.targetAmount - a.targetAmount; if (diff) return diff; }
      return b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id);
    });
  }, [matching, tab, applied]);
  const pages = pageSize === "all" ? 1 : Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages);
  const visible = pageSize === "all" ? filtered : filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const cancelPagination = () => {
    pageTweenRef.current?.kill();
    pageTransitionRef.current = null;
    if (pageContentRef.current) gsap.set(pageContentRef.current, { clearProps: "transform,opacity" });
    if (pageAreaRef.current) gsap.set(pageAreaRef.current, { clearProps: "height,overflow" });
    setPaging(false);
  };
  useEffect(() => cancelPagination, [goals, tab, search, applied, pageSize]);

  useLayoutEffect(() => {
    const transition = pageTransitionRef.current;
    if (!transition || transition.target !== currentPage || !pageContentRef.current) return;
    pageTweenRef.current = gsap.fromTo(pageContentRef.current,
      { x: transition.direction * 32, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.15, ease: "power2.out", onComplete: cancelPagination });
  }, [currentPage]);

  const navigatePage = (target: number) => {
    if (cubePendingRef.current || pageTransitionRef.current || target === currentPage || target < 1 || target > pages) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setPage(target); return; }
    const content = pageContentRef.current;
    const area = pageAreaRef.current;
    if (!content || !area) return;
    const direction = target > currentPage ? 1 : -1;
    pageTransitionRef.current = { target, direction };
    setPaging(true);
    gsap.set(area, { height: area.getBoundingClientRect().height, overflow: "hidden" });
    pageTweenRef.current = gsap.to(content, {
      x: -direction * 32, opacity: 0, duration: 0.15, ease: "power2.in", onComplete: () => setPage(target),
    });
  };
  const cancelCube = () => {
    cubeTimelineRef.current?.kill();
    cubeOutgoingRef.current?.remove();
    cubeOutgoingRef.current = null;
    cubePendingRef.current = null;
    if (pageAreaRef.current) {
      pageAreaRef.current.inert = false;
      gsap.set(pageAreaRef.current, { clearProps: "transform,opacity,transformOrigin,backfaceVisibility" });
    }
    if (cubeViewportRef.current) gsap.set(cubeViewportRef.current, { clearProps: "height,overflow,perspective" });
    setCubeBusy(false);
  };
  useEffect(() => cancelCube, [goals, search, applied, pageSize]);

  useLayoutEffect(() => {
    const pending = cubePendingRef.current;
    const face = pageAreaRef.current;
    const outgoing = cubeOutgoingRef.current;
    const viewport = cubeViewportRef.current;
    if (!pending || pending.target !== tab || !face || !outgoing || !viewport) return;
    const width = viewport.getBoundingClientRect().width;
    gsap.set(viewport, { height: Math.max(pending.height, face.getBoundingClientRect().height), overflow: "hidden", perspective: 1200 });
    face.inert = true;
    cubeTimelineRef.current = gsap.timeline({ onComplete: cancelCube })
      .set([face, outgoing], { backfaceVisibility: "hidden" })
      .fromTo(outgoing, { x: 0, rotationY: 0, opacity: 1, transformOrigin: pending.direction > 0 ? "right center" : "left center" }, { x: -pending.direction * width, rotationY: -pending.direction * 90, opacity: 0.65, duration: 0.55, ease: "sine.inOut" }, 0)
      .fromTo(face, { x: pending.direction * width, rotationY: pending.direction * 90, opacity: 0.65, transformOrigin: pending.direction > 0 ? "left center" : "right center" }, { x: 0, rotationY: 0, opacity: 1, duration: 0.55, ease: "sine.inOut" }, 0);
  }, [tab]);

  const selectTab = (target: typeof tab) => {
    if (target === tab) return;
    cancelPagination();
    cancelCube();
    const face = pageAreaRef.current;
    const viewport = cubeViewportRef.current;
    if (face && viewport && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // A visual-only snapshot avoids mounting a second section or repeating its effects.
      const outgoing = face.cloneNode(true) as HTMLDivElement;
      outgoing.inert = true;
      outgoing.setAttribute("aria-hidden", "true");
      outgoing.removeAttribute("id");
      outgoing.querySelectorAll("[id]").forEach(element => element.removeAttribute("id"));
      Object.assign(outgoing.style, { position: "absolute", inset: "0", pointerEvents: "none", background: "var(--card)" });
      viewport.appendChild(outgoing);
      cubeOutgoingRef.current = outgoing;
      const tabOrder = ["active", "completed", "all"];
      cubePendingRef.current = { target, height: face.getBoundingClientRect().height, direction: tabOrder.indexOf(target) > tabOrder.indexOf(tab) ? 1 : -1 };
      setCubeBusy(true);
    }
    setPage(1);
    setTab(target);
  };
  const resetPage = () => { cancelPagination(); setPage(1); };
  const choosePageSize = (size: number | "all") => { setPageSize(size); resetPage(); setPageSizeOpen(false); pageSizeButtonRef.current?.focus(); };
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
  const selectFilterOption = <K extends "deadline" | "progress" | "value">(group: K, option: Filters[K]) => {
    setDraft(current => ({ ...current, deadline: "", progress: "", value: "", from: "", to: "", [group]: current[group] === option ? "" : option }));
    setFilterError("");
  };
  const clearFilters = () => { setApplied(emptyFilters); setDraft(emptyFilters); setFilterError(""); resetPage(); };
  const applyFilters = () => { if (draft.deadline === "range" && (!draft.from || !draft.to || draft.from > draft.to)) { setFilterError("Informe um período válido: De deve ser anterior ou igual a Até."); return; } setApplied(draft); setFilterError(""); setFilterOpen(false); resetPage(); };

  return <div className={styles.goals}>
    <section data-shared-indicators aria-label="Resumo das metas" data-eclipse-anchor="goals" className={`${styles.summary} mx-auto grid w-full max-w-5xl grid-cols-3 items-center gap-3`}>
      {[[counts.active, "Em andamento"], [counts.completed, "Metas batidas"], [counts.approaching, "Próximas do prazo"]].map(([value, label], index) => <div key={label} className={`min-w-0 text-center ${index < 2 ? "border-r border-border/70" : ""}`}><p className="text-3xl font-semibold text-foreground sm:text-4xl">{value}</p><p className="text-xs text-muted-foreground sm:text-sm">{label}</p></div>)}
    </section>
    <section aria-label="Painel de metas" className={styles.panel}>
        <div className={`${styles.controls} grid gap-3 sm:grid-cols-[360px_auto] sm:items-center sm:justify-center min-[1140px]:w-full min-[1140px]:!grid-cols-[1fr_360px_1fr] min-[1140px]:!justify-normal min-[1140px]:gap-3`}>
      <div role="group" aria-label="Estado das metas" className="flex w-full rounded-xl bg-muted p-1 sm:col-span-2 sm:w-auto sm:justify-self-center min-[1140px]:!col-span-1 min-[1140px]:!justify-self-start">{[["active", "Em andamento"], ["completed", "Concluídas"], ["all", "Todas"]].map(([key, label]) => <button key={key} type="button" aria-pressed={tab === key} onClick={() => selectTab(key as typeof tab)} className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm sm:flex-none sm:px-5 ${tab === key ? "bg-card font-medium text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{label}</button>)}</div>
      <div className="flex min-w-0 w-full gap-2 min-[1140px]:w-[360px] min-[1140px]:justify-self-center"><label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-xl bg-muted px-3"><Search size={18} className="shrink-0 text-muted-foreground" /><input type="search" aria-label="Buscar metas" placeholder="Buscar em todas as metas" value={search} onChange={e => { setSearch(e.target.value); resetPage(); }} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" /></label>
        <div ref={filterRef} className="relative"><button type="button" aria-label="Filtros" aria-expanded={filterOpen} onClick={() => { setDraft(applied); setFilterError(""); setFilterOpen(!filterOpen); }} className="relative flex size-11 items-center justify-center rounded-xl bg-muted text-foreground transition-colors duration-200 hover:bg-primary/20 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"><Filter size={19} />{hasFilters && <span className="absolute right-0 top-0 size-2.5 rounded-full bg-primary" />}</button>
          {filterOpen && <div ref={filterPanelRef} className="fixed inset-x-4 top-4 z-50 flex max-h-[calc(100dvh-2rem)] flex-col gap-4 rounded-2xl border border-border bg-card p-4 text-sm shadow-xl lg:absolute lg:inset-x-auto lg:right-0 lg:top-12 lg:w-[min(90vw,390px)] lg:translate-y-[var(--filter-offset)]">
            <div className="relative flex h-8 shrink-0 items-center justify-center"><h2 className="text-lg font-semibold">Filtros</h2><button type="button" aria-label="Fechar filtros" onClick={() => setFilterOpen(false)} className="absolute right-0 flex size-8 items-center justify-center rounded-lg transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><X size={18} /></button></div>
            <label className="block shrink-0 space-y-2 font-medium"><span className="block">Categoria</span><select value={draft.category} onChange={e => patchDraft({ category: e.target.value })} className="h-10 w-full rounded-lg border border-border bg-background px-3 font-normal"><option value="">Todas as categorias</option><option value="general">Geral</option>{TRANSACTION_CATEGORIES.filter(c => c !== "geral").map(c => <option key={c} value={c}>{getTransactionCategoryLabel(c)}</option>)}</select></label>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
            <fieldset className="border-t border-border pt-3"><legend className="pr-2 font-medium">Prazo</legend><div className="grid grid-cols-2 gap-2"><button type="button" aria-pressed={draft.deadline === "nearest"} onClick={() => selectFilterOption("deadline", "nearest")} className={`rounded-lg border p-2 transition-colors hover:border-primary/60 hover:bg-primary/15 ${draft.deadline === "nearest" ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>Mais próximo</button><button type="button" aria-pressed={draft.deadline === "range"} onClick={() => selectFilterOption("deadline", "range")} className={`rounded-lg border p-2 transition-colors hover:border-primary/60 hover:bg-primary/15 ${draft.deadline === "range" ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>Período específico</button></div>{draft.deadline === "range" && <div data-filter-dates className="mt-2 grid grid-cols-2 gap-2"><label>De<input type="date" value={draft.from} onChange={e => patchDraft({ from: e.target.value })} className="h-10 w-full rounded-lg border border-border bg-background px-1" /></label><label>Até<input type="date" value={draft.to} onChange={e => patchDraft({ to: e.target.value })} className="h-10 w-full rounded-lg border border-border bg-background px-1" /></label></div>}</fieldset>
            <fieldset className="border-t border-border pt-3"><legend className="pr-2 font-medium">Progresso</legend><div className="grid grid-cols-2 gap-2">{[["closest", "Mais próxima de atingir"], ["furthest", "Mais distante de atingir"]].map(([key, label]) => <button key={key} type="button" aria-pressed={draft.progress === key} onClick={() => selectFilterOption("progress", key as Filters["progress"])} className={`rounded-lg border p-2 transition-colors hover:border-primary/60 hover:bg-primary/15 ${draft.progress === key ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>{label}</button>)}</div></fieldset>
            <fieldset className="border-t border-border pt-3"><legend className="pr-2 font-medium">Valor</legend><div className="grid grid-cols-2 gap-2">{[["current", "Maior valor adicionado"], ["target", "Maior valor alvo"]].map(([key, label]) => <button key={key} type="button" aria-pressed={draft.value === key} onClick={() => selectFilterOption("value", key as Filters["value"])} className={`rounded-lg border p-2 transition-colors hover:border-primary/60 hover:bg-primary/15 ${draft.value === key ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>{label}</button>)}</div></fieldset>
            </div>
            {filterError && <p role="alert" className="shrink-0 text-destructive">{filterError}</p>}
            <div className="flex shrink-0 items-center justify-between"><button type="button" onClick={clearFilters} className="text-primary transition-colors hover:text-primary/75 hover:underline">Limpar</button><button type="button" onClick={applyFilters} className="rounded-lg bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90">Aplicar filtros</button></div>
          </div>}
        </div></div>
      <button ref={createButtonRef} type="button" onClick={() => setCreateOpen(true)} className="flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-primary px-5 font-medium text-primary-foreground hover:bg-primary/90 min-[1140px]:!justify-self-end"><Plus size={18} /> Nova meta</button>
    </div>
    <div className={`isolate [--goal-footer-height:60px] ${filtered.length === 0 ? "pb-[var(--goal-footer-height)]" : ""}`}><div ref={cubeViewportRef} className="relative rounded-t-[inherit]"><div ref={pageAreaRef} className="relative flex min-h-[1005px] bg-card flex-col rounded-t-[inherit] sm:min-h-[1045px] lg:min-h-[445px]">
      {filtered.length === 0 && <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-0 flex h-[1005px] items-center justify-center sm:h-[1045px] lg:h-[445px]"><Ghost className="size-64 text-slate-300/80 dark:text-slate-500/60 sm:size-72 lg:size-32 [&_path]:[vector-effect:non-scaling-stroke]" strokeWidth={2} focusable="false" /></div>}
      <div ref={pageContentRef} className="relative z-10 rounded-t-[inherit]" aria-busy={paging || cubeBusy}><GoalList goals={visible} lastContributions={lastContributions} onAddContribution={onAddContribution} onUpdateProgress={onUpdateProgress} onAddCustom={onAddCustom} onRemoveGoal={onRemoveGoal} actionsDisabled={areActionsDisabled || paging || cubeBusy} noResults={goals.length > 0 && Boolean(search.trim() || hasFilters)} /></div>
      <div className="min-h-0 flex-1" />
    </div></div>
      {filtered.length > 0 && <div className="flex min-h-[var(--goal-footer-height)] items-center justify-between gap-2 border-t border-border/70 px-4 py-3 text-sm text-muted-foreground sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <span>{pageSize === "all" ? 1 : (currentPage - 1) * pageSize + 1}–{pageSize === "all" ? filtered.length : Math.min(currentPage * pageSize, filtered.length)}</span>
          <div ref={pageSizeRef} className="relative border-l border-border pl-2 sm:pl-3" onKeyDown={handlePageSizeKeyDown}>
            <button ref={pageSizeButtonRef} type="button" aria-label="Metas por página" aria-haspopup="listbox" aria-expanded={pageSizeOpen} aria-controls="goal-page-size-options" onClick={() => setPageSizeOpen(open => !open)} className="inline-flex w-30 items-center justify-between gap-2 whitespace-nowrap rounded-lg px-1 py-1 text-muted-foreground outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-primary">
              {pageSize === "all" ? "Todas" : `${pageSize} por página`} <ChevronDown size={16} className={`transition-transform ${pageSizeOpen ? "rotate-180" : ""}`} />
            </button>
            {pageSizeOpen && <div id="goal-page-size-options" role="listbox" aria-label="Metas por página" className="absolute bottom-full left-3 z-50 mb-2 w-52 rounded-xl border border-border/70 bg-card p-1.5 text-foreground shadow-xl">
              {sizes.map(size => <button key={size} type="button" role="option" aria-selected={size === pageSize} onClick={() => choosePageSize(size)} className={`block w-full rounded-lg px-3 py-2 text-left text-sm outline-none hover:bg-primary/10 focus-visible:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary ${size === pageSize ? "bg-primary/10 font-medium text-primary" : ""}`}>{size === "all" ? "Todas" : `${size} por página`}</button>)}
            </div>}
          </div>
        </div>
        <div className="relative z-0 ml-auto flex min-h-[34px] min-w-[84px] shrink-0 items-center justify-end gap-1 sm:min-w-[92px] sm:gap-2">{pageSize !== "all" && <><button type="button" aria-label="Página anterior" disabled={paging || cubeBusy || currentPage === 1} onClick={() => navigatePage(currentPage - 1)} className="rounded-lg p-2 hover:bg-muted disabled:opacity-40"><ChevronLeft size={18} /></button><span>{currentPage}</span><button type="button" aria-label="Próxima página" disabled={paging || cubeBusy || currentPage === pages} onClick={() => navigatePage(currentPage + 1)} className="rounded-lg p-2 hover:bg-muted disabled:opacity-40"><ChevronRight size={18} /></button></>}</div>
      </div>}
    </div>
    </section>
    {createOpen && <GoalCreateDialog triggerRef={createButtonRef} isSubmitting={isSubmitting} errorMessage={createErrorMessage} onAddGoal={onAddGoal} onClose={() => setCreateOpen(false)} />}
  </div>;
}
