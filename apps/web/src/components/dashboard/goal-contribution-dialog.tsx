"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import styles from "./goal-contribution-dialog.module.css";
import { Button } from "@/components/ui/button";
import { GoalGlassDialog } from "./goal-glass-dialog";
import type { GoalProgressModalProps } from "./goal-progress-modal";
import type { Goal } from "@/types/goal";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const markerMoney = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
const percent = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });


export function GoalContributionDialog({ goal, errorMessage, isSubmitting = false, onOpenChange, onSave }: GoalProgressModalProps & { goal: Goal }) {
  const triggerRef = useRef<HTMLButtonElement | null>(typeof document !== "undefined" && document.activeElement instanceof HTMLButtonElement ? document.activeElement : null);
  const pendingRef = useRef(false);
  const [amount, setAmount] = useState("");
  const [pending, setPending] = useState(false);
  const [validation, setValidation] = useState("");
  const normalized = amount.trim().replace(/^R\$\s*/i, "").replace(/\s/g, "");
  const decimal = normalized.includes(",") ? normalized.replace(/\./g, "").replace(",", ".") : normalized;
  const parsed = /^\+?\d+(?:\.\d*)?$/.test(decimal) ? Number(decimal) : NaN;
  const animatedValue = useRef({ value: goal.currentAmount });
  const afterLabelRef = useRef<HTMLDivElement>(null);
  const [displayedAfter, setDisplayedAfter] = useState(goal.currentAmount);
  const [flowing, setFlowing] = useState(false);
  const [previewValid, setPreviewValid] = useState(false);
  const [previewTarget, setPreviewTarget] = useState(goal.currentAmount);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewTween = useRef<gsap.core.Tween | null>(null);
  const labelTween = useRef<gsap.core.Tween | null>(null);
  const closingPreview = useRef(false);
  const cancelPreview = useCallback(() => {
    closingPreview.current = true;
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTween.current?.kill();
    labelTween.current?.kill();
  }, []);
  const valid = amount.trim() !== "" && Number.isFinite(parsed) && parsed > 0 && Number.isFinite(goal.currentAmount + parsed);
  const after = goal.currentAmount + (valid ? parsed : 0);
  const beforePercent = goal.targetAmount > 0 ? goal.currentAmount / goal.targetAmount * 100 : 0;
  const afterPercent = goal.targetAmount > 0 ? previewTarget / goal.targetAmount * 100 : 0;
  const beforePosition = Math.min(100, Math.max(0, beforePercent));
  const busy = pending || isSubmitting;
  const displayedPercent = goal.targetAmount > 0 ? displayedAfter / goal.targetAmount * 100 : 0;
  const displayedPosition = Math.min(100, Math.max(beforePosition, displayedPercent));

  useEffect(() => {
    if (closingPreview.current) return;
    previewTimer.current = setTimeout(() => {
      setPreviewValid(valid);
      setPreviewTarget(after);
      previewTween.current = gsap.to(animatedValue.current, {
        value: after,
        duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 0.4,
        ease: "power2.out",
        onStart: () => setFlowing(true),
        onUpdate: () => setDisplayedAfter(animatedValue.current.value),
        onComplete: () => setFlowing(false),
      });
    }, 100);
    return () => {
      if (previewTimer.current) clearTimeout(previewTimer.current);
      previewTween.current?.kill();
    };
  }, [after, valid]);

  useEffect(() => {
    if (!previewValid || !afterLabelRef.current || closingPreview.current) return;
    labelTween.current = gsap.fromTo(afterLabelRef.current, { opacity: 0, y: 6 }, {
      opacity: 1, y: 0, duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 0.2, ease: "power2.out",
    });
    return () => { labelTween.current?.kill(); };
  }, [previewValid]);

  async function submit(event: React.FormEvent<HTMLFormElement>, close: () => void) {
    event.preventDefault();
    if (pendingRef.current || isSubmitting) return;
    if (!valid) { setValidation("Informe um aporte positivo válido."); return; }
    pendingRef.current = true;
    setPending(true);
    try {
      // The existing save callback adds this contribution to the stored amount.
      await onSave({ id: goal.id, currentAmount: parsed });
      close();
    } catch {
      // The existing update flow supplies the error message.
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }

  return <GoalGlassDialog triggerRef={triggerRef} title="Adicionar à meta" onClosing={cancelPreview} onClose={() => onOpenChange(false)}>
    {close => <form onSubmit={event => submit(event, close)} className="space-y-8 px-6 pt-6 pb-10 text-foreground sm:px-10">
      <header className="text-center">
        <h2 className="inline-block border-b border-border px-4 pb-2 text-xl font-semibold tracking-tight">Adicionar à meta</h2>
      </header>
      <section aria-label="Prévia do progresso">
        <h3 className="break-words font-semibold">{goal.title}</h3>
        <div className="relative mt-3">
          <div className="grid gap-2 pb-6">
          {[{ name: "Antes", value: goal.currentAmount, percentage: beforePercent, position: beforePosition, color: "text-muted-foreground" }, { name: "Depois", value: displayedAfter, percentage: displayedPercent, position: displayedPosition, color: "text-primary" }].reverse().map(marker => <div key={marker.name} className={marker.name === "Depois" && !previewValid ? "invisible" : undefined} aria-hidden={marker.name === "Depois" && !previewValid ? true : undefined}>
            <div className={`relative w-36 -translate-x-1/2 text-center text-xs tabular-nums ${marker.color} `} style={{ left: `clamp(72px, ${marker.position}%, calc(100% - 72px))` }}>
              <div ref={marker.name === "Depois" ? afterLabelRef : undefined}><p className="min-h-4">{marker.name !== "Antes" || amount.trim() ? marker.name : ""}</p><p className="h-5 whitespace-nowrap font-semibold" style={{ fontSize: `min(0.875rem, ${144 / ((percent.format(marker.percentage) + "% (R$" + markerMoney.format(marker.value) + ")").length * 0.6)}px)` }}>{percent.format(marker.percentage)}% (R${markerMoney.format(marker.value)})</p></div>
            </div>
            <span aria-hidden="true" className={`absolute bottom-6 h-5 w-px bg-current ${marker.name === "Antes" ? "text-primary" : "text-[#69B4FE]"} `} style={{ left: `clamp(12px, ${marker.position}%, calc(100% - 12px))` }} />
          </div>)}
          </div>
          <div role="img" aria-label={`Antes: ${money.format(goal.currentAmount)}, ${percent.format(beforePercent)}%. Depois: ${money.format(previewTarget)}, ${percent.format(afterPercent)}%. Alvo: ${money.format(goal.targetAmount)}.`} title={`Antes: ${percent.format(beforePercent)}%${previewValid ? ` · Depois: ${percent.format(afterPercent)}%` : ""}`} className="relative h-6 overflow-hidden rounded-full bg-muted">
            <div className={`@container absolute inset-y-0 left-0 flex items-center justify-center overflow-hidden bg-primary text-white `} style={{ width: `${beforePosition}%` }}></div>
            <div className="absolute inset-y-0 bg-[#69B4FE]" style={{ left: `${beforePosition}%`, width: `${displayedPosition - beforePosition}%` }} />
            {flowing && displayedPosition > beforePosition && displayedPosition < 100 && <span aria-hidden="true" className={styles.wave} style={{ left: `calc(${displayedPosition}% - 4px)` }} />}
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">Meta de {money.format(goal.targetAmount)}</p>
      </section>
      <div className="space-y-2">
        <label htmlFor="goal-contribution-amount" className="block pl-3 text-sm font-medium">Valor do aporte</label>
        <div className="relative"><span aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">+</span><input id="goal-contribution-amount" autoFocus inputMode="decimal" type="text" value={amount} onChange={event => { setAmount(event.target.value); setValidation(""); }} aria-invalid={Boolean(validation)} aria-describedby={validation || errorMessage ? "goal-contribution-error" : undefined} className="w-full rounded-2xl border border-border/70 bg-background px-4 py-3 pl-12 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" placeholder="Ex: 500" disabled={busy} /></div>
      </div>
      {(validation || errorMessage) && <p id="goal-contribution-error" role="alert" className="text-sm text-destructive">{validation || errorMessage}</p>}
      <footer className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button type="button" variant="outline" className="h-11 rounded-xl sm:min-w-32" disabled={busy} onClick={close}>Cancelar</Button>
        <Button type="submit" className="h-11 rounded-xl sm:min-w-32" disabled={busy}>{busy ? "Salvando..." : "Adicionar valor"}</Button>
      </footer>
    </form>}
  </GoalGlassDialog>;
}
