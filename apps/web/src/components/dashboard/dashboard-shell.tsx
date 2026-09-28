import type { ReactNode } from "react";

import type { DashboardView } from "@/components/layout/app-floating-header";

type DashboardShellProps = {
  activeView: DashboardView;
  homeView: ReactNode;
  transactionsView: ReactNode;
  goalsView: ReactNode;
  insightsView: ReactNode;
  forumView: ReactNode;
  downloadView: ReactNode;
};

export function DashboardShell({
  activeView,
  homeView,
  transactionsView,
  goalsView,
  insightsView,
  forumView,
  downloadView,
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

  if (activeView === "forum") {
    return <>{forumView}</>;
  }

  if (activeView === "download") {
    return <>{downloadView}</>;
  }

  return <>{insightsView}</>;
}
