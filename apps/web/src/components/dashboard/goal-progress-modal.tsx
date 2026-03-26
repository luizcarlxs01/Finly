"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Goal } from "@/types/goal";

type GoalProgressModalProps = {
  goal: Goal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (input: { id: string; currentAmount: number }) => void;
};

const fieldClassName =
  "w-full rounded-xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";

export function GoalProgressModal({
  goal,
  open,
  onOpenChange,
  onSave,
}: GoalProgressModalProps) {
  const [currentAmount, setCurrentAmount] = useState("");

  useEffect(() => {
    if (!goal) {
      return;
    }

    setCurrentAmount(String(goal.currentAmount));
  }, [goal]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open || !goal) {
    return null;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!goal) {
      return;
    }

    const parsedCurrentAmount = Number(currentAmount);

    if (Number.isNaN(parsedCurrentAmount) || parsedCurrentAmount < 0) {
      return;
    }

    onSave({
      id: goal.id,
      currentAmount: parsedCurrentAmount,
    });

    onOpenChange(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6">
      <div className="w-full max-w-lg rounded-[1.75rem] border border-border/70 bg-card shadow-2xl">
        <div className="flex items-start justify-between border-b border-border/60 px-6 py-5">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Progresso da meta
            </p>
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">
              Atualizar progresso
            </h3>
            <p className="text-sm leading-6 text-muted-foreground">
              Ajuste manualmente o valor acumulado da meta selecionada.
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            className="rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
          <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
            <p className="text-sm text-muted-foreground">Meta</p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {goal.title}
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="goal-current-progress"
              className="text-sm font-medium text-foreground"
            >
              Valor atual
            </label>

            <input
              id="goal-current-progress"
              type="number"
              step="0.01"
              value={currentAmount}
              onChange={(event) => setCurrentAmount(event.target.value)}
              className={fieldClassName}
              placeholder="Ex.: 2500"
            />
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>

            <Button type="submit" className="rounded-xl">
              Salvar progresso
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
