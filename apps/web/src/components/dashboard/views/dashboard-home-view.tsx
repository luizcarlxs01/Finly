import { DashboardEntryHeader } from "@/components/dashboard/dashboard-entry-header";

export type DashboardHomeViewProps = {
  onGoToTransactions: () => void;
};

export function DashboardHomeView({
  onGoToTransactions,
}: DashboardHomeViewProps) {
  function handleStartTransactions() {
    onGoToTransactions();
  }

  return <DashboardEntryHeader onStartTransactions={handleStartTransactions} />;
}
