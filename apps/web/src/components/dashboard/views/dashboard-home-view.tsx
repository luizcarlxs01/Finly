import { DashboardEntryHeader } from "@/components/dashboard/dashboard-entry-header";

export type DashboardHomeViewProps = {
  onGoToTransactions: () => void;
};

export function DashboardHomeView({
  onGoToTransactions: _onGoToTransactions,
}: DashboardHomeViewProps) {
  return <DashboardEntryHeader />;
}
