import { DashboardEntryHeader } from "@/components/dashboard/dashboard-entry-header";

export type DashboardHomeViewProps = {
  onGoToTransactions: () => void;
  onOpenCalendar: () => void;
  onOpenStatementProjection: () => void;
};

export function DashboardHomeView({
  onGoToTransactions,
  onOpenCalendar,
  onOpenStatementProjection,
}: DashboardHomeViewProps) {
  function handleStartTransactions() {
    onGoToTransactions();
  }

  return (
    <DashboardEntryHeader
      onStartTransactions={handleStartTransactions}
      onOpenCalendar={onOpenCalendar}
      onOpenStatementProjection={onOpenStatementProjection}
    />
  );
}
