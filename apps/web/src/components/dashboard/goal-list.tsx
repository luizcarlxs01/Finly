"use client";

import { CalendarDays, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Goal } from "@/types/goal";
import { getTransactionCategoryLabel } from "@/types/transaction-category";
import { formatBusinessDateBr } from "@/utils/date-format";

type GoalListProps = {
  goals: Goal[];
  onUpdateProgress: (goal: Goal) => void;
  onRemoveGoal: (id: string) => void;
  actionsDisabled?: boolean;
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function getGoalCategoryLabel(category: string) {
  return category === "general" ? "Geral" : getTransactionCategoryLabel(category);
}

function getGoalProgress(goal: Goal) {
  if (goal.targetAmount <= 0) {
    return 0;
  }

  return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
}

function getRemainingAmount(goal: Goal) {
  return Math.max(goal.targetAmount - goal.currentAmount, 0);
}

export function GoalList({
  goals,
  onUpdateProgress,
  onRemoveGoal,
  actionsDisabled = false,
}: GoalListProps) {
  if (goals.length === 0) {
    return (
      <Card className="rounded-[1.75rem] border border-dashed border-border/70 bg-card/80 shadow-sm">
        <CardContent className="p-8 text-center">
          <p className="text-base font-medium text-foreground">
            Nenhuma meta por aqui ainda
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Crie uma meta para começar a acompanhar sua evolução.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {goals.map((goal) => {
        const progress = getGoalProgress(goal);
        const remainingAmount = getRemainingAmount(goal);

        return (
          <Card
            key={goal.id}
            className="rounded-[1.5rem] border border-border/60 bg-card/95 shadow-sm transition-colors hover:bg-card"
          >
            <CardContent className="space-y-4 p-5 sm:p-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {goal.title}
                      </h3>

                      <span className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                        {getGoalCategoryLabel(goal.category)}
                      </span>

                      {goal.deadline ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                          <CalendarDays className="size-3.5" />
                          {formatBusinessDateBr(goal.deadline) ?? goal.deadline}
                        </span>
                      ) : null}
                    </div>

                    <div className="space-y-2 rounded-[1.25rem] border border-border/60 bg-background/55 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-foreground">
                          Progresso
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {progress.toFixed(0)}%
                        </p>
                      </div>

                      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-[width]"
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-[1rem] border border-border/60 bg-card/75 p-3">
                          <p className="text-xs text-muted-foreground">Meta</p>
                          <p className="mt-1 text-sm font-semibold text-foreground">
                            {currencyFormatter.format(goal.targetAmount)}
                          </p>
                        </div>

                        <div className="rounded-[1rem] border border-border/60 bg-card/75 p-3">
                          <p className="text-xs text-muted-foreground">Guardado</p>
                          <p className="mt-1 text-sm font-semibold text-foreground">
                            {currencyFormatter.format(goal.currentAmount)}
                          </p>
                        </div>

                        <div className="rounded-[1rem] border border-border/60 bg-card/75 p-3">
                          <p className="text-xs text-muted-foreground">Falta</p>
                          <p className="mt-1 text-sm font-semibold text-foreground">
                            {currencyFormatter.format(remainingAmount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-2 sm:flex-row xl:flex-col">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-2xl"
                    disabled={actionsDisabled}
                    onClick={() => onUpdateProgress(goal)}
                  >
                    <Pencil className="size-4" />
                    Atualizar progresso
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    className="rounded-2xl"
                    disabled={actionsDisabled}
                    onClick={() => onRemoveGoal(goal.id)}
                  >
                    <Trash2 className="size-4" />
                    Remover
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
