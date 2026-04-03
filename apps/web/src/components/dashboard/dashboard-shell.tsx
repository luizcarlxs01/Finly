import type { ReactNode } from "react";

import type { DashboardView } from "@/components/layout/app-floating-header";

type DashboardShellProps = {
  activeView: DashboardView;
  homeView: ReactNode;
  transactionsView: ReactNode;
  goalsView: ReactNode;
  insightsView: ReactNode;
};

export function DashboardShell({
  activeView,
  homeView,
  transactionsView,
  goalsView,
  insightsView,
}: DashboardShellProps) {
  if (activeView === "home") {
    return <>{homeView}</>;
  }

  if (activeView === "transactions") {
    return <>{transactionsView}</>;
  }

  if (activeView === "goals") {
    return <>{goalsView}</>;
  }

  return <>{insightsView}</>;
}
