"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { GoalGlassDialog } from "./goal-glass-dialog";
import type { Goal } from "@/types/goal";

type Props = {
  goal: Goal;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  isSubmitting: boolean;
  errorMessage?: string | null;
  onConfirm: () => Promise<void>;
  onClose: () => void;
};

export function GoalDeleteDialog({ goal, triggerRef, isSubmitting, errorMessage, onConfirm, onClose }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const pendingRef = useRef(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const busy = pending || isSubmitting;

  useEffect(() => { cancelRef.current?.focus(); }, []);

  async function confirm(close: () => void) {
    if (pendingRef.current || isSubmitting) return;
    if (!confirming) { setConfirming(true); return; }
    pendingRef.current = true;
    setPending(true);
    setAttempted(true);
    cancelRef.current?.focus();
    try {
      await onConfirm();
      close();
    } catch {
      // The existing deletion hook supplies the error message.
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }

  return <GoalGlassDialog triggerRef={triggerRef} title="Remover meta" animation="gentle" onClose={onClose}>
    {close => <div className="space-y-6 px-6 pt-6 pb-8 text-foreground sm:px-10">
      <header className="text-center">
        <h2 className="inline-block border-b border-border px-4 pb-2 text-xl font-semibold tracking-tight">Remover meta</h2>
      </header>
      <p className="break-words text-center text-lg font-semibold">{goal.title}</p>
      {attempted && errorMessage && <p role="alert" className="text-sm text-destructive">{errorMessage}</p>}
      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
        <Button ref={cancelRef} type="button" variant="outline" className="h-11 rounded-xl sm:min-w-32" onClick={close}>Cancelar</Button>
        <Button type="button" variant="destructive" className="h-11 rounded-xl sm:min-w-40" disabled={busy} onClick={() => confirm(close)}>
          {busy ? "Removendo..." : confirming ? "Confirmar exclusão" : "Remover meta"}
        </Button>
      </div>
    </div>}
  </GoalGlassDialog>;
}
