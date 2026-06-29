import { DashboardEntryHeader } from "@/components/dashboard/dashboard-entry-header";

export type DashboardHomeViewProps = {
  onGoToTransactions: () => void;
  onOpenSchedule: () => void;
  onOpenStatementProjection: () => void;
};

export function DashboardHomeView({
  onGoToTransactions,
  onOpenSchedule,
  onOpenStatementProjection,
}: DashboardHomeViewProps) {
  function handleStartTransactions() {
    onGoToTransactions();
  }

  return (
    <DashboardEntryHeader
      onStartTransactions={handleStartTransactions}
      onOpenSchedule={onOpenSchedule}
      onOpenStatementProjection={onOpenStatementProjection}
    />
  );
}
