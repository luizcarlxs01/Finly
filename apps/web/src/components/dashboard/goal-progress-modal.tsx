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
  const [currentAmount, setCurrentAmount] = useState(
    goal ? String(goal.currentAmount) : "",
  );

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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:px-4 sm:py-6">
      <div className="w-full max-h-[min(100dvh-0.5rem,96vh)] overflow-hidden rounded-t-[1.75rem] border border-border/70 bg-card shadow-2xl sm:max-h-[92vh] sm:max-w-lg sm:rounded-[1.75rem]">
        <div className="flex items-start justify-between border-b border-border/60 px-4 py-4 sm:px-6 sm:py-5">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Atualizar progresso
            </h3>
            <p className="text-sm leading-6 text-muted-foreground">
              Ajuste o valor que você já guardou nessa meta.
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

        <form
          onSubmit={handleSubmit}
          className="space-y-5 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6"
        >
          <div className="rounded-[1.25rem] border border-border/60 bg-background/60 p-4">
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
              Salvar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
