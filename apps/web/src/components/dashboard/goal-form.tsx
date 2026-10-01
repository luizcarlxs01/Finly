"use client";

import { useState } from "react";
import { CalendarDays, Goal, WalletCards, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getTransactionCategoryLabel,
  TRANSACTION_CATEGORIES,
} from "@/types/transaction-category";

type GoalFormProps = {
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onCancel?: () => void;
  onAddGoal: (input: {
    title: string;
    targetAmount: number;
    currentAmount: number;
    category: string;
    deadline?: string;
  }) => Promise<void> | void;
};

const fieldClassName =
  "w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/80 focus:border-primary focus:ring-2 focus:ring-primary/15";

const dateInputClassName = `${fieldClassName} cursor-pointer appearance-none pl-11 text-base sm:text-sm [&::-webkit-calendar-picker-indicator]:hidden`;

function getTodayDateValue() {
  return new Date().toISOString().split("T")[0];
}

export function GoalForm({
  isSubmitting = false,
  errorMessage,
  onAddGoal,
  onCancel,
}: GoalFormProps) {
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [category, setCategory] = useState("general");
  const [deadline, setDeadline] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedTargetAmount = Number(targetAmount.replace(",", "."));
    const parsedCurrentAmount = currentAmount ? Number(currentAmount.replace(",", ".")) : 0;
    const normalizedTitle = title.trim();

    if (
      !normalizedTitle ||
      Number.isNaN(parsedTargetAmount) ||
      parsedTargetAmount <= 0 ||
      Number.isNaN(parsedCurrentAmount) ||
      parsedCurrentAmount < 0 ||
      !deadline
    ) {
      return;
    }

    try {
      await onAddGoal({
        title: normalizedTitle,
        targetAmount: parsedTargetAmount,
        currentAmount: parsedCurrentAmount,
        category,
        deadline,
      });

      setTitle("");
      setTargetAmount("");
      setCurrentAmount("");
      setCategory("general");
      setDeadline("");
    } catch {
      // A mensagem de erro e tratada no fluxo principal da pagina.
    }
  }

  return (
    <Card className="rounded-[1.5rem] border-border/60 bg-card shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-xl font-semibold tracking-tight">
          Nova meta
        </CardTitle>
        {onCancel && <Button type="button" variant="ghost" aria-label="Fechar formulário" onClick={onCancel}><X className="size-5" /></Button>}
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <section className="space-y-4">
            <div className="space-y-1">
              <h3 className="sr-only">Sua meta</h3>
            </div>

            <div className="grid gap-1.5">
              <label
                htmlFor="goal-title"
                className="text-sm font-medium text-foreground"
              >
                Título
              </label>

              <div className="relative">
                <Goal className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="goal-title"
                  autoFocus={Boolean(onCancel)}
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className={`${fieldClassName} pl-11`}
                  placeholder="Ex.: Reserva de emergência"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="space-y-1">
              <h3 className="sr-only">Valores</h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <label
                  htmlFor="goal-target-amount"
                  className="text-sm font-medium text-foreground"
                >
                  Valor alvo
                </label>

                <div className="relative">
                  <WalletCards className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="goal-target-amount"
                    type="text"
                    inputMode="decimal"
                    value={targetAmount}
                    onChange={(event) => setTargetAmount(event.target.value)}
                    className={`${fieldClassName} pl-11`}
                    placeholder="Ex.: 10000"
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <label
                  htmlFor="goal-current-amount"
                  className="text-sm font-medium text-foreground"
                >
                  Valor atual
                </label>

                <div className="relative">
                  <WalletCards className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="goal-current-amount"
                    type="text"
                    inputMode="decimal"
                    value={currentAmount}
                    onChange={(event) => setCurrentAmount(event.target.value)}
                    className={`${fieldClassName} pl-11`}
                    placeholder="Ex.: 1500"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="space-y-1">
              <h3 className="sr-only">Categoria e prazo</h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <label
                  htmlFor="goal-category"
                  className="text-sm font-medium text-foreground"
                >
                  Categoria
                </label>

                <select
                  id="goal-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className={fieldClassName}
                >
                  <option value="general">Geral</option>
                  {TRANSACTION_CATEGORIES.filter((currentCategory) => currentCategory !== "geral").map((currentCategory) => (
                    <option key={currentCategory} value={currentCategory}>
                      {getTransactionCategoryLabel(currentCategory)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-1.5">
                <label
                  htmlFor="goal-deadline"
                  className="text-sm font-medium text-foreground"
                >
                  Prazo
                </label>

                <div className="relative min-w-0">
                  <CalendarDays className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="goal-deadline"
                    type="date"
                    required
                    min={getTodayDateValue()}
                    value={deadline}
                    onChange={(event) => setDeadline(event.target.value)}
                    className={dateInputClassName}
                  />
                </div>
              </div>
            </div>
          </section>

          {errorMessage && <p role="alert" className="text-sm text-destructive">{errorMessage}</p>}
          <section className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-between">
            {onCancel && <Button type="button" variant="outline" className="h-11 rounded-xl sm:min-w-32" onClick={onCancel}>Cancelar</Button>}
            <Button
              type="submit"
              className="h-11 rounded-xl sm:min-w-32"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Salvando..." : "Criar meta"}
            </Button>
          </section>
        </form>
      </CardContent>
    </Card>
  );
}
