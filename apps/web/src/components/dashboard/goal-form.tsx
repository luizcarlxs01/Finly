"use client";

import { useState } from "react";
import { CalendarDays, Goal, WalletCards } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getTransactionCategoryLabel,
  TRANSACTION_CATEGORIES,
} from "@/types/transaction-category";

type GoalFormProps = {
  isSubmitting?: boolean;
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

function getTodayDateValue() {
  return new Date().toISOString().split("T")[0];
}

export function GoalForm({
  isSubmitting = false,
  onAddGoal,
}: GoalFormProps) {
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [category, setCategory] = useState("general");
  const [deadline, setDeadline] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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

    try {
      await onAddGoal({
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
    } catch {
      // A mensagem de erro e tratada no fluxo principal da pagina.
    }
  }

  return (
    <Card className="rounded-[1.5rem] border-border/60 bg-card/95 shadow-sm">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-xl font-semibold tracking-tight">
          Nova meta
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Crie um objetivo para acompanhar sua evolução.
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <section className="space-y-4 rounded-[1.25rem] border border-border/60 bg-background/55 p-4">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">
                Sua meta
              </h3>
              <p className="text-sm text-muted-foreground">
                Escolha um nome claro para o seu objetivo.
              </p>
            </div>

            <div className="space-y-2">
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
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className={`${fieldClassName} pl-11`}
                  placeholder="Ex.: Reserva de emergência"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-[1.25rem] border border-border/60 bg-background/55 p-4">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">
                Valores
              </h3>
              <p className="text-sm text-muted-foreground">
                Informe quanto quer alcançar e quanto já juntou.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
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
                    type="number"
                    step="0.01"
                    value={targetAmount}
                    onChange={(event) => setTargetAmount(event.target.value)}
                    className={`${fieldClassName} pl-11`}
                    placeholder="Ex.: 10000"
                  />
                </div>
              </div>

              <div className="space-y-2">
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
                    type="number"
                    step="0.01"
                    value={currentAmount}
                    onChange={(event) => setCurrentAmount(event.target.value)}
                    className={`${fieldClassName} pl-11`}
                    placeholder="Ex.: 1500"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-[1.25rem] border border-border/60 bg-background/55 p-4">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">
                Categoria e prazo
              </h3>
              <p className="text-sm text-muted-foreground">
                Se quiser, escolha uma categoria e defina uma data.
              </p>
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

                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="goal-deadline"
                    type="date"
                    min={getTodayDateValue()}
                    value={deadline}
                    onChange={(event) => setDeadline(event.target.value)}
                    className={`${fieldClassName} pl-11`}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3 rounded-[1.25rem] border border-border/60 bg-background/55 p-4">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">
                Salvar meta
              </h3>
              <p className="text-sm text-muted-foreground">
                Depois você pode atualizar o progresso quando quiser.
              </p>
            </div>

            <Button
              type="submit"
              className="h-11 w-full rounded-2xl"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Salvando..." : "Salvar meta"}
            </Button>
          </section>
        </form>
      </CardContent>
    </Card>
  );
}
