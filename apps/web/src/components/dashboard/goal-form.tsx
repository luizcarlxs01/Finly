"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getTransactionCategoryLabel,
  TRANSACTION_CATEGORIES,
} from "@/types/transaction-category";

type GoalFormProps = {
  onAddGoal: (input: {
    title: string;
    targetAmount: number;
    currentAmount: number;
    category: string;
    deadline?: string;
  }) => void;
};

const fieldClassName =
  "w-full rounded-xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";

export function GoalForm({ onAddGoal }: GoalFormProps) {
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [category, setCategory] = useState("general");
  const [deadline, setDeadline] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedTargetAmount = Number(targetAmount);
    const parsedCurrentAmount = currentAmount ? Number(currentAmount) : 0;
    const normalizedTitle = title.trim();

    if (
      !normalizedTitle ||
      Number.isNaN(parsedTargetAmount) ||
      parsedTargetAmount <= 0 ||
      Number.isNaN(parsedCurrentAmount) ||
      parsedCurrentAmount < 0
    ) {
      return;
    }

    onAddGoal({
      title: normalizedTitle,
      targetAmount: parsedTargetAmount,
      currentAmount: parsedCurrentAmount,
      category,
      deadline: deadline || undefined,
    });

    setTitle("");
    setTargetAmount("");
    setCurrentAmount("");
    setCategory("general");
    setDeadline("");
  }

  return (
    <Card className="rounded-[1.75rem] border-border/70 bg-card/95 shadow-sm">
      <CardHeader className="space-y-2 pb-4">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Nova meta
        </p>
        <CardTitle className="text-2xl font-semibold tracking-tight">
          Criar meta financeira
        </CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">
          Defina um objetivo local para acompanhar aportes manuais e evolução do
          planejamento financeiro.
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="goal-title"
              className="text-sm font-medium text-foreground"
            >
              Título da meta
            </label>

            <input
              id="goal-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={fieldClassName}
              placeholder="Ex.: Reserva de emergência"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="goal-target-amount"
                className="text-sm font-medium text-foreground"
              >
                Valor alvo
              </label>

              <input
                id="goal-target-amount"
                type="number"
                step="0.01"
                value={targetAmount}
                onChange={(event) => setTargetAmount(event.target.value)}
                className={fieldClassName}
                placeholder="Ex.: 10000"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="goal-current-amount"
                className="text-sm font-medium text-foreground"
              >
                Valor atual
              </label>

              <input
                id="goal-current-amount"
                type="number"
                step="0.01"
                value={currentAmount}
                onChange={(event) => setCurrentAmount(event.target.value)}
                className={fieldClassName}
                placeholder="Ex.: 1500"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
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
                {TRANSACTION_CATEGORIES.map((currentCategory) => (
                  <option key={currentCategory} value={currentCategory}>
                    {getTransactionCategoryLabel(currentCategory)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="goal-deadline"
                className="text-sm font-medium text-foreground"
              >
                Prazo
              </label>

              <input
                id="goal-deadline"
                type="date"
                value={deadline}
                onChange={(event) => setDeadline(event.target.value)}
                className={fieldClassName}
              />
            </div>
          </div>

          <Button type="submit" className="h-11 w-full rounded-xl">
            Adicionar meta
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
