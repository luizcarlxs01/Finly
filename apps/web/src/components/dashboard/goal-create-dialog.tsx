"use client";

import { GoalForm } from "@/components/dashboard/goal-form";
import { GoalGlassDialog } from "./goal-glass-dialog";

type Props = {
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  isSubmitting: boolean;
  errorMessage?: string | null;
  onAddGoal: React.ComponentProps<typeof GoalForm>["onAddGoal"];
  onClose: () => void;
};

export function GoalCreateDialog({ triggerRef, isSubmitting, errorMessage, onAddGoal, onClose }: Props) {
  return <GoalGlassDialog triggerRef={triggerRef} title="Nova meta" onClose={onClose}>
    {requestClose => <GoalForm isSubmitting={isSubmitting} errorMessage={errorMessage} onCancel={requestClose} onAddGoal={async input => { await onAddGoal(input); requestClose(); }} />}
  </GoalGlassDialog>;
}
