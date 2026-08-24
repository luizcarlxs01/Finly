import { HomeLanding } from "@/components/dashboard/home-landing/home-landing";

export type DashboardHomeViewProps = {
  onGoToTransactions: () => void;
  onOpenCalendar: () => void;
  onOpenStatementProjection: () => void;
};

export function DashboardHomeView({
  onGoToTransactions,
}: DashboardHomeViewProps) {
  return <HomeLanding onStartTransactions={onGoToTransactions} />;
}
