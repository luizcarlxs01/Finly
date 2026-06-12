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
  isSubmitting?: boolean;
  areActionsDisabled?: boolean;
  goals: Goal[];
  totalGoalProgress: number;
  remainingGoalAmount: number;
  currencyFormatter: Intl.NumberFormat;
  onAddGoal: (input: GoalInput) => void;
  onUpdateProgress: (goal: Goal) => void;
  onRemoveGoal: (id: string) => void;
};

export function DashboardGoalsView({
  isSubmitting = false,
  areActionsDisabled = false,
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
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Metas
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Organize seus objetivos e acompanhe o quanto falta para chegar lá.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.25rem] border border-border/60 bg-background/60 px-4 py-3">
              <p className="text-xs text-muted-foreground">Metas ativas</p>
              <p className="mt-1 text-xl font-semibold text-foreground">
                {goals.length}
              </p>
            </div>

            <div className="rounded-[1.25rem] border border-border/60 bg-background/60 px-4 py-3">
              <p className="text-xs text-muted-foreground">Acumulado</p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {currencyFormatter.format(totalGoalProgress)}
              </p>
            </div>

            <div className="rounded-[1.25rem] border border-border/60 bg-background/60 px-4 py-3">
              <p className="text-xs text-muted-foreground">Falta</p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {currencyFormatter.format(remainingGoalAmount)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 2xl:grid-cols-[minmax(360px,420px)_minmax(0,1fr)] 2xl:items-start">
          <aside className="min-w-0 2xl:sticky 2xl:top-24">
            <GoalForm onAddGoal={onAddGoal} isSubmitting={isSubmitting} />
          </aside>

          <div className="min-w-0 space-y-5">
            <GoalList
              goals={goals}
              onUpdateProgress={onUpdateProgress}
              onRemoveGoal={onRemoveGoal}
              actionsDisabled={areActionsDisabled}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
