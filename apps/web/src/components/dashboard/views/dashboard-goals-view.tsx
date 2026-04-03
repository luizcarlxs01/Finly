import { GoalForm } from "@/components/dashboard/goal-form";
import { GoalList } from "@/components/dashboard/goal-list";
import type { Goal } from "@/types/goal";

type GoalInput = {
  title: string;
  targetAmount: number;
  currentAmount: number;
  category: string;
  deadline?: string;
};

export type DashboardGoalsViewProps = {
  goals: Goal[];
  totalGoalProgress: number;
  remainingGoalAmount: number;
  currencyFormatter: Intl.NumberFormat;
  onAddGoal: (input: GoalInput) => void;
  onUpdateProgress: (goal: Goal) => void;
  onRemoveGoal: (id: string) => void;
};

export function DashboardGoalsView({
  goals,
  totalGoalProgress,
  remainingGoalAmount,
  currencyFormatter,
  onAddGoal,
  onUpdateProgress,
  onRemoveGoal,
}: DashboardGoalsViewProps) {
  return (
    <section className="rounded-[2rem] border border-border/70 bg-card/70 p-5 shadow-sm sm:p-6 lg:p-7">
      <div className="space-y-6">
        <div className="flex flex-col gap-5 border-b border-border/60 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Metas
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Planejamento financeiro local
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Cadastre objetivos, acompanhe o progresso manualmente e visualize
              quanto ainda falta para concluir cada meta.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Metas ativas
              </p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {goals.length}
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Acumulado
              </p>
              <p className="mt-1 text-xl font-semibold text-foreground">
                {currencyFormatter.format(totalGoalProgress)}
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Restante
              </p>
              <p className="mt-1 text-xl font-semibold text-foreground">
                {currencyFormatter.format(remainingGoalAmount)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 2xl:grid-cols-[minmax(360px,420px)_minmax(0,1fr)] 2xl:items-start">
          <aside className="min-w-0 2xl:sticky 2xl:top-24">
            <GoalForm onAddGoal={onAddGoal} />
          </aside>

          <div className="min-w-0 space-y-5">
            <GoalList
              goals={goals}
              onUpdateProgress={onUpdateProgress}
              onRemoveGoal={onRemoveGoal}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
