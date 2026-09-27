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
  accountView: ReactNode;
};

export function DashboardShell({
  activeView,
  homeView,
  transactionsView,
  goalsView,
  insightsView,
  forumView,
  downloadView,
  accountView,
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

  if (activeView === "account") {
    return <>{accountView}</>;
  }

  return <>{insightsView}</>;
}
