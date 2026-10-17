"use client";
import { useEffect, useRef, useState } from "react";
import { WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoalGlassDialog } from "./goal-glass-dialog";
import type { Goal } from "@/types/goal";

type Props = {
  goal: Goal;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  onSave: (input: { id: string; currentAmount: number }) => Promise<void>;
  onClose: () => void;
};
export function GoalEditDialog({ goal, triggerRef, onSave, onClose }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingRef = useRef(false);
  const [amount, setAmount] = useState(String(goal.currentAmount));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { inputRef.current?.focus(); }, [goal.id]);
  async function save(event: React.FormEvent<HTMLFormElement>, close: () => void) {
    event.preventDefault();
    if (pendingRef.current) return;
    const normalized = amount.trim().replace(/^R\$\s*/i, "").replace(/\s/g, "");
    const decimal = normalized.includes(",") ? normalized.replace(/\./g, "").replace(",", ".") : normalized;
    const value = /^\+?\d+(?:\.\d*)?$/.test(decimal) ? Number(decimal) : NaN;
    if (!Number.isFinite(value) || value < 0) { setError("Informe um valor atual válido, maior ou igual a zero."); return; }
    pendingRef.current = true;
    setPending(true);
    setError(null);
    try { await onSave({ id: goal.id, currentAmount: value }); close(); }
    catch (error) { setError(error instanceof Error ? error.message : "Não foi possível atualizar a meta."); }
    finally { pendingRef.current = false; setPending(false); }
  }
  return <GoalGlassDialog triggerRef={triggerRef} title="Editar meta" animation="gentle" onClose={onClose}>
    {close => <form onSubmit={event => save(event, close)} className="space-y-6 px-6 pt-6 pb-8 text-foreground sm:px-10">
      <header className="text-center"><h2 className="inline-block border-b border-border px-4 pb-2 text-xl font-semibold tracking-tight">Editar meta</h2></header>
      <p className="break-words text-center text-lg font-semibold">{goal.title}</p>
      <div className="space-y-2"><label htmlFor="goal-edit-current-amount" className="text-sm font-medium">Valor atual</label><div className="relative"><WalletCards className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input ref={inputRef} id="goal-edit-current-amount" type="text" inputMode="decimal" value={amount} onChange={event => setAmount(event.target.value)} disabled={pending} aria-invalid={Boolean(error)} aria-describedby={error ? "goal-edit-error" : undefined} className="w-full rounded-2xl border border-border/70 bg-background py-3 pr-4 pl-11 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" /></div></div>
      {error && <p id="goal-edit-error" role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between"><Button type="button" variant="outline" className="h-11 rounded-xl sm:min-w-32" onClick={close}>Cancelar</Button><Button type="submit" disabled={pending} className="h-11 rounded-xl sm:min-w-32">{pending ? "Salvando..." : "Salvar alterações"}</Button></div>
    </form>}
  </GoalGlassDialog>;
}
